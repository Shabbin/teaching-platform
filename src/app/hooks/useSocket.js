import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export default function useSocket(userId, onMessage, onRequestUpdate) {
  const socketRef = useRef();

  useEffect(() => {
    if (!userId) return;

    console.log('[useSocket] Connecting socket for userId:', userId);

    socketRef.current = io(SOCKET_URL, {
      query: { userId },
    });

    socketRef.current.on('connect', () => {
      console.log('[useSocket] Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('new_message', (data) => {
      console.log('[useSocket] Received new_message:', data);
      onMessage && onMessage(data);
    });

    socketRef.current.on('request_update', (data) => {
      console.log('[useSocket] Received request_update:', data);
      onRequestUpdate && onRequestUpdate(data);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[useSocket] Socket disconnected:', reason);
    });

    return () => {
      console.log('[useSocket] Disconnecting socket');
      socketRef.current.disconnect();
    };
  }, [userId, onMessage, onRequestUpdate]);

  // Join thread room
  const joinThread = (threadId) => {
    if (socketRef.current && threadId) {
      console.log('[useSocket] Joining thread room:', threadId);
      socketRef.current.emit('join_thread', threadId);
    }
  };

  // Send message event
  const sendMessage = (messageData) => {
    if (socketRef.current) {
      console.log('[useSocket] Sending message:', messageData);
      socketRef.current.emit('send_message', messageData);
    }
  };

  return { joinThread, sendMessage };
}
