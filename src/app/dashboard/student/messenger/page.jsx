'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';
import useSocket from '../../../hooks/useSocket';
import {
  addOrUpdateConversation,

} from '../../../redux/chatSlice';
import { fetchConversationsThunk,  } from '../../../redux/chatThunks';

export default function StudentMessengerPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const studentId = user?.id || user?._id;

  // Use conversations from Redux chat slice
  const conversations = useSelector((state) => state.chat.conversations);

  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasFetchedRef = useRef(false);

  // Deduplicate conversations by threadId to avoid duplicate keys and repeated UI entries
  const dedupedConversations = useMemo(() => {
    const map = new Map();
    conversations.forEach((c) => {
      if (c.threadId && !map.has(c.threadId)) {
        map.set(c.threadId, c);
      }
    });
    return Array.from(map.values());
  }, [conversations]);

  // Fetch conversations using thunk
  const fetchConversations = useCallback(async () => {
    if (!studentId || !token) return;
    setLoading(true);
    setError(null);

    try {
      const convos = await dispatch(fetchConversationsThunk({ role: 'student', userId: studentId })).unwrap();
      // Conversations are saved to Redux state by thunk's fulfilled reducer
      // We just handle local UI here

      if (convos.length > 0) {
        if (!selectedChat) {
          setSelectedChat(convos[0]);
        } else {
          // Update selectedChat with fresh data if available
          const updated = convos.find(c => c.threadId === selectedChat.threadId);
          if (updated) {
            setSelectedChat(updated);
          } else {
            setSelectedChat(convos[0]);
          }
        }
      } else {
        setSelectedChat(null);
      }
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, studentId, selectedChat]);

  // Socket callbacks
  const handleNewMessage = (message) => {
    if (selectedChat && message.threadId === selectedChat.threadId) {
      setSelectedChat((prev) => ({
        ...prev,
        lastMessage: message.text,
        messages: [...(prev.messages || []), message],
      }));
    }

    dispatch(addOrUpdateConversation({
      threadId: message.threadId,
      lastMessage: message.text,
    }));
  };

  // Optional: If you want to handle request status update later, you can add handleRequestUpdate similar to teacher's

  // Initialize socket with callbacks
  const { joinThread, sendMessage } = useSocket(studentId, handleNewMessage);

  // Join socket room on selected chat change
  useEffect(() => {
    if (selectedChat?.threadId) {
      joinThread(selectedChat.threadId);
      console.log('Joined thread:', selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

  // Fetch conversations on mount / token or studentId change
  useEffect(() => {
    if (studentId && token && !hasFetchedRef.current) {
      fetchConversations();
    }
  }, [studentId, token, fetchConversations]);

  // When dedupedConversations changes, validate selectedChat still exists
  useEffect(() => {
    if (dedupedConversations.length === 0) {
      if (selectedChat !== null) {
        setSelectedChat(null);
        console.log('No conversations available, clearing selectedChat');
      }
      return;
    }
    if (!selectedChat || !dedupedConversations.find(c => c.threadId === selectedChat.threadId)) {
      setSelectedChat(dedupedConversations[0]);
      console.log('Updated selectedChat to first deduped conversation');
    }
  }, [dedupedConversations, selectedChat]);

  if (loading) return <p className="p-4">Loading conversations...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList
        conversations={dedupedConversations}
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
