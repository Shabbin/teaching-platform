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
  const router = useRouter();

  const userId = user?._id || user?.id;
  const role = propRole || user?.role || 'teacher'; // fallback role

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  useEffect(() => {
    if (open && token) fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      if (role === 'teacher') {
        const res = await fetch(`http://localhost:5000/api/teacher-requests/teacher`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch teacher requests');
        const data = await res.json();

        const latestPerStudent = {};
        for (const r of data) {
          if (!r.postId) continue;
          const existing = latestPerStudent[r.studentId];
          if (!existing || new Date(r.requestedAt) > new Date(existing.requestedAt)) {
            latestPerStudent[r.studentId] = r;
          }
        }

        const filtered = Object.values(latestPerStudent);

        const convos = await Promise.all(
          filtered.map(async (r) => {
            let threadId = r.threadId || null;
            let lastMessage = r.message;

            if (r.status === 'approved') {
              const threadRes = await fetch(`http://localhost:5000/api/chat/thread/${r._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (threadRes.ok) {
                const threadData = await threadRes.json();
                threadId = threadData._id;
                const messages = threadData.messages || [];
                if (messages.length > 0) {
                  lastMessage = messages[messages.length - 1].text;
                }
              }
            }

            return {
              requestId: r._id,
              name: r.studentName,
              topic: r.topic,
              status: r.status,
              lastMessage,
              unreadCount: r.unreadCount || 0,
              threadId,
            };
          })
        );

        setConversations(convos);
      } else if (role === 'student') {
        const res = await fetch(`http://localhost:5000/api/chat/student/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch student threads');
        const data = await res.json();

        const convos = data.map((thread) => {
          const teacher = thread.participants.find((p) => p._id !== userId);
          const lastMessage = thread.messages?.[thread.messages.length - 1]?.text || '';
          return {
            threadId: thread._id,
            name: teacher?.name || 'Unknown',
            lastMessage,
            status: 'approved',
            unreadCount: 0,
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

  return (
    <>
      <button onClick={() => setOpen(!open)} className="text-gray-600 hover:text-indigo-600">
        💬
      </button>

      {open && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white shadow-lg border rounded-xl p-4 z-50 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Messenger</h2>
            <button onClick={() => setOpen(false)}>❌</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet.</p>
            ) : (
              conversations.map((chat, index) => (
                <div key={chat.threadId || chat.requestId || index} className="border-b pb-2">
                  <div className="font-semibold">{chat.name}</div>
                  <div className="text-sm text-gray-600">{chat.lastMessage || 'No message'}</div>

                  {role === 'teacher' && chat.status === 'pending' ? (
                    <div className="mt-2 space-x-2">
                      <button
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                        onClick={() => handleApprove(chat.requestId)}
                      >
                        Approve
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                        onClick={() => handleReject(chat.requestId)}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 mt-1">{chat.status}</div>
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
            className="mt-4 text-sm text-indigo-600 hover:underline self-end"
          >
            See all in Messenger →
          </button>
        </div>
      )}
    </>
  );
}
