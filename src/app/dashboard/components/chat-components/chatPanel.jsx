'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import useSocket from '../../../hooks/useSocket';

export default function ChatPanel({ chat, user, token, onApprove, onReject }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef();

  // Callback to add new incoming message from socket
  const onReceiveMessage = useCallback(
    (message) => {
      console.log('[ChatPanel] Received new message via socket:', message);

      setMessages((prev) => {
        // Avoid duplicate messages by timestamp + text + senderId
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
    },
    [setMessages]
  );

  // Setup socket with threadId and onReceiveMessage handler
  const { sendMessage, joinThread } = useSocket(chat?.threadId, onReceiveMessage);

  // Join socket room for this thread when chat changes
  useEffect(() => {
    if (chat?.threadId && joinThread) {
      console.log('[ChatPanel] Joining socket room for threadId:', chat.threadId);
      joinThread(chat.threadId);
    } else {
      console.log('[ChatPanel] No threadId or joinThread not ready', chat?.threadId, joinThread);
    }
  }, [chat?.threadId, joinThread]);

  // Fetch messages when chat or token changes
  useEffect(() => {
    console.log('[ChatPanel] chat.threadId or chat.status changed:', chat?.threadId, chat?.status);

    if (!chat?.threadId || chat.status !== 'approved') {
      console.log('[ChatPanel] Clearing messages (no thread or not approved)');
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

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) {
      console.log('[ChatPanel] Message is empty, ignoring send');
      return;
    }
    if (!chat?.threadId) {
      console.warn('[ChatPanel] No threadId, cannot send message');
      return;
    }
    if (!sendMessage) {
      console.warn('[ChatPanel] sendMessage function not ready');
      return;
    }

    const messageData = {
      threadId: chat.threadId,
      senderId: user._id || user.id,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    console.log('[ChatPanel] Sending message:', messageData);
    // Send message via socket
    sendMessage(messageData);

    // DO NOT add message optimistically here to avoid duplicates
    setNewMessage('');
  };

  if (!chat) {
    return <p className="p-4 text-gray-500">Select a conversation to view messages.</p>;
  }

  return (
    <div className="flex-1 p-4 flex flex-col justify-between bg-gray-50">
      <div>
        <h2 className="text-lg font-semibold">{chat.studentName || chat.teacherName || 'Chat'}</h2>
        <div className="space-y-2 mt-2 max-h-[70vh] overflow-y-auto">
          {chat.status === 'pending' ? (
            <>
              <p className="text-gray-600 mb-2">Request: {chat.topic || 'Tuition Request'}</p>
              <div className="space-x-4">
                <button
                  onClick={() => {
                    console.log('[ChatPanel] Approve clicked for requestId:', chat.requestId);
                    onApprove(chat.requestId);
                  }}
                  className="px-4 py-1 bg-green-500 text-white rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    console.log('[ChatPanel] Reject clicked for requestId:', chat.requestId);
                    onReject(chat.requestId);
                  }}
                  className="px-4 py-1 bg-red-500 text-white rounded"
                >
                  Reject
                </button>
              </div>
            </>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={`${msg.timestamp}-${i}`} // better unique key
                message={msg}
                currentUserId={user._id || user.id}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {chat.status === 'approved' && (
        <div className="flex mt-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border rounded-l px-4 py-2"
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded-r">
            Send
          </button>
        </div>
      )}
    </div>
  );
}
