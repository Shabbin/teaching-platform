'use client';
import { useState } from 'react';
import API from '../api/axios'; // ✅ env-driven axios instance

export default function ChatInput({ threadId, userId, token }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async () => {
    if (!text.trim()) return;

    setSending(true);
    setError(null);

    try {
      await API.post(
        '/chat/messages',
        {
          threadId,
          senderId: userId,
          text: text.trim(),
        },
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      // socket will add the message to the UI
      setText('');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error sending message';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-grow border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !sending) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!text.trim() || sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
