'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSocket from '../../../hooks/useSocket';
import {
  setCurrentThreadId,
  resetUnreadCount,
} from '../../../redux/chatSlice';
import { fetchConversationsThunk } from '../../../redux/chatThunks';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';

export default function StudentMessengerPage() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.userInfo);
  const currentUserId = (user?.id || user?._id)?.toString();
  const onlineUserIds = useSelector((state) => state.chat.onlineUserIds || []);
  const conversations = useSelector((state) => state.chat.conversations);
  const conversationsLoaded = useSelector((state) => state.chat.conversationsLoaded);
  // 🔁 NEW: watch global currentThreadId set by MessengerPopup
  const currentThreadIdGlobal = useSelector((state) => state.chat.currentThreadId);

  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const joinedThreadsRef = useRef(new Set());
  const userSelectedChatRef = useRef(false);
  const lastResetThreadIdRef = useRef(null);

  // Helpers
  const avatarOf = useCallback(
    (conv) => {
      if (conv?.displayProfileImage) return conv.displayProfileImage;
      if (conv?.profileImage) return conv.profileImage;

      if (conv?.participants?.length && currentUserId) {
        const other = conv.participants.find((p) => String(p?._id) !== String(currentUserId));
        if (other?.profileImage) return other.profileImage;
      }

      const fallbackId = conv?.participantId || conv?.studentId || conv?.teacherId || 'unknown';
      return `https://i.pravatar.cc/150?u=${fallbackId}`;
    },
    [currentUserId]
  );

  const displayNameOf = useCallback(
    (conv) => {
      return (
        conv?.displayName ||
        conv?.name ||
        (() => {
          if (conv?.participants?.length && currentUserId) {
            const other = conv.participants.find((p) => String(p?._id) !== String(currentUserId));
            if (other?.name) return other.name;
          }
          return conv?.teacherName || conv?.studentName || 'Unknown';
        })()
      );
    },
    [currentUserId]
  );

  // Deduplicate + sort
  const dedupedConversations = useMemo(() => {
    const map = new Map();
    for (const c of conversations) {
      const id = c.threadId || c._id || c.requestId;
      if (id && !map.has(id)) map.set(id, c);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageTimestamp || 0) - new Date(a.lastMessageTimestamp || 0)
    );
  }, [conversations]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      const convos = await dispatch(
        fetchConversationsThunk({ role: 'student', userId: currentUserId })
      ).unwrap();

      if (convos.length > 0) {
        const keep =
          selectedChat && convos.find((c) => c.threadId === selectedChat.threadId);
        const nextSel = keep || convos[0];
        setSelectedChat(nextSel);
        dispatch(setCurrentThreadId(nextSel.threadId));
      } else {
        setSelectedChat(null);
        dispatch(setCurrentThreadId(null));
      }
      userSelectedChatRef.current = false;
    } catch (err) {
      setError(err?.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [dispatch, currentUserId, selectedChat]);

  useEffect(() => {
    if (!conversationsLoaded && currentUserId) {
      fetchConversations();
    }
  }, [conversationsLoaded, currentUserId, fetchConversations]);

  // ✅ NEW: if MessengerPopup sets currentThreadId, select it here
  useEffect(() => {
    if (!currentThreadIdGlobal) return;
    const found = dedupedConversations.find((c) => c.threadId === currentThreadIdGlobal);
    if (found && (!selectedChat || selectedChat.threadId !== found.threadId)) {
      userSelectedChatRef.current = true;
      setSelectedChat(found);
    }
  }, [currentThreadIdGlobal, dedupedConversations, selectedChat]);

  // Socket: page-local behavior only
  const handleNewMessage = useCallback((message) => {
    const isCurrent = selectedChat && message.threadId === selectedChat.threadId;
    if (isCurrent) {
      // no-op; Redux updates handled in useSocket
    }
  }, [selectedChat]);

  const handleRequestUpdate = useCallback(async (data) => {
    if (data?.type === 'approved') {
      fetchConversations();
    }
  }, [fetchConversations]);

  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(
    currentUserId,
    handleNewMessage,
    handleRequestUpdate
  );

  // Join selected room
  useEffect(() => {
    const tid = selectedChat?.threadId;
    if (tid && !joinedThreadsRef.current.has(tid)) {
      joinThread(tid);
      joinedThreadsRef.current.add(tid);
    }
  }, [selectedChat, joinThread]);

  // Join all conversation rooms
  useEffect(() => {
    if (!currentUserId || dedupedConversations.length === 0) return;
    dedupedConversations.forEach((convo) => {
      const tid = convo.threadId || convo._id || convo.requestId;
      if (tid && !joinedThreadsRef.current.has(tid)) {
        joinThread(tid);
        joinedThreadsRef.current.add(tid);
      }
    });
  }, [currentUserId, dedupedConversations, joinThread]);

  // Keep a valid selection as convos change
  useEffect(() => {
    if (dedupedConversations.length === 0 && selectedChat !== null) {
      setSelectedChat(null);
      return;
    }
    if (!selectedChat && dedupedConversations.length > 0) {
      setSelectedChat(dedupedConversations[0]);
      return;
    }
    if (userSelectedChatRef.current) return;

    const stillExists = dedupedConversations.some((c) => c.threadId === selectedChat?.threadId);
    if (!stillExists && dedupedConversations.length > 0) {
      setSelectedChat(dedupedConversations[0]);
    }
  }, [dedupedConversations, selectedChat]);

  // ✅ Reset unread ONCE per opened thread (no infinite loop)
  useEffect(() => {
    const tid = selectedChat?.threadId;
    if (!tid) return;

    if (lastResetThreadIdRef.current === tid) return;
    lastResetThreadIdRef.current = tid;

    dispatch(resetUnreadCount({ threadId: tid }));
    emitMarkThreadRead?.(tid);
  }, [selectedChat?.threadId, dispatch]); // intentionally not depending on emitMarkThreadRead

  // User selecting a chat
  const handleSelectChat = (selected) => {
    const full = conversations.find((c) => c.threadId === selected.threadId);
    const finalSelection = full || selected;
    userSelectedChatRef.current = true;
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
        onlineUserIds={onlineUserIds}
        userId={currentUserId}
        isStudent={true}
        getAvatar={avatarOf}
        getDisplayName={displayNameOf}
      />
      <ChatPanel chat={selectedChat} user={user} sendMessage={sendMessage} />
    </div>
  );
}
