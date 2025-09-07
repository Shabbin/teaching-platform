'use client';

import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
  addOrUpdateConversation,
  updateLastMessageInConversation,
  incrementUnreadCount,
  addMessageToThread,
  setCurrentThreadId,
} from '../../../redux/chatSlice';
import { fetchConversationsThunk } from '../../../redux/chatThunks';
import useSocket from '../../../hooks/useSocket';
import { FiMessageCircle } from 'react-icons/fi';
import API from '../../../../api/axios';

/**
 * MessengerBell
 * - Replaces the old MessengerPopup
 * - Loads conversations ONCE (or when userId changes / never-loaded)
 * - Shows a fast flyout with a small arrow
 * - Fixed dimensions so it never renders tiny
 */
export default function MessengerBell({ role: propRole }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  // ---- state from store (stable, shallowEqual to reduce re-renders)
  const user = useSelector((s) => s.user.userInfo, shallowEqual);
  const conversations = useSelector((s) => s.chat.conversations, shallowEqual);
  const conversationsLoaded = useSelector((s) => s.chat.conversationsLoaded);
  const onlineUserIds = useSelector((s) => s.chat.onlineUserIds || [], shallowEqual);

  const userIdRaw = user?.id || user?._id || '';
  const userId = userIdRaw?.toString() || '';
  const role = propRole || user?.role || 'teacher';

  // ---- local UI state only
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const hasFetchedRef = useRef(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // ---- helpers
  const otherIdOf = useCallback(
    (conv) => {
      if (!conv?.participants || !userId) return null;
      const other = conv.participants.find((p) => String(p?._id) !== String(userId));
      return other ? String(other._id) : null;
    },
    [userId]
  );

  const avatarOf = useCallback(
    (conv) => {
      if (conv?.displayProfileImage) return conv.displayProfileImage;
      if (conv?.profileImage) return conv.profileImage;

      if (conv?.participants?.length && userId) {
        const other = conv.participants.find((p) => String(p?._id) !== String(userId));
        if (other?.profileImage) return other.profileImage;
      }

      const fallbackId = conv?.participantId || conv?.studentId || conv?.teacherId || 'unknown';
      return `https://i.pravatar.cc/150?u=${fallbackId}`;
    },
    [userId]
  );

  const displayNameOf = useCallback(
    (conv) => {
      return (
        conv?.displayName ||
        conv?.name ||
        (() => {
          if (conv?.participants?.length && userId) {
            const other = conv.participants.find((p) => String(p?._id) !== String(userId));
            if (other?.name) return other.name;
          }
          return conv?.studentName || conv?.teacherName || 'Unknown';
        })()
      );
    },
    [userId]
  );

  const isOnline = useCallback(
    (conv) => {
      const oid = otherIdOf(conv);
      return oid ? onlineUserIds.includes(oid) : false;
    },
    [otherIdOf, onlineUserIds]
  );

  // ---- badge = unique other-user ids that have unreadCount > 0
  const badgeCount = useMemo(() => {
    const set = new Set();
    for (const conv of conversations) {
      if (conv?.unreadCount > 0) {
        const oid = otherIdOf(conv);
        if (oid) set.add(oid);
      }
    }
    return set.size;
  }, [conversations, otherIdOf]);

  // ---- one-time fetch (no spinner here)
  useEffect(() => {
    if (!userId) return;
    if (hasFetchedRef.current) return;
    if (conversationsLoaded) {
      hasFetchedRef.current = true;
      return;
    }
    (async () => {
      try {
        await dispatch(fetchConversationsThunk({ userId, role })).unwrap();
      } catch (e) {
        // Silent: we don't want the bell to flicker with errors/spinners
        console.error('[MessengerBell] initial fetch failed:', e);
      } finally {
        hasFetchedRef.current = true;
      }
    })();
  }, [dispatch, userId, role, conversationsLoaded]);

  // ---- close panel when navigating to /messenger
  useEffect(() => {
    if (pathname.includes('/messenger') && open) setOpen(false);
  }, [pathname, open]);

  // ---- close on outside click / ESC
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      const btn = buttonRef.current;
      const panel = panelRef.current;
      if (!btn || !panel) return;
      if (btn.contains(e.target) || panel.contains(e.target)) return;
      setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // ---- sockets (do NOT refetch on open; rely on realtime events)
  const handleNewMessage = useCallback(
    (message) => {
      dispatch(
        updateLastMessageInConversation({
          threadId: message.threadId,
          message: { text: message.text, timestamp: message.timestamp },
        })
      );
      dispatch(
        addOrUpdateConversation({
          threadId: message.threadId,
          lastMessage: message.text,
          lastMessageTimestamp: message.timestamp,
        })
      );

      const isOwn = String(message.senderId || message?.sender?._id) === String(userId);
      const isOnMessengerPage = pathname.includes('/messenger');

      if (!isOwn && !isOnMessengerPage) {
        dispatch(incrementUnreadCount({ threadId: message.threadId }));
      }
    },
    [dispatch, pathname, userId]
  );

  const handleNewTuitionRequest = useCallback(
    (data) => {
      if (data?.type !== 'new') return;

      const text = data.lastMessageText?.trim() || 'New tuition request received';
      const ts = data.lastMessageTimestamp || new Date().toISOString();

      const systemMsg = {
        _id: `tuition-${Date.now()}`,
        text,
        senderId: data.studentId,
        senderName: data.studentName || 'Student',
        threadId: data.threadId,
        timestamp: ts,
        isSystemMessage: true,
      };

      dispatch(addMessageToThread({ threadId: data.threadId, message: systemMsg }));
      dispatch(updateLastMessageInConversation({ threadId: data.threadId, message: systemMsg }));
      dispatch(incrementUnreadCount({ threadId: data.threadId }));

      const isStudent = String(userId) === String(data.studentId);
      const otherName = isStudent ? data.teacherName : data.studentName;
      const otherImage = isStudent ? data.teacherProfileImage : data.studentProfileImage;

      dispatch(
        addOrUpdateConversation({
          threadId: data.threadId,
          requestId: data.request?._id,
          studentId: data.studentId,
          teacherId: data.teacherId,
          studentName: data.studentName,
          teacherName: data.teacherName,
          name: otherName,
          profileImage: otherImage,
          participants: data.participants,
          lastMessage: text,
          lastMessageTimestamp: ts,
          messages: [systemMsg],
          status: 'pending',
          unreadCount: 1,
        })
      );
    },
    [dispatch, userId]
  );

  const { joinThread } = useSocket(userId, handleNewMessage, handleNewTuitionRequest);

  // Join rooms once (idempotent server-side)
  useEffect(() => {
    if (!userId || conversations.length === 0) return;
    conversations.forEach((c) => {
      const tid = c.threadId || c._id || c.requestId;
      if (tid) joinThread(tid);
    });
  }, [userId, conversations, joinThread]);

  // ---- UI handlers
  const handleOpenToggle = () => {
    if (pathname.includes('/messenger')) return; // on full page, do nothing
    setOpen((p) => !p);
  };

  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = (displayNameOf(c) || '').toLowerCase();
      const last = (c.lastMessage || '').toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [conversations, searchTerm, displayNameOf]);

  // ---- render
  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={buttonRef}
        onClick={handleOpenToggle}
        className="relative text-gray-600 hover:text-indigo-600 focus:outline-none"
        aria-label="Messenger"
        title="Messenger"
      >
        <FiMessageCircle className="w-6 h-6" />
        {badgeCount > 0 && (
          <span
            className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
            style={{ minWidth: '18px', height: '18px' }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {/* Flyout */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-6 right-6 w-[360px] h-[520px] z-[1000]"
        >
          {/* Arrow */}
          <div
            className="absolute -top-2 right-4 w-3 h-3 bg-white rotate-45 shadow-md"
            style={{ borderRadius: 2 }}
          />
          {/* Panel */}
          <div className="relative w-full h-full bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="text-[oklch(0.55_0.28_296.83)] font-semibold">Recent Messages</div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-2">
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent flex-grow outline-none text-sm ml-2"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {filteredConversations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-6">No conversations.</p>
              ) : (
                filteredConversations.map((chat) => {
                  const tid = chat.threadId || chat._id || chat.requestId;
                  const unread = Number(chat.unreadCount) || 0;
                  return (
                    <button
                      key={tid}
                      onClick={() => {
                        if (!tid) return;
                        setOpen(false);
                        dispatch(setCurrentThreadId(tid));
                        // go to full messenger
                        router.push(`/dashboard/${role}/messenger/${tid}`);
                      }}
                      className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50 transition"
                    >
                      <div className="relative">
                        <img
                          src={avatarOf(chat)}
                          alt={displayNameOf(chat)}
                          className="w-11 h-11 rounded-full object-cover"
                          loading="lazy"
                        />
                        <span
                          className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white ${isOnline(chat) ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {displayNameOf(chat)}
                          </span>
                          {unread > 0 && (
                            <span className="ml-2 shrink-0 text-xs bg-red-600 text-white rounded-full px-2 py-0.5">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                        <div className={`text-xs truncate ${unread > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {chat.lastMessage || (chat.status === 'pending' ? 'Pending approval…' : 'No messages yet')}
                        </div>
                      </div>
                      <span
                        className={`ml-2 shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          chat.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : chat.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {chat.status}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(`/dashboard/${role}/messenger`);
                }}
                className="text-sm text-indigo-600 hover:underline"
              >
                View all in Messenger →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
