'use client';

import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationList({
  conversations = [],
  selectedChatId,
  onSelect,
  onlineUserIds = [],
  userId: userIdProp,
  getAvatar,       // optional: custom avatar resolver (we pass from page)
  getDisplayName,  // optional: custom displayName resolver (we pass from page)
}) {
  // fall back to store user id if not provided via props
  const currentUserId =
    userIdProp ||
    useSelector((s) => s.user.userInfo?._id || s.user.userInfo?.id || null);

  // normalize once for cheap `includes`
  const normalizedOnlineUserIds = useMemo(
    () => onlineUserIds.map((id) => id?.toString()).filter(Boolean),
    [onlineUserIds]
  );

  const fallbackAvatar = useCallback((idLike, nameLike) => {
    const seed = idLike || nameLike || 'unknown';
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(String(seed))}`;
  }, []);

  const fallbackDisplayName = useCallback(
    (chat) => {
      // prefer participants (other user), else named fields, else generic
      if (Array.isArray(chat.participants) && currentUserId) {
        const other = chat.participants.find(
          (p) => p && p._id && String(p._id) !== String(currentUserId)
        );
        if (other?.name) return other.name;
      }
      return chat.displayName || chat.name || chat.studentName || chat.teacherName || 'Unknown';
    },
    [currentUserId]
  );

  const resolveDisplayName = useCallback(
    (chat) => {
      if (typeof getDisplayName === 'function') return getDisplayName(chat);
      return fallbackDisplayName(chat);
    },
    [getDisplayName, fallbackDisplayName]
  );

  const resolveAvatar = useCallback(
    (chat, displayName) => {
      if (typeof getAvatar === 'function') return getAvatar(chat);

      // try explicit displayProfileImage/profileImage
      if (chat.displayProfileImage) return chat.displayProfileImage;
      if (chat.profileImage) return chat.profileImage;

      // try other participant's profileImage
      if (Array.isArray(chat.participants) && currentUserId) {
        const other = chat.participants.find(
          (p) => p && p._id && String(p._id) !== String(currentUserId)
        );
        if (other?.profileImage) return other.profileImage;
        return fallbackAvatar(other?._id, displayName);
      }

      // finally: fallback
      const idLike = chat.participantId || chat.studentId || chat.teacherId || chat.threadId;
      return fallbackAvatar(idLike, displayName);
    },
    [currentUserId, getAvatar, fallbackAvatar]
  );

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

  return (
    <aside
      className="w-1/3 border-r border-gray-200 p-4 bg-white overflow-y-auto relative"
      role="list"
      aria-label="Conversations"
    >
      <h2 className="text-xl font-bold mb-4 select-none">Messages</h2>

      <ul className="space-y-2">
        {conversations.length === 0 && (
          <p className="text-sm text-gray-500">No conversations yet.</p>
        )}

        {conversations.map((chat, index) => {
          const threadKey = chat.threadId || chat._id || chat.requestId || index;
          const isSelected = selectedChatId === threadKey;

          const displayName = resolveDisplayName(chat);
          const avatarUrl = resolveAvatar(chat, displayName);

          const status = chat.status || 'pending';
          const statusClass = statusColors[status] || 'bg-gray-100 text-gray-600';
          const borderColorClass = borderColors[status] || 'border-gray-300';

          const unreadCount = Number(chat.unreadCount) || 0;

          // last message text and timestamp
          const lastMessageText =
            (typeof chat.lastMessage === 'string'
              ? chat.lastMessage
              : chat.lastMessage?.text) ||
            (status === 'pending' ? 'Pending approval...' : 'No messages yet');

          const lastTs =
            chat.lastMessageTimestamp ||
            chat.lastMessage?.timestamp ||
            chat.updatedAt ||
            chat.requestedAt ||
            chat.createdAt ||
            null;

          const timeAgo = lastTs
            ? formatDistanceToNow(new Date(lastTs), { addSuffix: true })
            : '';

          // online indicator (other participant)
          let otherUserId = null;
          if (Array.isArray(chat.participants) && currentUserId) {
            const other = chat.participants.find(
              (p) => p && p._id && String(p._id) !== String(currentUserId)
            );
            otherUserId = other?._id?.toString() || null;
          }
          const isOnline = otherUserId
            ? normalizedOnlineUserIds.includes(otherUserId)
            : false;

          return (
            <li
              key={threadKey}
              role="listitem"
              aria-selected={isSelected}
              tabIndex={0}
              onClick={() => onSelect?.(chat)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect?.(chat);
              }}
              className={`flex justify-between items-center p-3 rounded-lg cursor-pointer
                transition-transform transition-shadow duration-200
                ${isSelected ? 'bg-blue-50 shadow-md' : 'hover:shadow-md hover:scale-[1.02]'}
              `}
            >
              {/* Left: avatar + details */}
              <div className="relative flex items-center space-x-3 min-w-0">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className={`w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 ${borderColorClass}`}
                  loading="lazy"
                />
                {/* Online indicator */}
                <span
                  className={`absolute bottom-0 left-9 block h-3 w-3 rounded-full ring-2 ring-white ${
                    isOnline ? 'bg-green-400' : 'bg-gray-400'
                  }`}
                  title={isOnline ? 'Online' : 'Offline'}
                />
                {/* Unread red dot */}
                {unreadCount > 0 && (
                  <span className="absolute top-0 left-9 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500" />
                )}

                <div className="min-w-0">
                  <div className="text-lg truncate">{displayName}</div>
                  <div
                    className={`text-sm truncate line-clamp-2 ${
                      unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {lastMessageText}
                  </div>
                </div>
              </div>

              {/* Right: status / time / unread badge */}
              <div className="flex flex-col items-end min-w-[64px] text-right">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusClass}`}
                >
                  {status}
                </span>
                {timeAgo && (
                  <span className="text-xs text-gray-400 mt-1 select-none">{timeAgo}</span>
                )}
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 mt-1 select-none font-semibold">
                    {unreadCount > 5 ? '5+' : unreadCount}
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
