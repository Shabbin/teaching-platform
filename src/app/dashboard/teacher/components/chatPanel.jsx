'use client';
import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatPanel({ chat, user, token, onApprove, onReject }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chat?.threadId || chat.status !== 'approved') return;

      const res = await fetch(`http://localhost:5000/api/chat/threadById/${chat.threadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    };

    fetchMessages();
  }, [chat?.threadId, chat?.status, token]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chat.threadId) return;

    const res = await fetch('http://localhost:5000/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        threadId: chat.threadId,
        senderId: user._id || user.id,
        text: newMessage.trim(),
      }),
    });

    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!chat) return <p className="p-4">Select a conversation to view messages.</p>;

  return (
    <div className="flex-1 p-4 flex flex-col justify-between bg-gray-50">
      <div>
        <h2 className="text-lg font-semibold">{chat.studentName}</h2>
        <div className="space-y-2 mt-2">
          {chat.status === 'pending' ? (
            <>
              <p className="text-gray-600 mb-2">Request: {chat.topic || 'Tuition Request'}</p>
              <div className="space-x-4">
                <button onClick={() => onApprove(chat.requestId)} className="px-4 py-1 bg-green-500 text-white rounded">Approve</button>
                <button onClick={() => onReject(chat.requestId)} className="px-4 py-1 bg-red-500 text-white rounded">Reject</button>
              </div>
            </>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} currentUserId={user._id || user.id} />
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
          />
          <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded-r">
            Send
          </button>
        </div>
      )}
    </div>
  );
}
