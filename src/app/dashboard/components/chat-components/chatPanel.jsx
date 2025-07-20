'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import useSocket from '../../../hooks/useSocket';

export default function ChatPanel({ chat, user, token, onApprove, onReject }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef();

  const onReceiveMessage = useCallback((message) => {
    console.log('[ChatPanel] Received new message via socket:', message);

    setMessages((prev) => {
      const exists = prev.some(
        (m) =>
          m.timestamp === message.timestamp &&
          m.text === message.text &&
          m.senderId === message.senderId
      );
      if (exists) {
        console.log('[ChatPanel] Duplicate message ignored');
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const { sendMessage, joinThread } = useSocket(chat?.threadId, onReceiveMessage);

  useEffect(() => {
    if (chat?.threadId && joinThread) {
      console.log('[ChatPanel] Joining socket room for threadId:', chat.threadId);
      joinThread(chat.threadId);
    } else {
      console.log('[ChatPanel] No threadId or joinThread not ready', chat?.threadId, joinThread);
    }
  }, [chat?.threadId, joinThread]);

  useEffect(() => {
    console.log('[ChatPanel] chat.threadId or chat.status changed:', chat?.threadId, chat?.status);

    if (!chat?.threadId || chat.status !== 'approved') {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/chat/threadById/${chat.threadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch messages. Status: ${res.status}`);
        const data = await res.json();
        console.log('[ChatPanel] Fetched thread data:', data);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('[ChatPanel] Error loading chat messages:', err);
        setMessages([]);
      }
    };

    fetchMessages();
  }, [chat?.threadId, chat?.status, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    if (!chat?.threadId || !sendMessage) return;

    const messageData = {
      threadId: chat.threadId,
      senderId: user._id || user.id,
      senderName: user.name,
      senderProfileImage: user.profileImage, // Real image
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    sendMessage(messageData);
    setNewMessage('');
  };

  const getAvatar = (msg) => {
    return (
      msg.senderProfileImage ||
      msg.senderId?.profileImage ||
      `https://i.pravatar.cc/150?u=${msg.senderId?._id || msg.senderId}`
    );
  };

  if (!chat) {
    return <p className="p-4 text-gray-500">Select a conversation to view messages.</p>;
  }

  return (
    <div className="flex-1 p-4 flex flex-col justify-between bg-gray-50">
      <div>
        <h2 className="text-lg font-semibold">
          {chat.studentName || chat.teacherName || 'Chat'}
        </h2>

        <div className="space-y-2 mt-2 max-h-[70vh] overflow-y-auto">
          {chat.status === 'pending' ? (
            <>
              <p className="text-gray-600 mb-2">Request: {chat.topic || 'Tuition Request'}</p>

              {user.role === 'student' ? (
                <p className="italic text-gray-700">
                  You: {chat.topic || 'Tuition Request'} (Pending approval)
                </p>
              ) : (
                <div className="space-x-4">
                  <button
                    onClick={() => onApprove(chat.requestId)}
                    className="px-4 py-1 bg-green-500 text-white rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(chat.requestId)}
                    className="px-4 py-1 bg-red-500 text-white rounded"
                  >
                    Reject
                  </button>
                </div>
              )}
            </>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={`${msg.timestamp}-${i}`}
                message={msg}
                currentUserId={user._id || user.id}
                avatar={getAvatar(msg)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {chat.status === 'approved' && (
        <div className="flex items-center space-x-2 mt-4 border border-gray-300 rounded-full px-4 py-2 bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow outline-none text-gray-700 placeholder-gray-400 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 transition-shadow shadow-md"
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
