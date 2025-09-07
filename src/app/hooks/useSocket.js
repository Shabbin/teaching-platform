// hooks/useSocket.js
'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import {
  addMessageToThread,
  updateLastMessageInConversation,
  addOrUpdateConversation,
  incrementUnreadCount,
  resetUnreadCount,
  setOnlineUserIds,
  setCurrentThreadId,
  // ✅ presence helpers (make sure these exist in your slice)
  addOnlineUserId,
  removeOnlineUserId,
} from '../redux/chatSlice';
import { normalizeMessage } from '../redux/chatThunks';
import { addPostViewEvent, updatePostViewsCount } from '../redux/postViewEventSlice';
import { addNotification } from '../redux/notificationSlice';

// 🔧 Env-driven socket URL (falls back to API base, then localhost)
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:5000';

// ---- helpers for stable identity
const isGenericName = (n) => !n || n === 'User' || n === 'Unknown' || n === 'No Name';

function deriveOtherFromPayload(payload, myId) {
  // Prefer participants from payload if present
  if (Array.isArray(payload?.participants) && myId) {
    const other = payload.participants.find((p) => String(p?._id) !== String(myId));
    if (other) return other;
  }
  // If the sender is not me, use sender as "other"
  if (payload?.sender && String(payload.sender._id || payload.senderId) !== String(myId)) {
    const s = payload.sender;
    return {
      _id: s._id || payload.senderId,
      name: s.name,
      profileImage: s.profileImage,
    };
  }
  return null;
}

// Normalize any user-ish thing to a string id
const asId = (u) => {
  if (!u) return '';
  if (typeof u === 'object') return String(u._id || u.id || '');
  return String(u);
};

