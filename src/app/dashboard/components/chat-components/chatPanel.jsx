'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MessageBubble from './MessageBubble';
import useSocket from '../../../hooks/useSocket';
import {
  clearMessagesForThread as clearMessagesAction,
  resetUnreadCount, // ✅ use the real resetUnreadCount action
} from '../../../redux/chatSlice';
import { fetchMessagesThunk } from '../../../redux/chatThunks';
import { CheckCircle, XCircle } from 'lucide-react';
import { makeSelectMessagesByThread } from '../../../redux/chatSelectors';

// One shared EMPTY for local fallbacks (don’t mutate)
const EMPTY = Object.freeze([]);

export default function ChatPanel({ chat, user, onApprove, onReject }) {
  const dispatch = useDispatch();

  const threadId = chat?.threadId;
  const currentUserId = user?._id || user?.id;

  // Build a memoized selector instance for this thread
  const selectMessages = useMemo(
    () => (threadId ? makeSelectMessagesByThread(threadId) : null),
    [threadId]
  );

  // Use a stable fallback selector when there is no threadId
  const emptySelector = useCallback(() => EMPTY, []);
  const messages = useSelector(selectMessages ?? emptySelector);

  const [newMessage, setNewMessage] = useState('');

  // 🔽 New: precise scroller ref + robust bottom scroll
  const scrollerRef = useRef(null);

  const { sendMessage: socketSendMessage, joinThread, socketRef } = useSocket(threadId);

  const latestMessagesRef = useRef(messages);
  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  // 🔽 New: always land exactly at the bottom
  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = scrollerRef.current;
    if (!el) return;

    // 1st pass
    if (behavior === 'smooth') {
      // smooth on first pass, then force exact at next frame
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }

    // 2nd pass on next frame to defeat late layout changes (fonts/images/etc.)
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      // one more micro tick for good measure on very busy layouts
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 0);
    });
  }, []);

  // When messages change or thread switches, stick to bottom
  useEffect(() => {
    if (!threadId) return;
    scrollToBottom('smooth');
  }, [threadId, messages.length, scrollToBottom]);

  // Initial load / mark read
  useEffect(() => {
    if (!chat?.threadId || chat.status !== 'approved') {
      if (chat?.threadId) dispatch(clearMessagesAction(chat.threadId));
      return;
    }

    dispatch(clearMessagesAction(chat.threadId));
    dispatch(fetchMessagesThunk(chat.threadId)).finally(() => {
      // ensure we settle at the bottom after the fetch paints
      setTimeout(() => scrollToBottom('auto'), 0);
    });

    if (socketRef && socketRef.current) {
      socketRef.current.emit('mark_thread_read', {
        threadId: chat.threadId,
        userId: user?._id || user?.id,
      });
    }
  }, [chat?.threadId, chat?.status, dispatch, user, socketRef, scrollToBottom]);

  // Join room
  useEffect(() => {
    if (chat?.threadId && joinThread) {
      joinThread(chat.threadId);
    }
  }, [chat?.threadId, joinThread]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chat?.threadId || !socketSendMessage) return;

    const messageData = {
      threadId: chat.threadId,
      senderId: user?._id || user?.id,
      senderName: user?.name,
      senderProfileImage: user?.profileImage,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      socketSendMessage(messageData);
      setNewMessage('');

      // locally reset unread for this thread
      dispatch(resetUnreadCount({ threadId: chat.threadId, userId: user?._id || user?.id }));

      if (socketRef && socketRef.current) {
        socketRef.current.emit('mark_thread_read', {
          threadId: chat.threadId,
          userId: user?._id || user?.id,
        });
      }

      // make sure the freshly appended bubble is fully visible
      scrollToBottom('smooth');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const getAvatar = (msg) => {
    return (
      msg.sender?.profileImage ||
      `https://i.pravatar.cc/150?u=${msg.sender?._id || msg.senderId}`
    );
  };

  if (!chat) {
    return <p className="p-4 text-gray-500">Select a conversation to view messages.</p>;
  }

  const chatName =
    chat.name ||
    chat.participantName ||
    chat.studentName ||
    chat.teacherName ||
    chat.participants?.find((p) => p && p._id !== currentUserId)?.name ||
    'No Name';

  return (
    <div className="flex-1 p-4 flex flex-col justify-between bg-gray-50">
      <div>
        <h2 className="text-lg font-semibold">{chatName}</h2>

        {/* 🔽 Attach the scroller ref here */}
        <div
          ref={scrollerRef}
          className="space-y-2 mt-2 max-h-[70vh] overflow-y-auto"
        >
          {chat.status === 'pending' ? (
            <div className="bg-white p-4 rounded-xl shadow border border-gray-200 max-w-[90%] w-full break-words">
              <p className="text-gray-600 mb-2 font-medium">
                Request: {chat.topic || 'Tuition Request'}
              </p>
              <p className="text-gray-800 whitespace-pre-wrap break-words break-all mb-4 leading-relaxed w-full">
                {chat.lastMessage || 'No message provided'}
              </p>

              {user?.role === 'student' ? (
                <p className="italic text-gray-700">
                  You: {chat.topic || 'Tuition Request'} (Pending approval)
                </p>
              ) : (
                <div className="flex gap-3 justify-end flex-wrap">
                  <button
                    onClick={() => onApprove(chat.requestId)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => onReject(chat.requestId)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={msg._id || `${msg.timestamp}-${i}`}
                message={msg}
                currentUserId={currentUserId}
                avatar={getAvatar(msg)}
              />
            ))
          )}
          {/* Spacer is no longer required for scrolling, but harmless to keep */}
          <div style={{ height: 1 }} />
        </div>
      </div>

      {chat.status === 'approved' && (
        <div className="flex items-center space-x-2 mt-4 border border-gray-300 rounded-full px-4 py-2 bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow outline-none text-gray-700 placeholder-gray-400 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 transition-shadow shadow-md"
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
