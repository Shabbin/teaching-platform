'use client'
import { useEffect, useState } from 'react';

const ChatPopup = ({ token, currentUserId }) => {
  const [inbox, setInbox] = useState([]);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/messages/inbox/${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInbox(data);
      } catch (error) {
        console.error('Error fetching inbox:', error);
      }
    };

    if (token && currentUserId) fetchInbox();
  }, [token, currentUserId]);

  return (
    <div className="bg-white border rounded shadow p-4 max-h-96 overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">Messages</h2>
      {inbox.length === 0 ? (
        <p className="text-gray-500">No messages yet.</p>
      ) : (
        inbox.map((chat) => (
          <div key={chat.userId} className="mb-3 border-b pb-2">
            <p><strong>User:</strong> {chat.userId}</p>
            <p className="text-sm text-gray-700">{chat.lastMessage}</p>
            <p className="text-xs text-gray-500">{new Date(chat.lastMessageTime).toLocaleString()}</p>
          </div>
        ))
      )}
      <button className="mt-4 text-blue-500 hover:underline" onClick={() => window.location.href = '/teacher-dashboard/messages'}>
        See all in Messenger
      </button>
    </div>
  );
};

export default ChatPopup;
