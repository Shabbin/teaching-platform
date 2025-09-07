'use client';

import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  addOrUpdateConversation,
  updateLastMessageInConversation,
  incrementUnreadCount,
  addMessageToThread,
  setCurrentThreadId,
} from '../../../redux/chatSlice';
import {
  fetchConversationsThunk,
  approveRequestThunk,
} from '../../../redux/chatThunks';
import useSocket from '../../../hooks/useSocket';
import { FiMessageCircle } from 'react-icons/fi';
import API from '../../../../api/axios';
import MiniChatWindow from './MiniChatWindow';

export default function MessengerPopup({ role: propRole }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const user = useSelector((s) => s.user.userInfo);
  const conversations = useSelector((s) => s.chat.conversations);
  const conversationsLoaded = useSelector((s) => s.chat.conversationsLoaded);
  const error = useSelector((s) => s.chat.error);
  const onlineUserIds = useSelector((s) => s.chat.onlineUserIds || []);

  const userIdRaw = user?.id || user?._id || '';
  const userId = userIdRaw?.toString() || '';
  const role = propRole || user?.role || 'teacher';

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const hasFetchedRef = useRef(false);

  // mini chat windows
  const [miniChats, setMiniChats] = useState([]); // [{ threadId, chat }]

  const openMiniChat = useCallback((chat) => {
    const tid = chat?.threadId || chat?._id || chat?.requestId;
    if (!tid) return;
    setMiniChats((prev) =>
      prev.some((w) => w.threadId === tid) ? prev : [...prev, { threadId: tid, chat }]
    );
  }, []);

  const closeMiniChat = useCallback((threadId) => {
    setMiniChats((prev) => prev.filter((w) => w.threadId !== threadId));
  }, []);

  // helpers
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

  // unique other-user count for badge
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

  // load conversations once
  useEffect(() => {
    if (!userId || hasFetchedRef.current || conversationsLoaded) return;
    dispatch(fetchConversationsThunk({ userId })).finally(() => {
      hasFetchedRef.current = true;
    });
  }, [dispatch, userId, conversationsLoaded]);

  // socket bindings
  const handleNewMessage = useCallback(
    (msg) => {
      const isOwn = String(msg.senderId || msg?.sender?._id) === String(userId);
      const onMessengerPage = pathname.includes('/messenger');
      if (!isOwn && !onMessengerPage) {
        // optional: playKnock(); // or show a toast
      }
    },
    [userId, pathname]
  );

  const handleNewTuitionRequest = useCallback(
    (data) => {
      if (data?.type !== 'new') return;

      const lastMsgText = data.lastMessageText?.trim() || 'New tuition request received';
      const lastMsgTimestamp = data.lastMessageTimestamp || new Date().toISOString();

      const systemMsg = {
        _id: `tuition-${Date.now()}`,
        text: lastMsgText,
        senderId: data.studentId,
        senderName: data.studentName || 'Student',
        threadId: data.threadId,
        timestamp: lastMsgTimestamp,
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
          lastMessage: lastMsgText,
          lastMessageTimestamp: lastMsgTimestamp,
          messages: [systemMsg],
          status: 'pending',
          unreadCount: 1,
        })
      );
    },
    [dispatch, userId]
  );

  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(
    userId,
    handleNewMessage,
    handleNewTuitionRequest
  );

  useEffect(() => {
    if (!userId) return;
    conversations.forEach((c) => {
      const tid = c.threadId || c._id || c.requestId;
      if (tid) joinThread(tid);
    });
  }, [conversations, joinThread, userId]);

  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const name = (displayNameOf(conv) || '').toLowerCase();
      const last = (conv.lastMessage || '').toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [conversations, searchTerm, displayNameOf]);

  return (
    // anchor the popup to the icon reliably
    <div className="relative inline-block">
      {/* Launcher */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative text-gray-600 hover:text-indigo-600 focus:outline-none"
        aria-label="Toggle Messenger"
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

      {/* Popover (top-right of the button) */}
      {open && (
        <div
          className="
            absolute top-11 right-0
            w-80 max-h-[70vh]
            bg-white border border-gray-200 rounded-xl shadow-xl
            p-4 z-[1200] flex flex-col
          "
        >
          {/* ▼ Pointed arrow */}
          <span className="absolute -top-2 right-6">
            {/* outer border triangle */}
            <span className="block w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-200"></span>
            {/* inner white triangle */}
            <span className="block w-0 h-0 -mt-[3px] ml-[1px] border-l-3 border-r-3 border-b-3 border-l-transparent border-r-transparent border-b-white"></span>
          </span>

          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[oklch(0.55_0.28_296.83)] font-semibold select-none">Chats</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              aria-label="Close Messenger"
            >
              ×
            </button>
          </div>

          <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search Messenger"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent flex-grow outline-none text-sm ml-2"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {!conversationsLoaded ? (
              <p className="text-sm text-gray-500 text-center mt-8">Loading…</p>
            ) : error ? (
              <p className="text-sm text-red-500 text-center mt-8">{error}</p>
            ) : filteredConversations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-8">No conversations found.</p>
            ) : (
              filteredConversations.map((chat) => {
                const tid = chat.threadId || chat._id || chat.requestId;
                return (
                  <div
                    key={tid}
                    className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => {
                      if (!tid) return;

                      if (pathname.includes('/messenger')) {
                        // On the full messenger page: select the thread in the list/panel
                        dispatch(setCurrentThreadId(tid));
                        joinThread(tid);
                        setOpen(false);
                      } else {
                        // Elsewhere: open mini chat window
                        openMiniChat({
                          ...chat,
                          displayName: displayNameOf(chat),
                          displayProfileImage: avatarOf(chat),
                        });
                        dispatch(setCurrentThreadId(tid));
                        setOpen(false);
                      }
                    }}
                  >
                    <div className="relative">
                      <img
                        src={avatarOf(chat)}
                        alt={displayNameOf(chat)}
                        className="w-12 h-12 rounded-full object-cover"
                        loading="lazy"
                      />
                      <span
                        title={isOnline(chat) ? 'Online' : 'Offline'}
                        className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white ${
                          isOnline(chat) ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {displayNameOf(chat)}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="text-xs bg-red-600 text-white rounded-full px-2 py-0.5">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm truncate ${
                          chat.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {chat.lastMessage ||
                          (chat.status === 'pending' ? 'Pending approval…' : 'No messages yet')}
                      </p>
                    </div>

                    <div
                      className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                        chat.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : chat.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {chat.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              router.push(`/dashboard/${role}/messenger`);
            }}
            className="mt-3 text-sm text-indigo-600 hover:underline self-end"
          >
            See all in Messenger →
          </button>
        </div>
      )}

      {/* Mini chat windows (bottom-right) */}
      {miniChats.map((w, idx) => (
        <MiniChatWindow
          key={w.threadId}
          chat={w.chat}
          user={user}
          joinThread={joinThread}
          sendMessage={sendMessage}
          emitMarkThreadRead={emitMarkThreadRead}
          offsetIndex={idx}
          onClose={() => closeMiniChat(w.threadId)}
        />
      ))}
    </div>
  );
}
