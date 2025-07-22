import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { addMessageToThread, updateConversationStatus } from '../redux/chatSlice';

const SOCKET_URL = 'http://localhost:5000';

export default function useSocket(userId) {
  const socketRef = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId },
    });

    socketRef.current.on('connect', () => {
      console.log('[useSocket] connected:', socketRef.current.id);
    });

    socketRef.current.on('new_message', (message) => {
      console.log('[useSocket] new_message:', message);

      // Dispatch a thunk to access getState and prevent duplicate message
      dispatch((dispatch, getState) => {
        const state = getState();
        const messages = state.chat.messagesByThread?.[message.threadId] || [];
        const exists = messages.some(m => m._id === message._id);

        if (!exists) {
          dispatch(addMessageToThread({ threadId: message.threadId, message }));
        } else {
          console.log('[useSocket] Duplicate message skipped in dispatch');
        }
      });
    });

    socketRef.current.on('request_update', (data) => {
      console.log('[useSocket] request_update:', data);
      dispatch(updateConversationStatus({ requestId: data.requestId, status: data.status }));
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[useSocket] disconnected:', reason);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [userId, dispatch]);

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
