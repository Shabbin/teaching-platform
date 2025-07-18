'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';
import useSocket from '../../../hooks/useSocket';

export default function StudentMessengerPage() {
  const user = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const studentId = user?.id || user?._id;

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasFetchedRef = useRef(false);

  // Fetch student's chat threads
  const fetchConversations = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/chat/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch chat threads');
      const data = await res.json();

      const convos = data.map((thread) => {
        const teacher = thread.participants.find(p => p._id !== studentId);
        const latestSession = thread.sessions?.length ? thread.sessions[thread.sessions.length - 1] : null;
        const status = latestSession?.status || 'approved';

        return {
          threadId: thread._id,
          teacherId: teacher?._id,
          teacherName: teacher?.name,
          messages: thread.messages,
          lastMessage: thread.messages.at(-1)?.text || '',
          unreadCount: 0,
          status,
        };
      });

      setConversations(convos);
      // Only set selectedChat if none is selected to avoid re-render loop
      if (!selectedChat && convos.length > 0) {
        setSelectedChat(convos[0]);
      }
      setLoading(false);
      hasFetchedRef.current = true;
      return convos;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setLoading(false);
      return [];
    }
  }, [studentId, token]); // Removed selectedChat from deps!

  // Socket callback for new messages
  const handleNewMessage = (message) => {
    if (selectedChat && message.threadId === selectedChat.threadId) {
      setSelectedChat((prev) => ({
        ...prev,
        lastMessage: message.text,
        messages: [...(prev.messages || []), message],
      }));
    }

    setConversations((prevConvos) =>
      prevConvos.map((c) =>
        c.threadId === message.threadId ? { ...c, lastMessage: message.text } : c
      )
    );
  };

  // Initialize socket
  const { joinThread, sendMessage } = useSocket(studentId, handleNewMessage);

  // Join chat room on selected chat change
  useEffect(() => {
    if (selectedChat?.threadId) {
      joinThread(selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

  // Load conversations on mount and when studentId/token changes
  useEffect(() => {
    if (studentId && token && !hasFetchedRef.current) {
      fetchConversations();
    }
  }, [studentId, token, fetchConversations]);

  if (loading) return <p className="p-4">Loading conversations...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList
        conversations={conversations}
        selectedChatId={selectedChat?.threadId}
        onSelect={setSelectedChat}
        userId={studentId}
        isStudent={true}
      />
      <ChatPanel
        chat={selectedChat}
        user={user}
        token={token}
        sendMessage={sendMessage}
      />
    </div>
  );
}
