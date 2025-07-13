'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function ChatWindow({ requestId, user, token }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [threadId, setThreadId] = useState(null);
  const messagesEndRef = useRef(null);
console.log(messages,"Messages")
console.log(newMessage,"MessagesNew")
  // Fetch or create chat thread by requestId once
  useEffect(() => {
    const fetchThreadAndMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/chat/thread/${requestId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch chat thread');

        const data = await res.json();
        console.log(data,"DATAA")
      setThreadId(data._id); // 
        setMessages(data.messages || []);
      } catch (error) {
        console.error('❌ Chat thread error:', error);
      }
    };

    if (requestId) fetchThreadAndMessages();
  }, [requestId, token]);

  // Polling to refresh messages every 5 seconds
  useEffect(() => {
    if (!threadId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/chat/threadById/${threadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch updated thread');
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Failed to fetch updated messages:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [threadId, token]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send new message
  const sendMessage = async () => {
    if (!threadId) {
      console.error('No thread ID available to send message.');
      return;
    }
    if (!newMessage.trim()) {
      console.warn('Cannot send empty message.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId,
          senderId: user.id || user._id, // support both user id keys
          text: newMessage.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const savedMessage = await res.json();
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('❌ Send message error:', error);
    }
  };

  // Send on Enter key (without Shift)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-4 flex flex-col">
      <div className="h-96 overflow-y-auto border rounded p-2 mb-4 flex-grow">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-8">No messages yet.</p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 ${
              msg.senderId === (user.id || user._id) ? 'text-right' : 'text-left'
            }`}
          >
            <span
              className={`inline-block px-3 py-2 rounded ${
                msg.senderId === (user.id || user._id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-grow border p-2 rounded resize-none"
          rows={2}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className={`px-4 py-2 rounded text-white ${
            newMessage.trim()
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
