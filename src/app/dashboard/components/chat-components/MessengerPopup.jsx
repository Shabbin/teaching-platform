'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setError } from '../../../redux/chatSlice';
import { fetchConversationsThunk, approveRequestThunk } from '../../../redux/chatThunks';

export default function MessengerPopup({ role: propRole }) {
  const user = useSelector((state) => state.user.userInfo);
  const conversations = useSelector((state) => state.chat.conversations);
  const loading = useSelector((state) => state.chat.loading);
  const error = useSelector((state) => state.chat.error);

  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const dispatch = useDispatch();

  const userId = user?.id;
  const role = propRole || user?.role || 'teacher';

  // Load token once
  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  // Fetch conversations on mount if closed and no conversations
  useEffect(() => {
    if (!open && token && userId && conversations.length === 0) {
      fetchConversations();
    }
  }, [open, token, userId, conversations.length]);

  // Fetch conversations when popup opens
  useEffect(() => {
    if (open && token && userId) {
      fetchConversations();
    }
  }, [open, token, userId]);

  // Fetch conversations using centralized thunk
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

  // Approve request handler
  const handleApprove = async (requestId) => {
    try {
      await dispatch(approveRequestThunk(requestId)).unwrap();
      // After approve, refresh conversations to update UI
      fetchConversations();
    } catch (error) {
      console.error('Approve request failed:', error);
    }
  };

  // Reject request handler
  const handleReject = async (requestId) => {
    try {
      await fetch(`http://localhost:5000/api/teacher-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // After reject, refresh conversations to update UI
      fetchConversations();
    } catch (err) {
      console.error('Reject request failed:', err);
    }
  };

  // Avatar helper unchanged
const getAvatar = (conv) => {
  if (conv.profileImage) return conv.profileImage;
  if (conv.participantProfileImage) return conv.participantProfileImage;
  if (conv.studentProfileImage) return conv.studentProfileImage;
  if (conv.teacherProfileImage) return conv.teacherProfileImage;

  const fallbackId = conv.participantId || conv.studentId || conv.teacherId || 'unknown';
  return `https://i.pravatar.cc/150?u=${fallbackId}`;
};

  // Filter conversations by search term
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
        onClick={() => setOpen(!open)}
        className="text-gray-600 hover:text-indigo-600 "
        aria-label="Toggle Messenger"
        title="Messenger"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-4 right-4 w-80 h-[420px] bg-white shadow-lg border rounded-xl p-4 z-50 flex flex-col">
          {/* Header */}
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

          {/* Search */}
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 mb-3">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
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

          {/* Conversations */}
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
                  onClick={() => {
                    setOpen(false);
                    router.push(
                      role === 'teacher'
                        ? `/dashboard/${role}/messenger/${chat.threadId || chat.requestId}`
                        : `/dashboard/${role}/messenger/${chat.threadId}`
                    );
                  }}
                >
                  {/* Avatar */}
                  <img
                    src={getAvatar(chat)}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    loading="lazy"
                  />

                  {/* Name and last message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                      {chat.unreadCount > 0 && (
                        <span className="text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage ||
                        (chat.status === 'pending' ? 'Pending approval...' : 'No messages yet')}
                    </p>
                  </div>

                  {/* Approve/Reject buttons or status badge */}
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
                    <div
                      className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full
                        ${
                          chat.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : chat.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      `}
                    >
                      {chat.status}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* See all link */}
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
