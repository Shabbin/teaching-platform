'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function MessengerPopup({ role: propRole }) {
  const user = useSelector((state) => state.user.userInfo);
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const userId = user?._id || user?.id;
  const role = propRole || user?.role || 'teacher';

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  useEffect(() => {
    if (open && token) fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token]);

  // Avatar helper: prioritize real profileImage, fallback to generated avatar
  const getAvatar = (conv) => {
    // These fields should be real image URLs if populated by backend
    if (conv.participantProfileImage) return conv.participantProfileImage;
    if (conv.studentProfileImage) return conv.studentProfileImage;
    if (conv.teacherProfileImage) return conv.teacherProfileImage;

    // If none found, fallback to generating an avatar URL with unique ID string
    const fallbackId = conv.participantId || conv.studentId || conv.teacherId || 'unknown';
    return `https://i.pravatar.cc/150?u=${fallbackId}`;
  };

const fetchConversations = async () => {
  setLoading(true);
  try {
    if (role === 'teacher') {
      // Fetch teacher requests for this teacher
      const res = await fetch(`http://localhost:5000/api/teacher-requests/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch teacher requests');
      const data = await res.json();

      // Filter relevant requests with postId and pending/approved status
      const filteredRequests = data.filter(
        (r) => ['pending', 'approved'].includes(r.status) && r.postId
      );

      // Keep only latest request per student to avoid duplicates
      const latestPerStudent = {};
      for (const r of filteredRequests) {
        const existing = latestPerStudent[r.studentId];
        if (!existing || new Date(r.requestedAt) > new Date(existing.requestedAt)) {
          latestPerStudent[r.studentId] = r;
        }
      }

      // Build conversation array
      const convos = await Promise.all(
        Object.values(latestPerStudent).map(async (r) => {
          let threadId = r.threadId || null;
          let lastMessage = r.message || '';

          if (r.status === 'approved') {
            const threadRes = await fetch(`http://localhost:5000/api/chat/thread/${r._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (threadRes.ok) {
              const threadData = await threadRes.json();
              threadId = threadData._id;
              const messages = threadData.messages || [];
              if (messages.length > 0) lastMessage = messages[messages.length - 1].text;

              // Find student participant from thread participants array (role === 'student')
              const studentParticipant = threadData.participants.find(
                (p) => p.role === 'student'
              );

              return {
                requestId: r._id,
                name: studentParticipant?.name || r.studentName || 'Student',
                topic: r.topic,
                status: r.status,
                lastMessage,
                unreadCount: r.unreadCount || 0,
                threadId,
                studentProfileImage: studentParticipant?.profileImage || null,
                studentId: studentParticipant?._id || r.studentId,
                participantId: studentParticipant?._id || r.studentId,
                avatar: null,
              };
            }
          }

          // Fallback for pending requests (no thread yet), use student info if populated
          const studentObj = typeof r.studentId === 'object' ? r.studentId : null;
          return {
            requestId: r._id,
            name: studentObj?.name || r.studentName || 'Student',
            topic: r.topic,
            status: r.status,
            lastMessage,
            unreadCount: r.unreadCount || 0,
            threadId,
            studentProfileImage: studentObj?.profileImage || null,
            studentId: studentObj?._id || r.studentId,
            participantId: studentObj?._id || r.studentId,
            avatar: null,
          };
        })
      );

      setConversations(convos);
    } else if (role === 'student') {
      // Fetch chat threads for student
      const chatRes = await fetch(`http://localhost:5000/api/chat/student/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!chatRes.ok) throw new Error('Failed to fetch student chat threads');
      const chatData = await chatRes.json();

      // Fetch student requests for status map
      const requestRes = await fetch(`http://localhost:5000/api/teacher-requests/student`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const requestData = requestRes.ok ? await requestRes.json() : [];

      const statusMap = {};
      for (const r of requestData) {
        statusMap[r._id] = r.status;
      }

      // Build conversation list by picking teacher participant
      const convos = chatData.map((thread) => {
        const latestSession = thread.sessions.reduce((latest, session) =>
          !latest || new Date(session.startedAt) > new Date(latest.startedAt) ? session : latest,
          null
        );

        const requestId = latestSession?.requestId;
        const status = requestId ? statusMap[requestId] || 'pending' : 'pending';

        // Find teacher participant (role === 'teacher')
        const teacherParticipant = thread.participants.find((p) => p.role === 'teacher');

        const lastMessage = thread.messages?.[thread.messages.length - 1]?.text || '';

        return {
          threadId: thread._id,
          name: teacherParticipant?.name || 'Unknown',
          lastMessage,
          status,
          unreadCount: 0,
          teacherProfileImage: teacherParticipant?.profileImage || null,
          participantId: teacherParticipant?._id,
          avatar: null,
        };
      });

      setConversations(convos);
    }
  } catch (err) {
    console.error('Messenger popup error:', err);
  } finally {
    setLoading(false);
  }
};


  // Approve & Reject handlers for teacher
  const handleApprove = useCallback(
    async (requestId) => {
      await fetch(`http://localhost:5000/api/teacher-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConversations();
    },
    [token]
  );

  const handleReject = useCallback(
    async (requestId) => {
      await fetch(`http://localhost:5000/api/teacher-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConversations();
    },
    [token]
  );

  // Filter conversations by search
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
