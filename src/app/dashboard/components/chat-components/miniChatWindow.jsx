// app/dashboard/components/chat-components/MiniChatWindow.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeSelectMessagesByThread } from '../../../redux/chatSelectors';
import {
  resetUnreadCount,
  setCurrentThreadId,
  addMessageToThread,
  updateLastMessageInConversation,
  addOrUpdateConversation,
  updateConversationStatus,
} from '../../../redux/chatSlice';
import { fetchMessagesThunk, approveRequestThunk } from '../../../redux/chatThunks';
import MessageBubble from './MessageBubble';
import API from '../../../../api/axios';

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
  const role = (user?.role || '').toLowerCase();
  const isTeacher = role === 'teacher';

  const selectMessages = useMemo(
    () => (threadId ? makeSelectMessagesByThread(threadId) : () => []),
    [threadId]
  );
  const messages = useSelector(selectMessages);

  const [minimized, setMinimized] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  // local status mirrors chat.status; flips instantly on approve/reject
  const [localStatus, setLocalStatus] = useState(chat?.status || 'approved');
  useEffect(() => {
    setLocalStatus(chat?.status || 'approved');
  }, [chat?.status]);

  // autoscroll when open
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

  // Resolve requestId if not directly present on the convo
  const resolvedRequestId =
    chat?.requestId ||
    (Array.isArray(chat?.sessions)
      ? chat.sessions.find((s) => s?.requestId)?.requestId
      : null) ||
    null;

  // Only used when we truly can’t proceed (no requestId in payload).
  const pushSystemMessage = (text) => {
    const msg = {
      _id: `sys-${Date.now()}`,
      text,
      threadId,
      senderId: 'system',
      timestamp: new Date().toISOString(),
      isSystemMessage: true,
    };
    dispatch(addMessageToThread({ threadId, message: msg }));
    dispatch(updateLastMessageInConversation({ threadId, message: msg }));
  };

  // ---------- APPROVE (same as Messenger: thunk) ----------
  const handleApprove = async () => {
    if (!resolvedRequestId || busy) {
      if (!resolvedRequestId) {
        // Show a one-time helper message if we literally can’t resolve the id.
        pushSystemMessage(
          'Cannot approve from mini window because requestId is missing. Open full Messenger to review.'
        );
      }
      return;
    }
    try {
      setBusy(true);
      await dispatch(approveRequestThunk(resolvedRequestId)).unwrap();

      // Flip UI to approved (no debug/system message)
      setLocalStatus('approved');
      dispatch(updateConversationStatus({ requestId: resolvedRequestId, status: 'approved' }));
      dispatch(
        addOrUpdateConversation({
          threadId,
          requestId: resolvedRequestId,
          status: 'approved',
          // keep last message untouched; server/socket will add anything if needed
          lastMessageTimestamp: new Date().toISOString(),
        })
      );
    } catch (err) {
      // No chat message on error; keep it quiet
      console.error('Approve from mini chat failed:', err);
    } finally {
      setBusy(false);
    }
  };

  // ---------- REJECT (same as Messenger: PATCH /:id/reject) ----------
  const handleReject = async () => {
    if (!resolvedRequestId || busy) {
      if (!resolvedRequestId) {
        pushSystemMessage(
          'Cannot reject from mini window because requestId is missing. Open full Messenger to review.'
        );
      }
      return;
    }
    const rejectionMessage =
      typeof window !== 'undefined'
        ? window.prompt('Add a (optional) rejection message:', '')
        : '';

    try {
      setBusy(true);
      await API.patch(
        `/teacher-requests/${resolvedRequestId}/reject`,
        { rejectionMessage },
        { withCredentials: true }
      );

      // Flip UI to rejected; no system text injected
      setLocalStatus('rejected');
      dispatch(updateConversationStatus({ requestId: resolvedRequestId, status: 'rejected' }));
      dispatch(
        addOrUpdateConversation({
          threadId,
          requestId: resolvedRequestId,
          status: 'rejected',
          lastMessageTimestamp: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.error('Reject from mini chat failed:', err);
    } finally {
      setBusy(false);
    }
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

  const isApproved = (localStatus || 'approved') === 'approved';
  const isPending = (localStatus || 'approved') === 'pending';

  const OPEN_H = 360;

  return (
    <div
      className="fixed bottom-4 z-[1000] rounded-xl shadow-lg border bg-white flex flex-col"
      style={{ width, right }}
      role="dialog"
      aria-label={`Chat with ${displayName}`}
    >
      {/* HEADER */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b rounded-t-xl"
        style={{ background: '#6d28d9' }}
      >
        <div className="flex items-center space-x-2">
          <div className="relative">
            <img
              src={avatar}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white/70"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white truncate max-w-[160px]">
              {displayName}
            </span>
            <span
              className={`text-[11px] px-1.5 py-[1px] rounded-full self-start ${
                localStatus === 'approved'
                  ? 'bg-white/20 text-white'
                  : localStatus === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
              title={`Status: ${localStatus || 'approved'}`}
            >
              {localStatus || 'approved'}
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

      {/* DRAWER */}
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
                Request is <strong>{localStatus}</strong>. You’ll be able to chat here once it’s
                approved.
              </p>

              {/* Teacher-only action buttons when pending */}
              {isTeacher && isPending && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={busy || !resolvedRequestId}
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={busy || !resolvedRequestId}
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60"
                  >
                    {busy ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              )}

              {/* Helpful hint if we cannot resolve the id */}
              {isTeacher && isPending && !resolvedRequestId && (
                <p className="mt-2 text-xs text-gray-500">
                  Request ID is missing in this conversation payload. Open full Messenger to review.
                </p>
              )}
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
