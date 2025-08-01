// MessengerPopup.jsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  setLoading,
  setError,
  addOrUpdateConversation,
  updateLastMessageInConversation,
} from '../../../redux/chatSlice';
import {
  fetchConversationsThunk,
  approveRequestThunk,
  markThreadAsRead,
} from '../../../redux/chatThunks';
import useSocket from '../../../hooks/useSocket';
import { FiMessageCircle } from 'react-icons/fi';

export default function MessengerPopup({ role: propRole }) {
  const user = useSelector((state) => state.user.userInfo);
  const conversations = useSelector((state) => state.chat.conversations);
  const loading = useSelector((state) => state.chat.loading);
  const error = useSelector((state) => state.chat.error);

  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const userIdRaw = user?.id || user?._id || '';
  const userId = userIdRaw.toString();
  const role = propRole || user?.role || 'teacher';

  const [badgeCount, setBadgeCount] = useState(0);

  const totalUnreadUsers = conversations.reduce((userSet, convo) => {
    if (convo.unreadCount > 0 && convo.participants && convo.participants.length) {
      convo.participants.forEach((p) => {
        const pid = p._id?.toString();
        if (pid && pid !== userId) {
          userSet.add(pid);
        }
      });
    }
    return userSet;
  }, new Set()).size;

  useEffect(() => {
    setBadgeCount(totalUnreadUsers);
  }, [totalUnreadUsers]);

  useEffect(() => {
    console.log('[MessengerPopup] badgeCount:', badgeCount);
  }, [badgeCount]);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  const hasFetchedRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (!token || !userId) return;
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      await dispatch(fetchConversationsThunk({ userId, role })).unwrap();
    } catch (err) {
      console.error('MessengerPopup fetchConversations error:', err);
      dispatch(setError(err.message || 'Failed to fetch conversations'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, token, userId, role]);

  useEffect(() => {
    if (!token || !userId) return;
    if (!hasFetchedRef.current) {
      fetchConversations();
      hasFetchedRef.current = true;
    }
  }, [token, userId, fetchConversations]);

  const handleNewMessage = (message) => {
    dispatch(updateLastMessageInConversation({
      threadId: message.threadId,
      message: { text: message.text, timestamp: message.timestamp },
    }));

    dispatch(addOrUpdateConversation({
      threadId: message.threadId,
      lastMessage: message.text,
      lastMessageTimestamp: message.timestamp,
    }));
  };

  const handleConversationListUpdate = (fullThread) => {
    dispatch(addOrUpdateConversation(fullThread));
  };

  const { joinThread } = useSocket(userId, handleNewMessage, null, handleConversationListUpdate);

  useEffect(() => {
    if (!userId) return;
    conversations.forEach((convo) => {
      if (convo.threadId) {
        joinThread(convo.threadId);
      }
    });
  }, [conversations, joinThread, userId]);

  useEffect(() => {
    if (pathname.includes('/messenger') && open) {
      console.log('[MessengerPopup] Auto-closing popup while inside Messenger page');
      setOpen(false);
    }
  }, [pathname]);

  const handleMessengerClick = () => {
    if (pathname.includes('/messenger')) {
      console.log('[MessengerPopup] Skipping popup open: already on Messenger page');
      return;
    }
    setOpen((prev) => !prev);
  };

  const handleApprove = async (requestId) => {
    try {
      await dispatch(approveRequestThunk(requestId)).unwrap();
      fetchConversations();
    } catch (error) {
      console.error('Approve request failed:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await fetch(`http://localhost:5000/api/teacher-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConversations();
    } catch (err) {
      console.error('Reject request failed:', err);
    }
  };

  const getAvatar = (conv) => {
    if (conv.profileImage) return conv.profileImage;
    if (conv.participantProfileImage) return conv.participantProfileImage;
    if (conv.studentProfileImage) return conv.studentProfileImage;
    if (conv.teacherProfileImage) return conv.teacherProfileImage;

    const fallbackId = conv.participantId || conv.studentId || conv.teacherId || 'unknown';
    return `https://i.pravatar.cc/150?u=${fallbackId}`;
  };

  const filteredConversations = conversations.filter((conv) => {
    const displayName = conv.name || conv.teacherName || conv.studentName || '';
    const lastMessage = conv.lastMessage || '';
    return (
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <>
      <button
        onClick={handleMessengerClick}
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

      {open && (
        <div className="fixed bottom-4 right-4 w-80 h-[420px] bg-white shadow-lg border rounded-xl p-4 z-50 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold select-none">Chats</h2>
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
            {loading ? (
              <p className="text-sm text-gray-500 text-center mt-8">Loading...</p>
            ) : error ? (
              <p className="text-sm text-red-500 text-center mt-8">{error}</p>
            ) : filteredConversations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-8">No conversations found.</p>
            ) : (
              filteredConversations.map((chat, index) => (
                <div
                  key={chat.threadId || chat.requestId || index}
                  className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  onClick={async () => {
                    setOpen(false);
                    if (chat.threadId && userId) {
                      try {
                        await dispatch(markThreadAsRead({ threadId: chat.threadId, userId }));
                      } catch (err) {
                        console.error('Failed to mark thread as read:', err);
                      }
                    }
                    router.push(
                      role === 'teacher'
                        ? `/dashboard/${role}/messenger/${chat.threadId || chat.requestId}`
                        : `/dashboard/${role}/messenger/${chat.threadId}`
                    );
                  }}
                >
                  <img src={getAvatar(chat)} alt={chat.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" loading="lazy" />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                      {chat.unreadCount > 0 && (
                        <span className="text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {chat.lastMessage || (chat.status === 'pending' ? 'Pending approval...' : 'No messages yet')}
                    </p>
                  </div>

                  {role === 'teacher' && chat.status === 'pending' ? (
                    <div className="flex space-x-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(chat.requestId);
                        }}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(chat.requestId);
                        }}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                      chat.status === 'approved' ? 'bg-green-100 text-green-800' :
                      chat.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`}
                    >
                      {chat.status}
                    </div>
                  )}
                </div>
              ))
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
    </>
  );
}
