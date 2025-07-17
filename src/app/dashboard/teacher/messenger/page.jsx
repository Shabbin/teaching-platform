'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import ConversationList from '../components/conversationList';
import ChatPanel from '../components/chatPanel';
import useSocket from '../../../hooks/useSocket';

export default function MessengerPage() {
  const user = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const teacherId = user?.id || user?._id;

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch conversations helper (removed selectedChat from deps!)
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/teacher-requests/teacher', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch requests');

      const data = await res.json();

      // Deduplicate and keep latest per student (only tuition requests with postId)
      const latestPerStudent = {};
      for (const r of data) {
        if (!r.postId) continue;
        const existing = latestPerStudent[r.studentId];
        if (!existing || new Date(r.requestedAt) > new Date(existing.requestedAt)) {
          latestPerStudent[r.studentId] = r;
        }
      }
      const filteredRequests = Object.values(latestPerStudent);

      // Fetch threads for approved requests
      const convos = await Promise.all(
        filteredRequests.map(async (r) => {
          let threadId = r.threadId || null;
          let messages = [];

          if (r.status === 'approved') {
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
            lastMessage: messages.at(-1)?.text || r.message || '',
            unreadCount: 0,
            messages, // keep messages here for quick access
          };
        })
      );

      setConversations(convos);

      // Auto-select first chat if none selected
      if (!selectedChat && convos.length > 0) {
        setSelectedChat(convos[0]);
      }

      setLoading(false);
      return convos;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setLoading(false);
      return [];
    }
  }, [token]); // <-- Only depend on token

  // Socket callbacks
  const handleNewMessage = (message) => {
    if (selectedChat && message.threadId === selectedChat.threadId) {
      setSelectedChat((prev) => ({
        ...prev,
        lastMessage: message.text,
        messages: [...(prev.messages || []), message], // update messages
      }));
    }

    setConversations((prevConvos) =>
      prevConvos.map((c) =>
        c.threadId === message.threadId
          ? { ...c, lastMessage: message.text }
          : c
      )
    );
  };

  const handleRequestUpdate = (updatedRequest) => {
    setConversations((prevConvos) => {
      const updatedConvos = prevConvos.map((c) =>
        c.requestId === updatedRequest._id ? { ...c, status: updatedRequest.status } : c
      );
      return updatedConvos;
    });

    if (selectedChat && selectedChat.requestId === updatedRequest._id) {
      setSelectedChat((prev) => ({ ...prev, status: updatedRequest.status }));
    }
  };

  // Initialize socket
  const { joinThread, sendMessage } = useSocket(teacherId, handleNewMessage, handleRequestUpdate);

  // Join chat room on selected chat change
  useEffect(() => {
    if (selectedChat?.threadId) {
      joinThread(selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

  // Load conversations on mount and when teacherId/token changes
  useEffect(() => {
    if (teacherId && token) {
      fetchConversations();
    }
  }, [teacherId, token, fetchConversations]);

  // Approve request & select updated chat
  const handleApprove = async (requestId) => {
    await fetch(`http://localhost:5000/api/teacher-requests/${requestId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const convos = await fetchConversations();
    const updated = convos.find((c) => c.requestId === requestId);
    if (updated) setSelectedChat(updated);
  };

  // Reject request & deselect chat
  const handleReject = async (requestId) => {
    await fetch(`http://localhost:5000/api/teacher-requests/${requestId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchConversations();
    setSelectedChat(null);
  };

  if (loading) return <p className="p-4">Loading conversations...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList
        conversations={conversations}
        selectedChatId={selectedChat?.requestId}
        onSelect={setSelectedChat} // Just sets selected chat, no fetch triggered
      />
      <ChatPanel
        chat={selectedChat}
        user={user}
        token={token}
        onApprove={handleApprove}
        onReject={handleReject}
        sendMessage={sendMessage}
      />
    </div>
  );
}
