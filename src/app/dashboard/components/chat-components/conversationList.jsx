'use client';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationList({ conversations, selectedChatId, onSelect }) {
  const lastMessages = useSelector((state) => state.chat.lastMessagesByThread);

  return (
    <aside className="w-1/3 border-r border-gray-200 p-4 bg-white overflow-y-auto relative">
      <h2 className="text-xl font-bold mb-4 select-none">Messages</h2>
      <ul className="space-y-2">
        {conversations.length === 0 && (
          <p className="text-sm text-gray-500">No conversations yet.</p>
        )}
        {conversations.map((chat, index) => {
          const isTeacher = !!chat.student;
          const otherUser = isTeacher ? chat.student : chat.teacher;

          const displayName =
            otherUser?.name || chat.teacherName || chat.studentName || chat.name || 'No Name';

          const avatarUrl =
            otherUser?.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`;

          const statusColors = {
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
          };
          const borderColors = {
            approved: 'border-green-400',
            rejected: 'border-red-400',
            pending: 'border-yellow-400',
          };

          const status = chat.status || 'pending';
          const statusClass = statusColors[status] || 'bg-gray-100 text-gray-600';
          const borderColorClass = borderColors[status] || 'border-gray-300';

          const threadKey = chat.threadId || chat.requestId || index;
          const isSelected = selectedChatId === threadKey;

          const lastMessageObj = lastMessages?.[threadKey];
          const lastMessageText = lastMessageObj?.text || chat.lastMessage || 'No messages yet';

          const lastUpdated = chat.updatedAt || chat.requestedAt;
          const timeAgo = lastUpdated
            ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })
            : '';

          return (
            <li
              key={threadKey}
              onClick={() => onSelect(chat)}
              className={`flex justify-between items-center p-3 rounded-lg cursor-pointer 
                transition-transform transition-shadow duration-200
                ${isSelected ? 'bg-blue-50 shadow-md' : 'hover:shadow-md hover:scale-[1.02]'}
              `}
            >
              {/* Left: avatar and details */}
              <div className="relative flex items-center space-x-3 min-w-0">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className={`w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 ${borderColorClass}`}
                />
                {chat.unreadCount > 0 && (
                  <span className="absolute top-0 left-9 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-lg truncate">{displayName}</div>
                  <div className="text-sm text-gray-600 truncate line-clamp-2">
                    {status === 'pending' ? 'New tuition request' : lastMessageText}
                  </div>
                </div>
              </div>

              {/* Right: status badge, timestamp and unread count */}
              <div className="flex flex-col items-end min-w-[64px] text-right">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusClass}`}
                >
                  {status}
                </span>
                {timeAgo && (
                  <span className="text-xs text-gray-400 mt-1 select-none">{timeAgo}</span>
                )}
                {chat.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 mt-1 select-none">
                    {chat.unreadCount > 5 ? '5+' : chat.unreadCount}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
