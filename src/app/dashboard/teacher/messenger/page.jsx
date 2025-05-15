'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

const dummyConversations = [
  { id: 1, name: 'Student A', lastMessage: 'Thanks for your help!', userId: 'user_1' },
  { id: 2, name: 'Student B', lastMessage: 'Can we reschedule?', userId: 'user_2' },
  { id: 3, name: 'Student C', lastMessage: 'I have a doubt in physics', userId: 'user_3' },
];

const dummyMessages = {
  user_1: [
    { from: 'me', text: 'Hi there!' },
    { from: 'them', text: 'Thanks for your help!' },
  ],
  user_2: [
    { from: 'them', text: 'Can we reschedule?' },
    { from: 'me', text: 'Sure, let me know your time.' },
  ],
  user_3: [
    { from: 'them', text: 'I have a doubt in physics' },
    { from: 'me', text: 'Go ahead and ask.' },
  ],
};
// export default function MessagesPage() {
//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4 text-indigo-600">📨 Messages</h1>
//       <p>This is your messages area. Chat feature coming soon!</p>
//     </div>
//   );
// }
export default function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState(dummyConversations[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(dummyMessages[selectedUser.userId]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMessages(dummyMessages[user.userId] || []);
  };

  const handleSend = () => {
    if (input.trim() === '') return;
    const newMessage = { from: 'me', text: input.trim() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
  };

  return (
    <div className="flex h-[85vh] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Left Panel: Conversations */}
      <aside className="w-1/3 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        <ul className="space-y-3">
          {dummyConversations.map((user) => (
            <li
              key={user.id}
              className={`cursor-pointer p-3 rounded-lg hover:bg-gray-200 ${
                selectedUser.userId === user.userId ? 'bg-gray-200' : ''
              }`}
              onClick={() => handleSelectUser(user)}
            >
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-gray-500 truncate">{user.lastMessage}</div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right Panel: Messages */}
      <section className="flex-1 flex flex-col">
        <header className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold">{selectedUser.name}</h2>
        </header>

        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.from === 'me'
                  ? 'ml-auto bg-indigo-100 text-indigo-900'
                  : 'mr-auto bg-gray-100 text-gray-900'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <footer className="p-3 border-t border-gray-200 flex items-center gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Send className="w-4 h-4" />
          </button>
        </footer>
      </section>
    </div>
  );
}
