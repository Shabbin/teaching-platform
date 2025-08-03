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
import { playKnock } from '../../../utils/knock';

export default function StudentMessengerPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const studentId = user?.id || user?._id;
const onlineUserIds = useSelector((state) => state.chat.onlineUserIds || []);
  const conversationsLoaded = useSelector((state) => state.chat.conversationsLoaded);

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

  // Ref to store last knock timestamp for debounce
  const lastKnockTimeRef = useRef(0);

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

      // Mark conversations as loaded in Redux to prevent refetch
      dispatch({ type: 'chat/setConversationsLoaded', payload: true });
    } catch (err) {
      setError(err.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, studentId, selectedChat]);

  // Debounced knock sound function
  function playKnockDebounced() {
    const now = Date.now();
    if (now - lastKnockTimeRef.current > 3000) { // 3 seconds debounce
      playKnock();
      lastKnockTimeRef.current = now;
    }
  }

  // --- Socket logic ---
  const handleNewMessage = (message) => {
    const currentThreadId = selectedChat?.threadId ? String(selectedChat.threadId) : null;
    const messageThreadId = String(message.threadId);

    const isCurrentThread = currentThreadId === messageThreadId;

    if (!isCurrentThread) {
      playKnockDebounced();
    } else {
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
      incrementUnread: !isCurrentThread,
      messages: [message],
    }));
  };

  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(studentId, handleNewMessage);

  // Join thread when selectedChat changes
  useEffect(() => {
    if (selectedChat?.threadId) {
      joinThread(selectedChat.threadId);
      console.log('Student joined thread:', selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

  // Fetch conversations only if not loaded yet
  useEffect(() => {
    if (!conversationsLoaded && studentId && token) {
      fetchConversations();
    }
  }, [conversationsLoaded, studentId, token, fetchConversations]);

  // Update selectedChat if conversations change
useEffect(() => {
  if (dedupedConversations.length === 0) {
    if (selectedChat !== null) {
      console.log('[useEffect] dedupedConversations empty, clearing selectedChat');
      setSelectedChat(null);
    }
    return;
  }

  // Check if current selected chat exists in deduped conversations
  const exists = dedupedConversations.some(
    (c) => c.threadId === selectedChat?.threadId
  );

  if (!exists) {
    console.log('[useEffect] selectedChat no longer exists, setting to first conversation');
    setSelectedChat(dedupedConversations[0]);
  } else {
    console.log('[useEffect] selectedChat exists, keeping current selection');
  }
}, [dedupedConversations, selectedChat]);

  // Reset unread count and notify server when selecting a chat
  useEffect(() => {
    if (!selectedChat) return;

    dispatch(resetUnreadCount({ threadId: selectedChat.threadId }));

    if (emitMarkThreadRead) {
      emitMarkThreadRead(selectedChat.threadId);
    }
  }, [selectedChat, dispatch, emitMarkThreadRead]);

  const handleSelectChat = (selected) => {
    const full = conversations.find((c) => c.threadId === selected.threadId);
    const finalSelection = full || selected;

    if (!full) {
      console.warn('Could not find full conversation for:', selected.threadId);
    }

    setSelectedChat(finalSelection);
    dispatch(setCurrentThreadId(finalSelection.threadId));
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
           onlineUserIds={onlineUserIds}
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
