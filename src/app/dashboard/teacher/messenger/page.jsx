'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';
import useSocket from '../../../hooks/useSocket';

import {
  resetUnreadCount,
  setCurrentThreadId,
} from '../../../redux/chatSlice';

import {
  fetchConversationsThunk,
  approveRequestThunk,
} from '../../../redux/chatThunks';

import API from '../../../../api/axios';

export default function MessengerPage() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.userInfo);
  const currentUserId = (user?.id || user?._id)?.toString();
  const conversations = useSelector((state) => state.chat.conversations);
  const conversationsLoaded = useSelector((state) => state.chat.conversationsLoaded);
  const onlineUserIds = useSelector((state) => state.chat.onlineUserIds || []);
  // 🔁 NEW: watch global currentThreadId set by MessengerPopup
  const currentThreadIdGlobal = useSelector((state) => state.chat.currentThreadId);

  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const joinedThreadsRef = useRef(new Set());
  const userSelectedChatRef = useRef(false);
  const lastResetThreadIdRef = useRef(null);

  // ---------- helpers ----------
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
          return conv?.studentName || conv?.teacherName || 'Unknown';
        })()
      );
    },
    [currentUserId]
  );

  // Deduplicate + sort conversations by latest activity
  const dedupedConversations = useMemo(() => {
    const map = new Map();
    for (const c of conversations) {
      const id = c.threadId || c._id || c.requestId;
      if (id && !map.has(id)) map.set(id, c);
    }
    const list = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageTimestamp || 0) - new Date(a.lastMessageTimestamp || 0)
    );
    return list;
  }, [conversations]);

  // Initial fetch / refresh
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      const convos = await dispatch(
        fetchConversationsThunk({ role: user?.role || 'teacher', userId: currentUserId })
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
  }, [dispatch, currentUserId, selectedChat, user?.role]);

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

  const handleApprove = async (requestId) => {
    try {
      await dispatch(approveRequestThunk(requestId)).unwrap();
      await fetchConversations();
    } catch (error) {
      console.error('Approve request failed:', error);
    }
  };

const handleReject = async (requestId) => {
  try {
    // ⬅️ CHANGED: POST -> PATCH and use /:id/reject
    await API.patch(`/teacher-requests/${requestId}/reject`, {}, { withCredentials: true });
    await fetchConversations();
  } catch (err) {
    console.error('Reject request failed:', err);
  }
};


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
        getAvatar={avatarOf}
        getDisplayName={displayNameOf}
      />
      <ChatPanel
        chat={selectedChat}
        user={user}
        onApprove={handleApprove}
        onReject={handleReject}
        sendMessage={sendMessage}
      />
    </div>
  );
}
