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
  setCurrentThreadId, // ✅ needed for request_update handler
} from '../redux/chatSlice';
import { normalizeMessage } from '../redux/chatThunks';
import { addPostViewEvent, updatePostViewsCount } from '../redux/postViewEventSlice';
import { addNotification } from '../redux/notificationSlice';

// 🔧 Env-driven socket URL (falls back to API base, then localhost)
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:5000';

export default function useSocket(userId, onNewMessage, onRequestUpdate, onMessageAlert) {
  const socketRef = useRef();
  const dispatch = useDispatch();

  const knockAudioRef = useRef(null);
  const lastKnockTimeRef = useRef(0);

  const currentThreadId = useSelector((state) => state.chat.currentThreadId);

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

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('[useSocket] connected:', socketRef.current.id);
    });

    socketRef.current.on('online_users', (onlineUserIds) => {
      console.log('[socket] online_users received:', onlineUserIds);
      dispatch(setOnlineUserIds(onlineUserIds));
    });

    socketRef.current.on('new_message', (message) => {
      const normalizedMessage = normalizeMessage(message);
      if (!normalizedMessage) return;

      const senderId = normalizedMessage.sender?._id?.toString() || normalizedMessage.senderId;
      const myUserId = userId?.toString();
      const isMyMessage = senderId === myUserId;
      const isCurrentThread = currentThreadId === normalizedMessage.threadId;

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

      dispatch(
        addOrUpdateConversation({
          threadId: normalizedMessage.threadId,
          lastMessage: normalizedMessage.text,
          lastMessageTimestamp: normalizedMessage.timestamp,
          sender: normalizedMessage.sender,
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

    socketRef.current.on('new_notification', (notification) => {
      if (notification.read === undefined) notification.read = false;
      dispatch(addNotification(notification));
    });

    socketRef.current.on('conversation_list_updated', (fullThread) => {
      console.log('[socket] conversation_list_updated received:', fullThread);
      dispatch(addOrUpdateConversation(fullThread));
    });

    socketRef.current.on('new_message_alert', (alert) => {
      if (typeof onMessageAlert === 'function') {
        onMessageAlert(alert);
      }
    });

    socketRef.current.on('post_view_event', (event) => {
      console.log('[socket] post_view_event received:', event);
      dispatch(addPostViewEvent(event));
      dispatch(
        updatePostViewsCount({
          postId: event.postId,
          viewsCount: event.viewsCount,
        })
      );
    });

    socketRef.current.on('new_tuition_request', (data) => {
      console.log('[socket] new_tuition_request received:', data);

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

      dispatch(addMessageToThread({ threadId: data.threadId, message: realMessage }));
      dispatch(updateLastMessageInConversation({ threadId: data.threadId, message: realMessage }));
      dispatch(incrementUnreadCount({ threadId: data.threadId }));

      const isCurrentUserStudent = userId === data.studentId;
      const otherName = isCurrentUserStudent ? data.teacherName : data.studentName;
      const otherImage = isCurrentUserStudent
        ? data.teacherProfileImage || 'https://via.placeholder.com/40'
        : data.studentProfileImage || 'https://via.placeholder.com/40';

      dispatch(
        addOrUpdateConversation({
          threadId: data.threadId,
          requestId: data.request?._id,
          studentId: data.studentId,
          teacherId: data.teacherId,
          studentName: data.studentName,
          teacherName: data.teacherName,
          name: otherName,
          profileImage: otherImage,
          participants: data.participants,
          lastMessage: lastMsgText,
          lastMessageTimestamp: lastMsgTimestamp,
          messages: [realMessage],
          status: 'pending',
        })
      );

      playKnock();

      if (typeof onNewMessage === 'function') {
        onNewMessage(realMessage);
      }

      if (typeof onRequestUpdate === 'function') {
        onRequestUpdate({ type: 'new', ...data });
      }
    });

    socketRef.current.on('request_update', (data) => {
      if (data.type === 'approved' && data.studentId === userId) {
        dispatch(setCurrentThreadId(data.threadId));
      }
    });

    socketRef.current.on('request_approved', (data) => {
      console.log('[socket] request_approved received:', data);

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

    socketRef.current.on('mark_thread_read', ({ threadId, userId: senderUserId }) => {
      const myUserId = userId?.toString();
      if (senderUserId === myUserId && threadId === currentThreadId) {
        console.log(`[socket] mark_thread_read received for thread ${threadId}`);
        dispatch(resetUnreadCount({ threadId }));
      }
    });

    socketRef.current.on('request_rejected', (data) => {
      console.log('[socket] request_rejected received:', data);

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

    socketRef.current.on('disconnect', (reason) => {
      console.log('[useSocket] disconnected:', reason);
    });

    // Cleanup all listeners on unmount or userId change
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('online_users');
        socketRef.current.off('new_message');
        socketRef.current.off('new_notification'); // ✅ cleanup added
        socketRef.current.off('conversation_list_updated');
        socketRef.current.off('new_message_alert');
        socketRef.current.off('post_view_event');
        socketRef.current.off('new_tuition_request');
        socketRef.current.off('request_update');
        socketRef.current.off('request_approved');
        socketRef.current.off('request_rejected'); // ✅ cleanup added
        socketRef.current.off('mark_thread_read');
        socketRef.current.off('disconnect');
        socketRef.current.disconnect();
      }
    };
  }, [userId, dispatch, onNewMessage, onRequestUpdate, onMessageAlert, currentThreadId]);

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
      console.log(`[useSocket] Emitted mark_thread_read for thread ${threadId}`);
    }
  };

  return { joinThread, sendMessage, emitMarkThreadRead };
}
