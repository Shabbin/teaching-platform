'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSocket from '../../../hooks/useSocket';
import {
  addOrUpdateConversation,
  setCurrentThreadId,
  resetUnreadCount,
} from '../../../redux/chatSlice';
import { fetchConversationsThunk } from '../../../redux/chatThunks';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';

export default function StudentMessengerPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const studentId = user?.id || user?._id;

  const conversations = useSelector((state) => {
    const base = state.chat.conversations || [];
    const lastMessages = state.chat.lastMessagesByThread || {};
    const statuses = state.chat.conversationStatusesById || {};

    return base.map((conv) => ({
      ...conv,
      lastMessage: lastMessages[conv.threadId]?.text || conv.lastMessage,
      status: statuses[conv.requestId] || conv.status,
    }));
  });

  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasFetchedRef = useRef(false);

  const dedupedConversations = useMemo(() => {
    const map = new Map();
    conversations.forEach((c) => {
      if (c.threadId && !map.has(c.threadId)) {
        map.set(c.threadId, c);
      }
    });
    return Array.from(map.values());
  }, [conversations]);

  const fetchConversations = useCallback(async () => {
    if (!studentId || !token) return;
    setLoading(true);
    setError(null);

    try {
      const convos = await dispatch(fetchConversationsThunk({ role: 'student', userId: studentId })).unwrap();

      if (convos.length > 0) {
        if (!selectedChat) {
          setSelectedChat(convos[0]);
        } else {
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

  // --- Socket logic ---
  const handleNewMessage = (message) => {
    const isCurrentThread = selectedChat && message.threadId === selectedChat.threadId;

    if (isCurrentThread) {
      // Update selected chat messages and last message directly
      setSelectedChat((prev) => ({
        ...prev,
        lastMessage: message.text,
        messages: [...(prev.messages || []), message],
      }));
    }

    dispatch(addOrUpdateConversation({
      threadId: message.threadId,
      lastMessage: message.text,
      lastMessageTimestamp: message.timestamp,
      incrementUnread: !isCurrentThread,  // Increment unread only if NOT current open thread
      messages: [message],
    }));
  };

  // Get joinThread, sendMessage, and emitMarkThreadRead from socket hook
  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(studentId, handleNewMessage);

  useEffect(() => {
    if (selectedChat?.threadId) {
      joinThread(selectedChat.threadId);
      console.log('Student joined thread:', selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

  useEffect(() => {
    if (studentId && token && !hasFetchedRef.current) {
      fetchConversations();
    }
  }, [studentId, token, fetchConversations]);

  useEffect(() => {
    if (dedupedConversations.length === 0) {
      if (selectedChat !== null) {
        setSelectedChat(null);
        console.log('No conversations, cleared selectedChat');
      }
      return;
    }
    if (!selectedChat || !dedupedConversations.find(c => c.threadId === selectedChat.threadId)) {
      setSelectedChat(dedupedConversations[0]);
      console.log('Updated selectedChat to first deduped conversation');
    }
  }, [dedupedConversations, selectedChat]);

  // Reset unread count and notify server when selecting a chat
  const handleSelectChat = (selected) => {
    const full = conversations.find((c) => c.threadId === selected.threadId);
    const finalSelection = full || selected;

    if (!full) {
      console.warn('Could not find full conversation for:', selected.threadId);
    }

    setSelectedChat(finalSelection);
    dispatch(setCurrentThreadId(finalSelection.threadId));
    dispatch(resetUnreadCount({ threadId: finalSelection.threadId }));  // Reset unread count locally

    if (emitMarkThreadRead) {
      emitMarkThreadRead(finalSelection.threadId); // Notify server/others that this thread is read
    }
  };

  if (loading) return <p className="p-4">Loading conversations...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList
        conversations={dedupedConversations}
        selectedChatId={selectedChat?.threadId}
        onSelect={handleSelectChat}
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
