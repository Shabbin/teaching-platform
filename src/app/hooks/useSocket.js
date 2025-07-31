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

  // Knock sound audio ref added here
  const knockAudioRef = useRef(null);

  // Initialize knock audio once on mount
  useEffect(() => {
    knockAudioRef.current = new Audio('/knock.mp3');  // Your existing file inside public/
  }, []);

  // Current open thread from redux
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
      // Normalize senderId and userId to strings for safe comparison
      const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id?.toString();
      const myUserId = userId?.toString();

      const isMyMessage = senderId === myUserId;
      const isCurrentThread = currentThreadId === message.threadId;

      dispatch(addMessageToThread({ threadId: message.threadId, message }));
      dispatch(updateLastMessageInConversation({ threadId: message.threadId, message }));

      // Play knock sound if message from others and user NOT viewing that thread
      if (!isMyMessage && !isCurrentThread) {
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
