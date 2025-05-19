'use client';
import { useEffect, useState } from 'react';

export default function MessengerPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    // Mock current user ID
    const mockUserId = 'user1';
    
    // Mock conversations (simulate latest messages per user)
    const mockConversations = [
      {
        userId: 'user2',
        name: 'Alice Johnson',
        avatar: 'https://i.pravatar.cc/100?img=1',
        lastMessage: 'Hey, how are you?',
        lastMessageTime: new Date().toISOString(),
      },
      {
        userId: 'user3',
        name: 'Bob Smith',
        avatar: 'https://i.pravatar.cc/100?img=2',
        lastMessage: 'Let me know when you’re free!',
        lastMessageTime: new Date().toISOString(),
      },
    ];
    
    setConversations(mockConversations);
  }, []);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    
    // Mock message history for selected chat
    const mockMessages = [
      {
        from: 'them',
        text: 'Hey! Can you help me with algebra?',
        createdAt: new Date().toISOString(),
      },
      {
        from: 'me',
        text: 'Sure! When are you available?',
        createdAt: new Date().toISOString(),
      },
    ];
    setMessages(mockMessages);
  };

  const handleSend = () => {
    if (!text.trim()) return;

    // Add message to the local UI
    const newMessage = {
      from: 'me',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setText('');
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
