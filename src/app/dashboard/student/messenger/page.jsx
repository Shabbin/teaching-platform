'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';  // added dispatch
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';
import useSocket from '../../../hooks/useSocket';
import { fetchConversationsThunk } from '../../../redux/chatThunks';  // import thunk

export default function StudentMessengerPage() {
  const dispatch = useDispatch();  // added dispatch
  const user = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const studentId = user?.id || user?._id;

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasFetchedRef = useRef(false);

  // ✅ Fetch chat threads via thunk instead of manual fetch
  const fetchConversations = useCallback(async () => {
    if (!studentId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const convos = await dispatch(fetchConversationsThunk({ role: 'student', userId: studentId })).unwrap();
      setConversations(convos);
      if (!selectedChat && convos.length > 0) {
        setSelectedChat(convos[0]);
      }
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dispatch, studentId, token, selectedChat]);

  // ✅ Socket logic (unchanged)
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

  const { joinThread, sendMessage } = useSocket(studentId, handleNewMessage);

  useEffect(() => {
    if (selectedChat?.threadId) {
      joinThread(selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

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
