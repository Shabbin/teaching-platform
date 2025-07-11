'use client';
import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

let socket;

export default function ChatWindow({ requestId }) {
  const user = useSelector((state) => state.user.userInfo);
  const token = localStorage.getItem('token');

  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef();

  // Initialize socket once
  useEffect(() => {
    if (!token) return;

    socket = io('http://localhost:5000', {
      auth: { token },
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Fetch or create chat thread by tuition request ID
  useEffect(() => {
    if (!requestId || !token) return;

    fetch(`http://localhost:5000/api/chat/thread/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setThread(data);

        // Fetch messages for this thread
        fetch(`http://localhost:5000/api/chat/messages/${data._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((msgData) => {
            setMessages(msgData.messages);

            // Join socket room
            socket.emit('join_thread', { threadId: data._id });
          });
      })
      .catch(console.error);
  }, [requestId, token]);

  // Listen for new messages from socket
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', ({ message }) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !thread || !user) return;

    const messageData = {
      threadId: thread._id,
      senderId: user._id,
      text: text.trim(),
    };

    socket.emit('send_message', messageData);

    setText('');
  };

  if (!user) return <p>Loading user info...</p>;

  return (
    <div className="flex flex-col h-full max-w-md border rounded shadow">
      <div className="p-3 border-b font-bold">Chat</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {messages.length === 0 && <p className="text-gray-500">No messages yet</p>}
        {messages.map((msg, i) => {
          const isMe =
            msg.senderId === user._id || (msg.senderId?._id && msg.senderId._id === user._id);
          return (
            <div
              key={i}
              className={`max-w-[70%] p-2 rounded ${
                isMe ? 'bg-blue-600 text-white self-end' : 'bg-gray-300 self-start'
              }`}
            >
              {msg.text}
              <div className="text-xs text-gray-700 mt-1">
                {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button
          className="bg-blue-600 text-white px-4 rounded"
          onClick={handleSend}
          disabled={!text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
