'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiMinus, FiX } from 'react-icons/fi';

import MessageBubble from './MessageBubble';
import useSocket from '../../../hooks/useSocket';
import { makeSelectMessagesByThread } from '../../../redux/chatSelectors';
import {
  resetUnreadCount,
  setCurrentThreadId,
} from '../../../redux/chatSlice';
import { fetchMessagesThunk } from '../../../redux/chatThunks';

export default function FloatingChatWindow({ conversation, user, onClose }) {
  const dispatch = useDispatch();

  const userId = (user?.id || user?._id)?.toString();
  const threadId =
    conversation?.threadId || conversation?._id || conversation?.requestId;

  const other =
    conversation?.participants?.find(
      (p) => p && p._id && p._id.toString() !== userId
    ) || null;

  const title =
    other?.name ||
    conversation?.displayName ||
    conversation?.teacherName ||
    conversation?.studentName ||
    'Unknown';

  const avatar =
    other?.profileImage ||
    conversation?.displayProfileImage ||
    conversation?.profileImage ||
    `https://i.pravatar.cc/150?u=${other?._id || threadId}`;

  const [collapsed, setCollapsed] = useState(false);
  const msgEndRef = useRef(null);
  const lastMarkedRef = useRef(null);

  const selectMessages = useMemo(
    () => (threadId ? makeSelectMessagesByThread(threadId) : null),
    [threadId]
  );
  const messages = useSelector((state) =>
    selectMessages ? selectMessages(state) : []
  );

  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(userId);

  useEffect(() => {
    if (!threadId) return;

    dispatch(setCurrentThreadId(threadId));
    dispatch(fetchMessagesThunk(threadId));
    joinThread(threadId);

    if (lastMarkedRef.current !== threadId) {
      dispatch(resetUnreadCount({ threadId }));
      emitMarkThreadRead?.(threadId);
      lastMarkedRef.current = threadId;
    }

    return () => {
      dispatch(setCurrentThreadId(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, dispatch, joinThread, emitMarkThreadRead]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [text, setText] = useState('');

  const handleSend = () => {
    const t = text.trim();
    if (!t || !threadId) return;

    sendMessage?.({
      threadId,
      senderId: userId,
      text: t,
      timestamp: new Date().toISOString(),
    });

    setText('');
    dispatch(resetUnreadCount({ threadId }));
    emitMarkThreadRead?.(threadId);
  };

  const isPending = conversation?.status === 'pending';

  return (
    <div className="fixed bottom-4 right-[100px] w-[320px] max-h-[70vh] bg-white rounded-xl shadow-xl border z-[60] flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 rounded-t-xl bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <img
            src={avatar}
            alt={title}
            className="w-8 h-8 rounded-full object-cover border border-white/40"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-[11px] opacity-80">
              {isPending ? 'Pending approval' : 'Chat'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="hover:bg-white/10 rounded p-1"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Minimize"
            title="Minimize"
          >
            <FiMinus className="w-4 h-4" />
          </button>
          <button
            className="hover:bg-white/10 rounded p-1"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="px-3 py-2 overflow-y-auto flex-1 bg-gray-50">
            {isPending ? (
              <div className="bg-white p-3 rounded-lg border text-gray-700 text-sm">
                This request is pending. You’ll be able to chat after approval.
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <MessageBubble
                    key={m._id || `${m.timestamp}-${i}`}
                    message={m}
                    currentUserId={userId}
                    avatar={
                      (m?.sender?._id || m?.senderId) === userId
                        ? user?.profileImage ||
                          `https://i.pravatar.cc/150?u=${userId}`
                        : avatar
                    }
                  />
                ))}
                <div ref={msgEndRef} />
              </>
            )}
          </div>

          {!isPending && (
            <div className="p-2 border-t bg-white rounded-b-xl">
              <div className="flex items-center gap-2">
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
                  placeholder="Type a message…"
                  className="flex-1 text-sm px-3 py-2 border rounded-full outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSend}
                  className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
