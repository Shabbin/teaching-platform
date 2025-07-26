import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import {
  addMessageToThread,
  updateConversationStatus,
  updateLastMessageInConversation,
} from '../redux/chatSlice';

const SOCKET_URL = 'http://localhost:5000';
const knockSound = typeof Audio !== 'undefined' ? new Audio('/knock.mp3') : null;

export default function useSocket(userId, onNewMessage, onRequestUpdate) {
  const socketRef = useRef();
  const dispatch = useDispatch();

  const currentThreadId = useSelector((state) => state.chat.currentThreadId); // <-- Add this in your slice

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId },
    });

    socketRef.current.on('connect', () => {
      console.log('[useSocket] connected:', socketRef.current.id);
    });

    socketRef.current.on('new_message', (message) => {
      const senderId =
        typeof message.senderId === 'string'
          ? message.senderId
          : message.senderId?._id;

      console.log('[useSocket] new_message received:', message);

      // 1. Dispatch state updates
      dispatch((dispatch, getState) => {
        const state = getState();
        const threadMessages = state.chat.messagesByThread?.[message.threadId] || [];
        const alreadyExists = threadMessages.some((m) => m._id === message._id);

        if (!alreadyExists) {
          dispatch(addMessageToThread({ threadId: message.threadId, message }));
          dispatch(updateLastMessageInConversation({ threadId: message.threadId, message }));
        }

        // 2. Play knock sound if:
        const isMyMessage = senderId === userId;
        const isCurrentThread = currentThreadId === message.threadId;

        if (!isMyMessage && !isCurrentThread && !alreadyExists) {
          if (knockSound) {
            knockSound.currentTime = 0;
            knockSound.play().catch((err) => console.log('Sound error:', err));
          }
        }
      });

      // 3. Custom message callback (optional)
      if (typeof onNewMessage === 'function') {
        onNewMessage(message);
      }
    });

    socketRef.current.on('request_update', (data) => {
      console.log('[useSocket] request_update:', data);

      if (typeof onRequestUpdate === 'function') {
        onRequestUpdate(data);
      }

      dispatch(updateConversationStatus({ requestId: data.requestId, status: data.status }));
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[useSocket] disconnected:', reason);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [userId, dispatch, onNewMessage, onRequestUpdate, currentThreadId]);

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
