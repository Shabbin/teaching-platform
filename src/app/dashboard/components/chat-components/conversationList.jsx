'use client';
import React, { useState } from 'react';

export default function ConversationList({ conversations, selectedChatId, onSelect }) {
  const [hoveredChatId, setHoveredChatId] = useState(null);

  return (
    <aside className="w-1/3 border-r border-gray-200 p-4 bg-white overflow-y-auto relative">
      <h2 className="text-xl font-bold mb-4 select-none">Messages</h2>
      <ul className="space-y-2">
        {conversations.length === 0 && (
          <p className="text-sm text-gray-500">No conversations yet.</p>
        )}
        {conversations.map((chat, index) => {
          // Determine if the current user is a teacher or student
          const isTeacher = !!chat.student; // If there's a student, the viewer is the teacher
          const otherUser = isTeacher ? chat.student : chat.teacher;

          const displayName = otherUser?.name || chat.teacherName || chat.studentName || chat.name || 'No Name';

          const avatarUrl =
            otherUser?.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`;

          const statusColors = {
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
          };
          const statusClass = statusColors[chat.status] || 'bg-gray-100 text-gray-600';

          const isSelected = selectedChatId === (chat.threadId || chat.requestId);
console.log('chat.student:', chat.student);
console.log('chat.teacher:', chat.teacher);
          return (
            <li
              key={chat.threadId || chat.requestId || index}
              onClick={() => onSelect(chat)}
              className={`flex justify-between items-center p-2 rounded cursor-pointer hover:bg-gray-100 transition ${
                isSelected ? 'bg-gray-100' : ''
              }`}
              onMouseEnter={() => setHoveredChatId(chat.threadId || chat.requestId)}
              onMouseLeave={() => setHoveredChatId(null)}
            >
              {/* Left: avatar and details */}
              <div className="flex items-center space-x-3 min-w-0 relative">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{displayName}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {chat.status === 'pending'
                      ? 'New tuition request'
                      : chat.lastMessage || 'No messages yet'}
                  </div>
                </div>

                {/* Hover tooltip */}
                {hoveredChatId === (chat.threadId || chat.requestId) && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 text-sm text-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover"
                        loading="lazy"
                      />
                      <div>
                        <div className="font-semibold text-lg">{displayName}</div>
                        <div
                          className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            chat.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : chat.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {chat.status}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Last message:</div>
                      <p className="truncate">{chat.lastMessage || 'No messages yet'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: status badge and unread count */}
              <div className="flex flex-col items-end min-w-[48px]">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusClass}`}
                >
                  {chat.status}
                </span>

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
