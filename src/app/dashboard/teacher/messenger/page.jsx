'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ConversationList from '../components/conversationList';
import ChatPanel from '../components/chatPanel';

export default function MessengerPage() {
  const user = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const teacherId = user?.id || user?._id;

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch requests');

      const data = await res.json();

      const convos = await Promise.all(
        data.map(async (r) => {
          let threadId = r.threadId || null;
          let messages = [];

          // If request is approved, fetch the thread to get threadId and messages
          if (r.status === 'approved' && !threadId) {
            const threadRes = await fetch(`http://localhost:5000/api/chat/thread/${r._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (threadRes.ok) {
              const threadData = await threadRes.json();
              threadId = threadData._id;
              messages = threadData.messages || [];
            }
          }

          return {
            studentId: r.studentId,
            studentName: r.studentName,
            requestId: r._id,
            topic: r.topic,
            status: r.status,
            threadId,
            lastMessage: messages[messages.length - 1]?.text || r.message || '',
            unreadCount: 0,
          };
        })
      );

      setConversations(convos);
      return convos;
    } catch (err) {
      console.error('Fetch convo error:', err);
      return [];
    }
  };

  const handleApprove = async (requestId) => {
    await fetch(`http://localhost:5000/api/teacher-requests/${requestId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    const convos = await fetchConversations();
    const updated = convos.find((c) => c.requestId === requestId);
    if (updated) setSelectedChat(updated);
  };

  const handleReject = async (requestId) => {
    await fetch(`http://localhost:5000/api/teacher-requests/${requestId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetchConversations();
    setSelectedChat(null);
  };

  useEffect(() => {
    if (teacherId && token) fetchConversations();
  }, [teacherId, token]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList
        conversations={conversations}
        selectedChatId={selectedChat?.requestId}
        onSelect={setSelectedChat}
      />
      <ChatPanel
        chat={selectedChat}
        user={user}
        token={token}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
