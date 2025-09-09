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
  // watch global currentThreadId set by popup
  const currentThreadIdGlobal = useSelector((state) => state.chat.currentThreadId);

  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const joinedThreadsRef = useRef(new Set());
  const userSelectedChatRef = useRef(false);
  const lastResetThreadIdRef = useRef(null);

  // ---------- identity helpers ----------
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

  // ---------- robust de-duplication ----------
  // Many backends send one convo with only requestId (pending) and then another with threadId (after approve).
  // We prefer the item with a threadId; otherwise keep the newest by timestamp.
  const dedupedConversations = useMemo(() => {
    // Sort newest first so "latest wins" where ties occur
    const sorted = (conversations || []).slice().sort(
      (a, b) =>
        new Date(b.lastMessageTimestamp || 0) - new Date(a.lastMessageTimestamp || 0)
    );

    // Helper to pluck a requestId if not directly present
    const getReqId = (c) =>
      c?.requestId ||
      (Array.isArray(c?.sessions) ? c.sessions.find((s) => s?.requestId)?.requestId : null) ||
      null;

    // Key by "requestId if present, else threadId/_id" to collapse duplicates
    const map = new Map();
    for (const c of sorted) {
      const reqId = getReqId(c);
      const tid = c?.threadId || null;
      const key = reqId || tid || c?._id;
      if (!key) continue;

      const existing = map.get(key);
      if (!existing) {
        map.set(key, c);
        continue;
      }

      // Prefer the one that has a threadId
      const existingHasThread = !!existing.threadId;
      const candidateHasThread = !!tid;

      if (!existingHasThread && candidateHasThread) {
        map.set(key, c);
        continue;
      }

      // If both have/ both don't have threadId, keep the newer one by timestamp
      const eTs = new Date(existing.lastMessageTimestamp || 0);
      const cTs = new Date(c.lastMessageTimestamp || 0);
      if (cTs > eTs) {
        map.set(key, c);
      }
    }

    // Final sorted list
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessageTimestamp || 0) - new Date(a.lastMessageTimestamp || 0)
    );
  }, [conversations]);

  // ---------- fetch conversations ----------
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
        if (nextSel?.threadId) {
          dispatch(setCurrentThreadId(nextSel.threadId));
        }
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

  // If popup sets currentThreadId, reflect selection here
  useEffect(() => {
    if (!currentThreadIdGlobal) return;
    const found = dedupedConversations.find((c) => c.threadId === currentThreadIdGlobal);
    if (found && (!selectedChat || selectedChat.threadId !== found.threadId)) {
      userSelectedChatRef.current = true;
      setSelectedChat(found);
    }
  }, [currentThreadIdGlobal, dedupedConversations, selectedChat]);

  // ---------- socket bindings ----------
  const handleNewMessage = useCallback(
    (message) => {
      const isCurrent = selectedChat && message.threadId === selectedChat.threadId;
      if (isCurrent) {
        // no-op; Redux already updates via useSocket
      }
    },
    [selectedChat]
  );

  const handleRequestUpdate = useCallback(
    async (data) => {
      if (data?.type === 'approved') {
        // Refresh and jump to the approved thread as soon as it exists
        await fetchConversations();
        if (data.threadId) {
          dispatch(setCurrentThreadId(data.threadId));
        }
      }
    },
    [fetchConversations, dispatch]
  );

  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(
    currentUserId,
    handleNewMessage,
    handleRequestUpdate
  );

  // Join selected room (once)
  useEffect(() => {
    const tid = selectedChat?.threadId;
    if (tid && !joinedThreadsRef.current.has(tid)) {
      joinThread(tid);
      joinedThreadsRef.current.add(tid);
    }
  }, [selectedChat, joinThread]);

  // Join all rooms that actually have a threadId
  useEffect(() => {
    if (!currentUserId || dedupedConversations.length === 0) return;
    dedupedConversations.forEach((convo) => {
      const tid = convo.threadId; // only join real threads
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

  // Reset unread ONCE per opened thread
  useEffect(() => {
    const tid = selectedChat?.threadId;
    if (!tid) return;

    if (lastResetThreadIdRef.current === tid) return;
    lastResetThreadIdRef.current = tid;

    dispatch(resetUnreadCount({ threadId: tid }));
    emitMarkThreadRead?.(tid);
  }, [selectedChat?.threadId, dispatch]); // intentionally not depending on emitMarkThreadRead

  // User selects a chat from the list
  const handleSelectChat = (selected) => {
    // Rehydrate from store (may have fresher fields)
    const full = conversations.find((c) => c.threadId === selected.threadId);
    const finalSelection = full || selected;
    userSelectedChatRef.current = true;
    setSelectedChat(finalSelection);
    if (finalSelection?.threadId) {
      dispatch(setCurrentThreadId(finalSelection.threadId));
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
