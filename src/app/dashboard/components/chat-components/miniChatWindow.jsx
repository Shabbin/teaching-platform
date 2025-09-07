// app/dashboard/components/chat-components/MiniChatWindow.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeSelectMessagesByThread } from '../../../redux/chatSelectors';
import {
  resetUnreadCount,
  setCurrentThreadId,
} from '../../../redux/chatSlice';
import { fetchMessagesThunk } from '../../../redux/chatThunks';
import MessageBubble from './MessageBubble';

export default function MiniChatWindow({
  chat,
  user,
  onClose,
  joinThread,
  sendMessage,
  emitMarkThreadRead,
  offsetIndex = 0,
}) {
  const dispatch = useDispatch();

  const threadId = chat?.threadId || chat?._id || chat?.requestId || null;
  const currentUserId = user?.id || user?._id;

  const selectMessages = useMemo(
    () => (threadId ? makeSelectMessagesByThread(threadId) : () => []),
    [threadId]
  );
  const messages = useSelector(selectMessages);

  const [minimized, setMinimized] = useState(false);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  // autoscroll on new msgs (only when open)
  useEffect(() => {
    if (!minimized && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, minimized]);

  // join + fetch on open
  useEffect(() => {
    if (!threadId) return;

    joinThread?.(threadId);
    dispatch(fetchMessagesThunk(threadId));

    dispatch(resetUnreadCount({ threadId }));
    emitMarkThreadRead?.(threadId);

    dispatch(setCurrentThreadId(threadId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const handleSend = () => {
    const value = text.trim();
    if (!value || !threadId) return;

    sendMessage?.({
      threadId,
      senderId: currentUserId,
      text: value,
      timestamp: new Date().toISOString(),
    });

    setText('');
  };

  const displayName =
    chat?.displayName ||
    chat?.name ||
    chat?.teacherName ||
    chat?.studentName ||
    'No Name';

  const avatar =
    chat?.displayProfileImage ||
    chat?.profileImage ||
    (() => {
      const id = chat?.participantId || chat?.studentId || chat?.teacherId || 'unknown';
      return `https://i.pravatar.cc/150?u=${id}`;
    })();

  // layout/position
  const width = 320;
  const gap = 12;
  const right = 16 + offsetIndex * (width + gap);

  const isApproved = (chat?.status || 'approved') === 'approved';

  // Drawer animation target height when open
  const OPEN_H = 360; // px (adjust if you want taller content)

  return (
    <div
      className="fixed bottom-4 z-[1000] rounded-xl shadow-lg border bg-white flex flex-col"
      style={{ width, right }}
      role="dialog"
      aria-label={`Chat with ${displayName}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-3 py-2 border-b rounded-t-xl" style={{ background: '#6d28d9' }}>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <img
              src={avatar}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white/70"
            />
            {/* online dot placeholder (optional) */}
            {/* <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></span> */}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white truncate max-w-[160px]">
              {displayName}
            </span>
            <span
              className={`text-[11px] px-1.5 py-[1px] rounded-full self-start ${
                chat?.status === 'approved'
                  ? 'bg-white/20 text-white'
                  : chat?.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
              title={`Status: ${chat?.status || 'approved'}`}
            >
              {chat?.status || 'approved'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="text-white/90 hover:text-white"
            onClick={() => setMinimized((m) => !m)}
            aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
            title={minimized ? 'Expand' : 'Minimize'}
          >
            {minimized ? '▢' : '—'}
          </button>
          <button
            className="text-white/90 hover:text-white"
            onClick={onClose}
            aria-label="Close chat"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* DRAWER (messages + input). We animate HEIGHT rather than max-height for strict collapse. */}
      <div
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{
          height: minimized ? 0 : OPEN_H,
          pointerEvents: minimized ? 'none' : 'auto',
        }}
        aria-hidden={minimized}
      >
        {/* MESSAGES */}
        <div
          ref={listRef}
          className="h-[calc(360px-56px)] overflow-y-auto px-3 py-2 space-y-2 bg-white"
          style={{
            opacity: minimized ? 0 : 1,
            transition: 'opacity 200ms ease',
          }}
        >
          {isApproved ? (
            messages.length > 0 ? (
              messages.map((msg, i) => (
                <MessageBubble
                  key={msg._id || `${msg.timestamp}-${i}`}
                  message={msg}
                  currentUserId={currentUserId}
                  avatar={
                    msg?.sender?.profileImage ||
                    `https://i.pravatar.cc/150?u=${msg?.sender?._id || msg?.senderId}`
                  }
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">
                No messages yet. Say hello 👋
              </p>
            )
          ) : (
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-sm text-gray-700">
                Request is <strong>{chat?.status}</strong>. You’ll be able to chat here once it’s
                approved.
              </p>
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="px-3 py-2 border-t bg-gray-50 rounded-b-xl">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!isApproved}
              placeholder={isApproved ? 'Type a message…' : 'Disabled until approved'}
              className="flex-1 bg-white rounded-full px-3 py-2 text-sm border outline-none disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={!isApproved || !text.trim()}
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-full px-3 py-1.5 text-sm transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
