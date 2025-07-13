'use client';

import { useState } from 'react';

export default function ChatInput({ threadId, userId, token, onSendMessage }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = () => {
    if (!text.trim()) return;

    setSending(true);
    setError(null);

    fetch('http://localhost:5000/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
      },
      body: JSON.stringify({
        threadId,
        senderId: userId,
        text: text.trim(),
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`Error sending message: ${res.status}`);
        return res.json();
      })
      .then(savedMessage => {
        onSendMessage(savedMessage);
        setText('');
        setSending(false);
      })
      .catch(err => {
        setError(err.message);
        setSending(false);
      });
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
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
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
