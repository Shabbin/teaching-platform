'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  setLoading,
  setError,
  addOrUpdateConversation,
  updateLastMessageInConversation,
  incrementUnreadCount,
  addMessageToThread
} from '../../../redux/chatSlice';
import {
  fetchConversationsThunk,
  approveRequestThunk,
  // markThreadAsRead,  <-- removed import
} from '../../../redux/chatThunks';
import useSocket from '../../../hooks/useSocket';
import { FiMessageCircle } from 'react-icons/fi';

export default function MessengerPopup({ role: propRole }) {
  const user = useSelector((state) => state.user.userInfo);
  const conversations = useSelector((state) => state.chat.conversations);
  const loading = useSelector((state) => state.chat.loading);
  const error = useSelector((state) => state.chat.error);

  // Online user IDs for online indicator
  const onlineUserIds = useSelector((state) => state.chat.onlineUserIds || []);

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [needsRefresh, setNeedsRefresh] = useState(false);

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

  const hasFetchedRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
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
  }, [dispatch, userId, role]);

  // Initial fetch on mount
  useEffect(() => {
    if (!userId) return;
    if (!hasFetchedRef.current) {
      fetchConversations();
      hasFetchedRef.current = true;
    }
  }, [userId, fetchConversations]);

  // Fetch conversations when popup opens and refresh is needed
  useEffect(() => {
    if (open && needsRefresh && userId) {
      fetchConversations();
      setNeedsRefresh(false);
    }
  }, [open, needsRefresh, userId, fetchConversations]);

  // Mark needsRefresh when navigating away from messenger page
  useEffect(() => {
    if (!pathname.includes('/messenger')) {
      setNeedsRefresh(true);
    }
  }, [pathname]);

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

    const isOwnMessage = message.senderId === userId;
    const isOnMessengerPage = pathname.includes('/messenger');

    if (!isOwnMessage && !isOnMessengerPage) {
      dispatch(incrementUnreadCount({ threadId: message.threadId }));
    }
  };

  const handleConversationListUpdate = (fullThread) => {
    dispatch(addOrUpdateConversation(fullThread));
  };

  // Handle new tuition request notification
  const handleNewTuitionRequest = useCallback(
    (data) => {
      if (data?.type === 'new') {
        console.log('[MessengerPopup] New tuition request received:', data);

        const lastMsgText = data.lastMessageText?.trim() || 'New tuition request received';
        const lastMsgTimestamp = data.lastMessageTimestamp || new Date().toISOString();

        const realMessage = {
          _id: `tuition-${Date.now()}`,
          text: lastMsgText,
          senderId: data.studentId,
          senderName: data.studentName || 'Student',
          threadId: data.threadId,
          timestamp: lastMsgTimestamp,
          isSystemMessage: true,
        };

        dispatch(addMessageToThread({ threadId: data.threadId, message: realMessage }));
        dispatch(updateLastMessageInConversation({ threadId: data.threadId, message: realMessage }));
        dispatch(incrementUnreadCount({ threadId: data.threadId }));

        const isCurrentUserStudent = userId === data.studentId;
        const otherName = isCurrentUserStudent ? data.teacherName : data.studentName;
        const otherImage = isCurrentUserStudent ? data.teacherProfileImage : data.studentProfileImage;

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
            messages: [realMessage],
            status: 'pending',
            unreadCount: 1,
          })
        );
      }
    },
    [dispatch, userId]
  );

  const { joinThread } = useSocket(
    userId,
    handleNewMessage,
    handleNewTuitionRequest,
    handleConversationListUpdate
  );

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
      setOpen(false);
    }
  }, [pathname]);

  const handleMessengerClick = () => {
    if (pathname.includes('/messenger')) return;
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
        credentials: 'include', // important to send cookies
      });
      fetchConversations();
    } catch (err) {
      console.error('Reject request failed:', err);
    }
  };

  const getAvatar = (conv) => {
    if (conv.profileImage) return conv.profileImage;

    if (conv.participants && conv.participants.length) {
      // Find participant other than current user
      const other = conv.participants.find(p => p._id.toString() !== userId);
      if (other && other.profileImage) return other.profileImage;
    }

    // Fallback
    const fallbackId = conv.participantId || conv.studentId || conv.teacherId || 'unknown';
    return `https://i.pravatar.cc/150?u=${fallbackId}`;
  };

  // Get the other participant's userId string for online check
  const getOtherParticipantId = (conv) => {
    if (!conv.participants || !userId) return null;
    return conv.participants.find(p => p._id.toString() !== userId)?._id.toString() || null;
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
              filteredConversations.map((chat, index) => {
                const otherUserId = getOtherParticipantId(chat);
                const isOnline = otherUserId && onlineUserIds.includes(otherUserId);
                return (
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
                    <div className="relative">
                      <img
                        src={getAvatar(chat)}
                        alt={chat.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                      />
                      <span
                        title={isOnline ? "Online" : "Offline"}
                        className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white ${
                          isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                       {(() => {
  if (chat.name) return chat.name;

  if (chat.participants && userId) {
    const other = chat.participants.find(p => p._id.toString() !== userId);
    if (other && other.name) return other.name;
  }
  return chat.studentName || chat.teacherName || 'Unknown';
})()}
                        {chat.unreadCount > 0 && (
                          <span className="text-xs bg-red-600 text-white rounded-full px-2 py-0.5">
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
                    )}
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
    </>
  );
}
