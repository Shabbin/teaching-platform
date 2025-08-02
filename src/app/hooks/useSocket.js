import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import {
  addMessageToThread,
  updateLastMessageInConversation,
  addOrUpdateConversation,
  incrementUnreadCount,
  resetUnreadCount,
} from '../redux/chatSlice';

const SOCKET_URL = 'http://localhost:5000';

export default function useSocket(userId, onNewMessage, onRequestUpdate, onMessageAlert) {
  const socketRef = useRef();
  const dispatch = useDispatch();

  const knockAudioRef = useRef(null);

  useEffect(() => {
    knockAudioRef.current = new Audio('/knock.mp3');
  }, []);

  const currentThreadId = useSelector((state) => state.chat.currentThreadId);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId },
    });

    socketRef.current.on('connect', () => {
      console.log('[useSocket] connected:', socketRef.current.id);
    });

    socketRef.current.on('new_message', (message) => {
      const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id?.toString();
      const myUserId = userId?.toString();

      const isMyMessage = senderId === myUserId;
      const isCurrentThread = currentThreadId === message.threadId;

      dispatch(addMessageToThread({ threadId: message.threadId, message }));
      dispatch(updateLastMessageInConversation({ threadId: message.threadId, message }));

      if (!isMyMessage && !isCurrentThread) {
        dispatch(incrementUnreadCount({ threadId: message.threadId }));
        knockAudioRef.current.play().catch((e) => {
          console.warn('Audio play prevented:', e);
        });
      }

      if (!isMyMessage && !isCurrentThread && onNewMessage) {
        onNewMessage(message);
      }
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

    socketRef.current.on('request_update', (data) => {
      if (typeof onRequestUpdate === 'function') {
        onRequestUpdate(data);
      }
    });
socketRef.current.on('new_tuition_request', (data) => {
  console.log('[socket] new_tuition_request received:', data);

  // Use real last message text & timestamp from payload, fallback to placeholder if missing
  const lastMsgText = data.lastMessageText && data.lastMessageText.trim() !== '' 
    ? data.lastMessageText 
    : 'New tuition request received';

  const lastMsgTimestamp = data.lastMessageTimestamp || new Date().toISOString();

  const realMessage = {
    _id: `tuition-${Date.now()}`, // unique temp ID
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

  dispatch(
    addOrUpdateConversation({
      threadId: data.threadId,
      requestId: data.request?._id,
      studentId: data.studentId,
      teacherId: data.teacherId,
      studentName: data.studentName,
      teacherName: data.teacherName,
      name: userId === data.studentId ? data.teacherName : data.studentName,
      participants: data.participants,
      lastMessage: lastMsgText,
      lastMessageTimestamp: lastMsgTimestamp,
      messages: [realMessage],
      status: 'pending',
    })
  );

  knockAudioRef.current.play().catch((e) => {
    console.warn('Audio play prevented:', e);
  });

  if (typeof onNewMessage === 'function') {
    onNewMessage(realMessage);
  }

  if (typeof onRequestUpdate === 'function') {
    onRequestUpdate({ type: 'new', ...data });
  }
});



    socketRef.current.on('mark_thread_read', ({ threadId, userId: senderUserId }) => {
      const myUserId = userId?.toString();
      if (senderUserId === myUserId && threadId === currentThreadId) {
        console.log(`[socket] mark_thread_read received for thread ${threadId}`);
        dispatch(resetUnreadCount({ threadId }));
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[useSocket] disconnected:', reason);
    });

    return () => {
      if (socketRef.current) {
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

  // NEW function to emit mark_thread_read event
  const emitMarkThreadRead = (threadId) => {
    if (socketRef.current && threadId) {
      socketRef.current.emit('mark_thread_read', { threadId, userId });
      console.log(`[useSocket] Emitted mark_thread_read for thread ${threadId}`);
    }
  };

  return { joinThread, sendMessage, emitMarkThreadRead };
}
