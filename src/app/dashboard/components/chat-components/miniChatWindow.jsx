// app/dashboard/components/chat-components/MiniChatWindow.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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

// 🔽 Tiny built-in emoji palette—no external deps.
const QUICK_EMOJIS = [
  '😀','😁','😂','🤣','😊','😍','😘','😎','🙂','😉',
  '🥰','🤗','🤩','🤔','😴','😇','🙃','😌','😅','🤤',
  '😭','😢','😤','😡','😱','🤯','🤨','😬','😐','🙄',
  '👍','👏','🙏','🤝','💯','🎉','✨','🔥','⚡','🌟',
  '❤️','💙','💚','💛','🧡','💜','🖤','🤍','🤎','💖',
];

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

  // 🔽 emoji UI state/refs
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiBtnRef = useRef(null);
  const emojiPanelRef = useRef(null);
  const inputRef = useRef(null);
  const lastCaretRef = useRef({ start: null, end: null });

  // 🔽 robust scroll helper (lands exactly at true bottom)
  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = listRef.current;
    if (!el) return;

    if (behavior === 'smooth') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 0);
    });
  }, []);

  // local status mirrors chat.status; flips instantly on approve/reject
  const [localStatus, setLocalStatus] = useState(chat?.status || 'approved');
  useEffect(() => {
    setLocalStatus(chat?.status || 'approved');
  }, [chat?.status]);

  // autoscroll when messages change or when expanding from minimized
  useEffect(() => {
    if (!minimized) scrollToBottom('smooth');
  }, [messages.length, minimized, scrollToBottom]);

  // join + fetch on open
  useEffect(() => {
    if (!threadId) return;

    joinThread?.(threadId);
    dispatch(fetchMessagesThunk(threadId)).finally(() => {
      setTimeout(() => scrollToBottom('auto'), 0);
    });

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
    lastCaretRef.current = { start: null, end: null };
    scrollToBottom('smooth');
  };

  // Resolve requestId if not directly present on the convo
  const resolvedRequestId =
    chat?.requestId ||
    (Array.isArray(chat?.sessions)
      ? chat.sessions.find((s) => s?.requestId)?.requestId
      : null) ||
    null;

  const pushSystemMessage = (textMsg) => {
    const msg = {
      _id: `sys-${Date.now()}`,
      text: textMsg,
      threadId,
      senderId: 'system',
      timestamp: new Date().toISOString(),
      isSystemMessage: true,
    };
    dispatch(addMessageToThread({ threadId, message: msg }));
    dispatch(updateLastMessageInConversation({ threadId, message: msg }));
    scrollToBottom('smooth');
  };

  const handleApprove = async () => {
    if (!resolvedRequestId || busy) {
      if (!resolvedRequestId) {
        pushSystemMessage(
          'Cannot approve from mini window because requestId is missing. Open full Messenger to review.'
        );
      }
      return;
    }
    try {
      setBusy(true);
      await dispatch(approveRequestThunk(resolvedRequestId)).unwrap();
      setLocalStatus('approved');
      dispatch(updateConversationStatus({ requestId: resolvedRequestId, status: 'approved' }));
      dispatch(
        addOrUpdateConversation({
          threadId,
          requestId: resolvedRequestId,
          status: 'approved',
          lastMessageTimestamp: new Date().toISOString(),
        })
      );
      scrollToBottom('smooth');
    } catch (err) {
      console.error('Approve from mini chat failed:', err);
    } finally {
      setBusy(false);
    }
  };

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
      scrollToBottom('smooth');
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

  // 🔽 caret helpers so emoji inserts at cursor
  const updateCaretFromEvent = () => {
    const el = inputRef.current;
    if (!el) return;
    lastCaretRef.current = {
      start: el.selectionStart ?? text.length,
      end: el.selectionEnd ?? text.length,
    };
  };

  const insertAtCaret = (emoji) => {
    const el = inputRef.current;
    if (!el) {
      setText((t) => t + emoji);
      return;
    }
    const pos =
      lastCaretRef.current.start == null
        ? { start: el.selectionStart ?? text.length, end: el.selectionEnd ?? text.length }
        : lastCaretRef.current;

    const before = text.slice(0, pos.start);
    const after = text.slice(pos.end);
    const next = `${before}${emoji}${after}`;
    setText(next);

    requestAnimationFrame(() => {
      el.focus();
      const caretPos = pos.start + emoji.length;
      try {
        el.setSelectionRange(caretPos, caretPos);
      } catch {}
    });
  };

  // 🔽 Close emoji panel on outside click or ESC
  useEffect(() => {
    if (!showEmoji) return;
    const onDown = (e) => {
      const t = e.target;
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(t) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(t)
      ) {
        setShowEmoji(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setShowEmoji(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [showEmoji]);

  const handlePickEmoji = (e) => {
    insertAtCaret(e);
    setShowEmoji(false);
  };

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
          {(() => {
            const isApproved = (localStatus || 'approved') === 'approved';
            if (!isApproved) {
              return (
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-sm text-gray-700">
                    Request is <strong>{localStatus}</strong>. You’ll be able to chat here once it’s
                    approved.
                  </p>

                  {isTeacher && (localStatus === 'pending') && (
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

                  {isTeacher && (localStatus === 'pending') && !resolvedRequestId && (
                    <p className="mt-2 text-xs text-gray-500">
                      Request ID is missing in this conversation payload. Open full Messenger to review.
                    </p>
                  )}
                </div>
              );
            }

            return messages.length > 0 ? (
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
            );
          })()}
        </div>

        {/* INPUT */}
        <div className="px-3 py-2 border-t bg-gray-50 rounded-b-xl relative overflow-visible">
          {/* Emoji panel (anchored to the input area) */}
          {showEmoji && (
            <div
              ref={emojiPanelRef}
              className="absolute bottom-14 right-5 w-[280px] max-h-[220px] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl p-2 grid grid-cols-8 gap-1 z-[1001]"
              role="dialog"
              aria-label="Emoji picker"
            >
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => handlePickEmoji(e)}
                  className="text-xl p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring focus:ring-indigo-300"
                  aria-label={`Insert ${e}`}
                >
                  {e}
                </button>
              ))}
              <div className="col-span-8 text-[11px] text-gray-500 px-1 pt-1">
                Click an emoji to insert.
              </div>
            </div>
          )}

          {/* Input group as one pill so nothing shifts */}
          <div className="relative">
            {/* Left emoji button (absolute) */}
            <button
              ref={emojiBtnRef}
              onClick={() => {
                setShowEmoji((s) => !s);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xl px-2 py-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring focus:ring-indigo-300 disabled:opacity-60"
              aria-label="Open emoji panel"
              title="Emoji"
              disabled={!isApproved}
            >
              😊
            </button>

            {/* The input itself has padding to make room for emoji and send */}
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                updateCaretFromEvent();
              }}
              onClick={updateCaretFromEvent}
              onKeyUp={updateCaretFromEvent}
              onKeyDown={(e) => {
                updateCaretFromEvent();
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!isApproved}
              placeholder={isApproved ? 'Type a message…' : 'Disabled until approved'}
              className="w-full bg-white rounded-full pl-11 pr-24 py-2 text-sm border outline-none disabled:opacity-60"
            />

            {/* Right send button (absolute) */}
            <button
              onClick={handleSend}
              disabled={!isApproved || !text.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[64px] text-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-full px-3 py-1.5 text-sm transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
