'use client';
import React from 'react';

export default function ConversationList({ conversations, selectedChatId, onSelect }) {
  return (
    <aside className="w-1/3 border-r p-4 bg-white overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Messages</h2>
      <ul className="space-y-2">
        {conversations.length === 0 && (
          <p className="text-sm text-gray-500">No conversations yet.</p>
        )}
        {conversations.map((chat, index) => (
          <li
            key={chat.threadId || chat.requestId || index}
            onClick={() => onSelect(chat)}
            className={`flex justify-between items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
              selectedChatId === (chat.threadId || chat.requestId) ? 'bg-gray-100' : ''
            }`}
          >
            <div>
              <div className="font-semibold">{chat.teacherName || chat.studentName || chat.name || 'No Name'}</div>
              <div className="text-sm text-gray-500 truncate">
                {chat.status === 'pending'
                  ? 'New tuition request'
                  : chat.lastMessage || 'No messages yet'}
              </div>
            </div>
            {chat.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                {chat.unreadCount > 5 ? '5+' : chat.unreadCount}
              </span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