export default function useSocket(
  userId,
  onNewMessage,
  onRequestUpdate,
  onMessageAlert,
  onNotification // optional
) {
  const socketRef = useRef();
  const dispatch = useDispatch();

  const knockAudioRef = useRef(null);
  const lastKnockTimeRef = useRef(0);

  const currentThreadId = useSelector((state) => state.chat.currentThreadId);
  const conversations = useSelector((state) => state.chat.conversations || []);

  // Load knock audio
  useEffect(() => {
    knockAudioRef.current = new Audio('/knock.mp3');
  }, []);

  const playKnock = () => {
    const now = Date.now();
    if (now - lastKnockTimeRef.current < 500) return;
    const audio = knockAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
      lastKnockTimeRef.current = now;
    }
  };

  // ---- socket lifecycle
  useEffect(() => {
    if (!userId) return;

    // OPTIONAL auth fallback: forward client token if you store one (otherwise cookies are used)
    let tokenFromStorage;
    try {
      tokenFromStorage =
        typeof window !== 'undefined' &&
        (localStorage.getItem('token') || localStorage.getItem('jwt') || null);
    } catch (_) {}

    // ✅ Create (or reuse) the socket
    socketRef.current =
      (typeof window !== 'undefined' && window.socket) ||
      io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket'],
        auth: tokenFromStorage ? { token: tokenFromStorage } : undefined,
      });

    // ✅ EXPOSE the shared socket globally so NotificationBell / pages can use it
    if (typeof window !== 'undefined') {
      window.socket = socketRef.current;
    }

    const s = socketRef.current;

    // -------- CONNECT
    s.on('connect', () => {
      // announce presence & request initial list
      s.emit('presence:join', { userId: String(userId) });
      s.emit('presence:who', {}, (ids = []) => {
        dispatch(setOnlineUserIds(ids.map(asId)));
      });
      // some servers only send this:
      s.emit('who_is_online', {}, (ids = []) => {
        if (Array.isArray(ids) && ids.length) dispatch(setOnlineUserIds(ids.map(asId)));
      });
      // fall back log
      // console.log('[useSocket] connected:', s.id);
    });

    // -------- PRESENCE LIST (various server spellings supported)
    s.on('presence:list', (ids) => dispatch(setOnlineUserIds((ids || []).map(asId))));
    s.on('online_users', (ids) => dispatch(setOnlineUserIds((ids || []).map(asId))));

    // single-user presence deltas
    s.on('presence:online', (id) => dispatch(addOnlineUserId(asId(id))));
    s.on('presence:offline', (id) => dispatch(removeOnlineUserId(asId(id))));
    s.on('user_online', (u) => dispatch(addOnlineUserId(asId(u))));
    s.on('user_offline', (u) => dispatch(removeOnlineUserId(asId(u))));
    s.on('user_connected', (u) => dispatch(addOnlineUserId(asId(u))));
    s.on('user_disconnected', (u) => dispatch(removeOnlineUserId(asId(u))));

    // -------- MESSAGING
    s.on('new_message', (message) => {
      const normalizedMessage = normalizeMessage(message);
      if (!normalizedMessage) return;

      const myUserId = userId?.toString();
      const senderId =
        normalizedMessage.sender?._id?.toString() || normalizedMessage.senderId?.toString();
      const isMyMessage = senderId === myUserId;
      const isCurrentThread = currentThreadId === normalizedMessage.threadId;

      // Find existing convo for stable display fields
      const existing = conversations.find(
        (c) => c.threadId === normalizedMessage.threadId
      );

      // Compute other party (from payload) and *only* set if we don't already have a good one
      let displayName = existing?.displayName;
      let displayProfileImage = existing?.displayProfileImage;

      if (!displayName || isGenericName(displayName) || !displayProfileImage) {
        const other = deriveOtherFromPayload(normalizedMessage, myUserId);
        if (other) {
          if (!displayName || isGenericName(displayName)) {
            if (other.name && !isGenericName(other.name)) displayName = other.name;
          }
          if (!displayProfileImage && other.profileImage) {
            displayProfileImage = other.profileImage;
          }
        }
        // ultimate fallback – deterministic avatar so it never looks random
        if (!displayProfileImage) {
          const seed =
            (other?._id ||
              existing?.participantId ||
              existing?.studentId ||
              existing?.teacherId ||
              normalizedMessage.threadId ||
              'unknown') + '';
          displayProfileImage = `https://i.pravatar.cc/150?u=${seed}`;
        }
        if (!displayName) displayName = existing?.name || 'Unknown';
      }

      // ---- store message
      dispatch(
        addMessageToThread({
          threadId: normalizedMessage.threadId,
          message: normalizedMessage,
        })
      );

      dispatch(
        updateLastMessageInConversation({
          threadId: normalizedMessage.threadId,
          message: normalizedMessage,
        })
      );

      // ---- update/insert conversation WITHOUT downgrading identity
      dispatch(
        addOrUpdateConversation({
          threadId: normalizedMessage.threadId,
          lastMessage: normalizedMessage.text,
          lastMessageTimestamp: normalizedMessage.timestamp,
          sender: normalizedMessage.sender,
          // stable identity fields (preserved by reducer if already set)
          displayName,
          displayProfileImage,
        })
      );

      if (!isMyMessage && !isCurrentThread) {
        dispatch(incrementUnreadCount({ threadId: normalizedMessage.threadId }));
        playKnock();
      }

      if (!isMyMessage && !isCurrentThread && typeof onNewMessage === 'function') {
        onNewMessage(normalizedMessage);
      }
    });

    // -------- NOTIFICATIONS / MISC
    s.on('new_notification', (notification) => {
      if (notification.read === undefined) notification.read = false;
      dispatch(addNotification(notification));
      if (typeof onNotification === 'function') onNotification(notification);
    });

    s.on('schedules_refresh', (payload) => {
      if (typeof onNotification === 'function') {
        onNotification({ type: 'schedules_refresh', payload });
      }
    });

    s.on('conversation_list_updated', (fullThread) => {
      // preserve/compute display on server push
      const myId = userId?.toString();
      const existing = conversations.find((c) => c.threadId === fullThread.threadId);
      let displayName = existing?.displayName;
      let displayProfileImage = existing?.displayProfileImage;

      if (!displayName || isGenericName(displayName) || !displayProfileImage) {
        const other = deriveOtherFromPayload(fullThread, myId);
        if (other?.name && !isGenericName(other.name)) displayName = other.name;
        if (other?.profileImage) displayProfileImage = other.profileImage;
      }
      if (!displayProfileImage) {
        const seed =
          fullThread?.participantId ||
          fullThread?.studentId ||
          fullThread?.teacherId ||
          fullThread?.threadId ||
          'unknown';
        displayProfileImage = `https://i.pravatar.cc/150?u=${seed}`;
      }

      dispatch(
        addOrUpdateConversation({
          ...fullThread,
          displayName,
          displayProfileImage,
        })
      );
    });

    s.on('new_message_alert', (alert) => {
      if (typeof onMessageAlert === 'function') onMessageAlert(alert);
    });

    s.on('post_view_event', (event) => {
      dispatch(addPostViewEvent(event));
      dispatch(updatePostViewsCount({ postId: event.postId, viewsCount: event.viewsCount }));
    });

    // -------- TUITION REQUESTS
    s.on('new_tuition_request', (data) => {
      const lastMsgText = data.lastMessageText?.trim() || 'New tuition request received';
      const lastMsgTimestamp = data.lastMessageTimestamp || new Date().toISOString();

      const realMessage = {
        _id: `tuition-${Date.now()}`,
        text: lastMsgText,
        senderId: data.studentId,
        senderName: data.studentName || 'Student',
        threadId: data.threadId,
        timestamp: lastMsgTimestamp,
        isSystemMessage: true,
      };

      // derive stable display
      const myId = userId?.toString();
      const isCurrentUserStudent = myId === String(data.studentId);
      const otherName = isCurrentUserStudent ? data.teacherName : data.studentName;
      const otherImage = isCurrentUserStudent
        ? data.teacherProfileImage
        : data.studentProfileImage;

      const displayName = !isGenericName(otherName) ? otherName : 'Unknown';
      const displayProfileImage =
        otherImage ||
        `https://i.pravatar.cc/150?u=${data.teacherId || data.studentId || data.threadId}`;

      dispatch(addMessageToThread({ threadId: data.threadId, message: realMessage }));
      dispatch(updateLastMessageInConversation({ threadId: data.threadId, message: realMessage }));
      dispatch(incrementUnreadCount({ threadId: data.threadId }));

      dispatch(
        addOrUpdateConversation({
          threadId: data.threadId,
          requestId: data.request?._id,
          studentId: data.studentId,
          teacherId: data.teacherId,
          studentName: data.studentName,
          teacherName: data.teacherName,
          participants: data.participants,
          lastMessage: lastMsgText,
          lastMessageTimestamp: lastMsgTimestamp,
          messages: [realMessage],
          status: 'pending',
          // stable identity
          displayName,
          displayProfileImage,
        })
      );

      playKnock();
      if (typeof onNewMessage === 'function') onNewMessage(realMessage);
      if (typeof onRequestUpdate === 'function') onRequestUpdate({ type: 'new', ...data });
    });

    s.on('request_update', (data) => {
      if (data.type === 'approved' && data.studentId === userId) {
        dispatch(setCurrentThreadId(data.threadId));
      }
    });

    s.on('request_approved', (data) => {
      const { threadId, requestId, timestamp } = data;

      const approvalMessage = {
        _id: `approval-${Date.now()}`,
        text: 'Your tuition request was approved!',
        senderId: 'system',
        threadId,
        timestamp,
        isSystemMessage: true,
      };

      dispatch(addMessageToThread({ threadId, message: approvalMessage }));
      dispatch(updateLastMessageInConversation({ threadId, message: approvalMessage }));
      dispatch(resetUnreadCount({ threadId }));

      dispatch(
        addOrUpdateConversation({
          threadId,
          requestId,
          lastMessage: approvalMessage.text,
          lastMessageTimestamp: approvalMessage.timestamp,
          status: 'approved',
        })
      );

      if (typeof onRequestUpdate === 'function') {
        onRequestUpdate({ type: 'approved', threadId, requestId, timestamp });
      }

      playKnock();
    });

    s.on('mark_thread_read', ({ threadId, userId: senderUserId }) => {
      const myUserId = userId?.toString();
      if (senderUserId === myUserId && threadId === currentThreadId) {
        dispatch(resetUnreadCount({ threadId }));
      }
    });

    s.on('request_rejected', (data) => {
      const { threadId, requestId, timestamp, rejectionMessage } = data;

      const rejectionMessageObj = {
        _id: `rejection-${Date.now()}`,
        text: `Your tuition request was rejected. ${rejectionMessage || ''}`,
        senderId: 'system',
        threadId,
        timestamp,
        isSystemMessage: true,
      };

      dispatch(addMessageToThread({ threadId, message: rejectionMessageObj }));
      dispatch(updateLastMessageInConversation({ threadId, message: rejectionMessageObj }));
      dispatch(resetUnreadCount({ threadId }));

      dispatch(
        addOrUpdateConversation({
          threadId,
          requestId,
          lastMessage: rejectionMessageObj.text,
          lastMessageTimestamp: rejectionMessageObj.timestamp,
          status: 'rejected',
        })
      );

      if (typeof onRequestUpdate === 'function') {
        onRequestUpdate({ type: 'rejected', threadId, requestId, timestamp });
      }
    });

    s.on('disconnect', (reason) => {
      // console.log('[useSocket] disconnected:', reason);
    });

    // Cleanup: remove this hook's listeners but DON'T disconnect the shared socket
    return () => {
      if (!socketRef.current) return;
      const sc = socketRef.current;

      sc.off('connect');

      // presence
      sc.off('presence:list');
      sc.off('online_users');
      sc.off('presence:online');
      sc.off('presence:offline');
      sc.off('user_online');
      sc.off('user_offline');
      sc.off('user_connected');
      sc.off('user_disconnected');

      // messaging / misc
      sc.off('new_message');
      sc.off('new_notification');
      sc.off('schedules_refresh');
      sc.off('conversation_list_updated');
      sc.off('new_message_alert');
      sc.off('post_view_event');
      sc.off('new_tuition_request');
      sc.off('request_update');
      sc.off('request_approved');
      sc.off('request_rejected');
      sc.off('mark_thread_read');
      sc.off('disconnect');

      if (typeof window === 'undefined' || window.socket !== sc) {
        sc.disconnect();
      }
    };
  }, [
    userId,
    dispatch,
    onNewMessage,
    onRequestUpdate,
    onMessageAlert,
    onNotification,
    currentThreadId,
    conversations,
  ]);

  const joinThread = (threadId) => {
    if (socketRef.current && threadId) {
      socketRef.current.emit('join_thread', threadId);
    }
  };

  const sendMessage = (messageData) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
    }
  };

  const emitMarkThreadRead = (threadId) => {
    if (socketRef.current && threadId) {
      socketRef.current.emit('mark_thread_read', { threadId, userId });
      // console.log(`[useSocket] Emitted mark_thread_read for thread ${threadId}`);
    }
  };

  return { joinThread, sendMessage, emitMarkThreadRead, socketRef };
}
