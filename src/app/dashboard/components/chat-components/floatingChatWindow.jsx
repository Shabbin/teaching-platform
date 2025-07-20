// components/chatcomponents/FloatingChatWindow.jsx
'use client';
import React from 'react';
import ChatPanel from './ChatPanel';
import { X } from 'lucide-react';

export default function FloatingChatWindow({ request, onClose, currentUser }) {
  if (!request) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[350px] max-h-[500px] bg-white shadow-xl rounded-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b">
        <div className="font-semibold text-sm truncate">
          {currentUser.role === 'student'
            ? request.teacherName
            : request.studentName}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-red-500"
        >
          <X size={18} />
        </button>
      </div>

      {/* Chat panel */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel request={request} currentUser={currentUser} />
      </div>
    </div>
  );
}
