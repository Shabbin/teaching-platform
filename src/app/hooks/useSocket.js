import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import {
  addMessageToThread,
  updateLastMessageInConversation,
  addOrUpdateConversation,
} from '../redux/chatSlice';

const SOCKET_URL = 'http://localhost:5000';

export default function useSocket(userId, onNewMessage, onRequestUpdate, onMessageAlert) {
  const socketRef = useRef();
  const dispatch = useDispatch();

  // For example, current open chat thread
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
      const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
      const isMyMessage = senderId === userId;
      const isCurrentThread = currentThreadId === message.threadId;

      const state = dispatch.getState?.() || {}; // or import your store and call store.getState()
      // Check if message already exists, skip duplicates
      // You can add a similar deduplication here if needed

      dispatch(addMessageToThread({ threadId: message.threadId, message }));
      dispatch(updateLastMessageInConversation({ threadId: message.threadId, message }));

      if (!isMyMessage && !isCurrentThread && onNewMessage) {
        onNewMessage(message);
      }
    });

  socketRef.current.on('conversation_list_updated', (fullThread) => {
  console.log('[socket] conversation_list_updated received:', fullThread);
  dispatch(addOrUpdateConversation(fullThread));
});

    socketRef.current.on('new_message_alert', (alert) => {
      console.log('[useSocket] new_message_alert:', alert);
      if (typeof onMessageAlert === 'function') {
        onMessageAlert(alert);
      }
      // You could trigger a UI notification or badge here
    });

    socketRef.current.on('request_update', (data) => {
      if (typeof onRequestUpdate === 'function') {
        onRequestUpdate(data);
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

  return { joinThread, sendMessage };
}
