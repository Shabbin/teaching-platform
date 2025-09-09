'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
          return conv?.studentName || conv?.teacherName || 'Unknown';
        })()
      );
    },
    [currentUserId]
  );

  // ---------- robust de-duplication (prefer entries with threadId) ----------
  const dedupedConversations = useMemo(() => {
    const sorted = (conversations || []).slice().sort(
      (a, b) =>
        new Date(b.lastMessageTimestamp || 0) - new Date(a.lastMessageTimestamp || 0)
    );

    const getReqId = (c) =>
      c?.requestId ||
      (Array.isArray(c?.sessions) ? c.sessions.find((s) => s?.requestId)?.requestId : null) ||
      null;

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

      const existingHasThread = !!existing.threadId;
      const candidateHasThread = !!tid;

      if (!existingHasThread && candidateHasThread) {
        map.set(key, c);
        continue;
      }

      const eTs = new Date(existing.lastMessageTimestamp || 0);
      const cTs = new Date(c.lastMessageTimestamp || 0);
      if (cTs > eTs) {
        map.set(key, c);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessageTimestamp || 0) - new Date(a.lastMessageTimestamp || 0)
    );
  }, [conversations]);

  // ---------- fetch / refresh ----------
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
        if (nextSel?.threadId) dispatch(setCurrentThreadId(nextSel.threadId));
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

  // If popup set a current thread, reflect selection here
  useEffect(() => {
    if (!currentThreadIdGlobal) return;
    const found = dedupedConversations.find((c) => c.threadId === currentThreadIdGlobal);
    if (found && (!selectedChat || selectedChat.threadId !== found.threadId)) {
      userSelectedChatRef.current = true;
      setSelectedChat(found);
    }
  }, [currentThreadIdGlobal, dedupedConversations, selectedChat]);

  // ---------- socket bindings ----------
  const handleNewMessage = useCallback((message) => {
    const isCurrent = selectedChat && message.threadId === selectedChat.threadId;
    if (isCurrent) {
      // no-op; Redux updates handled in useSocket
    }
  }, [selectedChat]);

  const handleRequestUpdate = useCallback(async (data) => {
    if (data?.type === 'approved') {
      await fetchConversations();
      if (data.threadId) {
        dispatch(setCurrentThreadId(data.threadId));
      }
    }
  }, [fetchConversations, dispatch]);

  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(
    currentUserId,
    handleNewMessage,
    handleRequestUpdate
  );

  // Join all rooms that actually have a threadId (avoid joining request-only placeholders)
  useEffect(() => {
    if (!currentUserId || dedupedConversations.length === 0) return;
    dedupedConversations.forEach((convo) => {
      const tid = convo.threadId; // ✅ only join real threads
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

  // 🔽 Scroll the left list so the selected conversation is visible (without extra wrapper)
  useEffect(() => {
    const tid = selectedChat?.threadId;
    if (!tid) return;

    const container = document; // let the row’s own scroll container handle it
    const t = setTimeout(() => {
      let row = null;

      const selectors = [
        `[data-thread-id="${tid}"]`,
        `#thread-${tid}`,
        `[data-id="${tid}"]`,
        `[data-tid="${tid}"]`,
      ];
      for (const sel of selectors) {
        row = container.querySelector?.(sel);
        if (row) break;
      }

      if (!row) {
        const label = (displayNameOf(selectedChat) || '').toLowerCase();
        if (label && container.querySelectorAll) {
          const nodes = Array.from(container.querySelectorAll('*'));
          row = nodes.find(
            (el) =>
              el instanceof HTMLElement &&
              (el.getAttribute('role') === 'button' || el.className?.toString().includes('cursor-pointer')) &&
              (el.textContent || '').toLowerCase().includes(label)
          );
        }
      }

      if (row?.scrollIntoView) {
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 60);

    return () => clearTimeout(t);
  }, [selectedChat?.threadId, displayNameOf]);

  // Approve: after server updates, refresh and select the new thread for that request
  const handleApprove = async (requestId) => {
    try {
      await dispatch(approveRequestThunk(requestId)).unwrap();
      await fetchConversations();

      const found = dedupedConversations.find((c) => {
        const reqId =
          c?.requestId ||
          (Array.isArray(c?.sessions) ? c.sessions.find((s) => s?.requestId)?.requestId : null);
        return reqId && String(reqId) === String(requestId);
      });

      const target = found || dedupedConversations[0] || null;
      if (target) {
        setSelectedChat(target);
        if (target.threadId) dispatch(setCurrentThreadId(target.threadId));
      }
    } catch (error) {
      console.error('Approve request failed:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
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
    if (finalSelection?.threadId) {
      dispatch(setCurrentThreadId(finalSelection.threadId));
    }
  };

  if (loading) return <p className="p-4">Loading conversations...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    
    <div className="fixed inset-x-0 bottom-0 top-[4rem] flex overflow-hidden">
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
