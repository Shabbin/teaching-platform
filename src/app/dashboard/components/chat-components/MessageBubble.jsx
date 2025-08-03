// src/app/dashboard/teacher/components/MessageBubble.jsx

import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';

export default function MessageBubble({ message, currentUserId, avatar }) {
  const [relativeTime, setRelativeTime] = useState('');
// console.log('[MessageBubble]', {
//     messageId: message._id,
//     senderId: message.senderId,
//     currentUserId,
//     avatar,
//     text: message.text,
//   });
  
  const senderId =
    typeof message.senderId === 'string'
      ? message.senderId
      : message.senderId?._id;
  const isMine = senderId === currentUserId;
// console.log("SenderID and isMine",senderId, isMine)
  useEffect(() => {
    const updateTime = () => {
      if (message.timestamp) {
        const now = new Date();
        const msgTime = new Date(message.timestamp);
        const diffInSeconds = Math.floor((now - msgTime) / 1000);

        if (diffInSeconds < 10) {
          setRelativeTime('just now');
        } else {
          setRelativeTime(
            formatDistanceToNowStrict(msgTime, {
              addSuffix: true,
            })
          );
        }
      }
    };

    updateTime(); // Initial render
    const interval = setInterval(updateTime, 60000); // Update every 60s

    return () => clearInterval(interval);
  }, [message.timestamp]);

  return (
    <div
      className={`flex items-end mb-2 max-w-[75%] ${
        isMine ? 'ml-auto justify-end' : 'mr-auto justify-start'
      }`}
    >
      {!isMine && (
        <img
          src={avatar}
          alt="Sender avatar"
          className="w-8 h-8 rounded-full mr-2 object-cover select-none shadow-md"
          loading="lazy"
          draggable={false}
        />
      )}

      <div className="flex flex-col space-y-1">
        <div
          className={`px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${
            isMine
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          {message.text}
        </div>
        <span
          className={`text-xs text-gray-400 select-none ${
            isMine ? 'text-right pr-1' : 'text-left pl-1'
          }`}
        >
          {relativeTime}
        </span>
      </div>
    </div>
  );
}
