// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // change if needed

export default function useSocket(userId, onMessage, onRequestUpdate) {
  const socketRef = useRef();

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId },
    });

    // Listen for new messages
    socketRef.current.on('new_message', (data) => {
      onMessage && onMessage(data);
    });

    // Listen for request status updates
    socketRef.current.on('request_update', (data) => {
      onRequestUpdate && onRequestUpdate(data);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [userId, onMessage, onRequestUpdate]);

  // Function to join a chat thread room
  const joinThread = (threadId) => {
    if (socketRef.current && threadId) {
      socketRef.current.emit('join_thread', { threadId });
    }
  };

  // Function to send message
  const sendMessage = (messageData) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
    }
  };

  return { joinThread, sendMessage };
}
