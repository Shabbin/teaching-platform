// components/chatcomponents/ChatDrawer.jsx
import React from 'react';

export default function ChatDrawer({ user, requests, onSelectRequest }) {
  if (!requests || requests.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No conversations yet.
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <ul className="divide-y divide-gray-200">
        {requests.map((req) => {
          const name = user.role === 'student'
            ? req.teacherName || 'Teacher'
            : req.studentName || 'Student';

          return (
            <li
              key={req._id}
              onClick={() => onSelectRequest(req)}
              className="p-3 hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-semibold">{name}</div>
              <div className="text-sm text-gray-600 truncate">
                {req.status === 'pending'
                  ? 'New tuition request'
                  : req.lastMessage || 'No messages yet'}
              </div>
              {req.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 mt-1 inline-block">
                  {req.unreadCount > 5 ? '5+' : req.unreadCount}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
