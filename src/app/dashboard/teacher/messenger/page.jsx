'use client'
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MessengerPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
const [text, setText] = useState('');
  useEffect(() => {
    // TODO: Replace with actual auth state or token decode
    setCurrentUserId(localStorage.getItem('userId')); // or fetch from context
console.log(selectedChat,"HSDF")
    // Fetch all messages (preview latest message per user)
    axios.get('http://localhost:5000/api/messages/all', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})
.then(res => {
  const uniqueConversations = getUniqueConversations(res.data);
  Promise.all(
    uniqueConversations.map(conv =>
      axios.get(`http://localhost:5000/api/messages/${conv.userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(res => ({
        ...conv,
        name: res.data.name,
        avatar: res.data.profileImage
      }))
    )
  ).then(setConversations);
});
  }, []);

  const getUniqueConversations = (messages) => {
  const unique = {};

  // ✅ First, sort messages by createdAt DESC (latest first)
  messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  messages.forEach(msg => {
    const otherUserId =
      msg.sender === currentUserId ? msg.receiver : msg.sender;

    // ✅ Only keep the first (latest) message per user
    if (!unique[otherUserId]) {
      unique[otherUserId] = {
        userId: otherUserId,
        lastMessage: msg.text,
        lastMessageTime: msg.createdAt
      };
    }
  });

  return Object.values(unique);
};

 const handleSend = async () => {
  if (!text.trim()) return;

  try {
    const res = await axios.post(
      'http://localhost:5000/api/messages',
      {
        receiverId: selectedChat.userId,
        text: text.trim()
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    // Add the new message to UI
    setMessages(prev => [
      ...prev,
      {
        from: 'me',
        text: text.trim(),
        createdAt: res.data.newMessage.createdAt,
      }
    ]);

    setText(""); // Clear input
  } catch (err) {
    console.error("Failed to send message:", err);
  }
};
  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    const res = await axios.get(`http://localhost:5000/api/messages/${chat.userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const msgList = res.data.map(m => ({
      from: m.sender === currentUserId ? 'me' : 'them',
      text: m.text,
      createdAt: m.createdAt
    }));
    setMessages(msgList);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversations Sidebar */}
      <aside className="w-1/3 border-r border-gray-300 p-4 bg-white">
        <h2 className="text-xl font-bold mb-4">Messages</h2>
        <ul className="space-y-2">
          {conversations.map((chat) => (
            <li
              key={chat.userId}
              className={`flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 ${
                selectedChat?.userId === chat.userId ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleChatSelect(chat)}
            >
              {chat.avatar && (
                <img src={chat.avatar} className="w-8 h-8 rounded-full" alt="" />
              )}
              <div>
                <div className="font-semibold">{chat.name}</div>
                <div className="text-sm text-gray-500 truncate">
                  {chat.lastMessage}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat Window */}
      <main className="flex-1 p-4 flex flex-col justify-between bg-gray-50">
        {selectedChat ? (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{selectedChat.name}</h2>
              <div className="space-y-2 mt-2">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-xs px-3 py-2 rounded ${
                      msg.from === 'me'
                        ? 'bg-blue-500 text-white self-end ml-auto'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex">
             <input
  type="text"
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder="Type a message"
  className="flex-1 border rounded-l px-4 py-2 focus:outline-none"
/>
            <button
        className="bg-blue-600 text-white px-3 py-1 rounded"
        onClick={handleSend}
      >
        Send
      </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Select a conversation to start chatting.</p>
        )}
      </main>
    </div>
  );
}
