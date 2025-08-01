'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';
import useSocket from '../../../hooks/useSocket';
import {
  resetUnreadCount,
  setCurrentThreadId,
  setConversations,
  addOrUpdateConversation,
  updateLastMessageInConversation,
  addMessageToThread,
  updateConversationStatus,
 
} from '../../../redux/chatSlice';
import {
  fetchConversationsThunk,
  refreshConversationThunk,
  approveRequestThunk,
} from '../../../redux/chatThunks';
import { playKnock } from '../../../utils/knock';

export default function MessengerPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const teacherId = user?.id || user?._id;

  const conversations = useSelector((state) => state.chat.conversations);
  const conversationsLoaded = useSelector((state) => state.chat.conversationsLoaded);

  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const joinedThreadsRef = useRef(new Set());
  const lastKnockTimeRef = useRef(0);

  // Deduplicate and add unread flag
  const dedupedConversations = useMemo(() => {
    const map = new Map();
    conversations.forEach((c) => {
      if (c.threadId && !map.has(c.threadId)) {
        map.set(c.threadId, c);
      }
    });

    const deduped = Array.from(map.values());

    const withUnread = deduped.map((conv) => {
      const mySession = conv.sessions?.find(
        (s) => s.userId?.toString() === teacherId?.toString()
      );
      const lastSeen = mySession?.lastSeen ? new Date(mySession.lastSeen) : null;
      const lastMsgTime = new Date(conv.lastMessageTimestamp || 0);
      const isUnread = lastSeen ? lastSeen < lastMsgTime : true;

      return {
        ...conv,
        isUnread,
      };
    });

    withUnread.sort((a, b) => {
      const timeA = new Date(a.lastMessageTimestamp || 0);
      const timeB = new Date(b.lastMessageTimestamp || 0);
      return timeB - timeA;
    });

    return withUnread;
  }, [conversations, teacherId]);

  const fetchConversations = useCallback(async () => {
    if (!teacherId || !token) return;
    setLoading(true);
    setError(null);

    try {
      const convos = await dispatch(fetchConversationsThunk({ role: user.role, userId: teacherId })).unwrap();

      if (convos.length > 0) {
        if (!selectedChat) {
          setSelectedChat(convos[0]);
          dispatch(setCurrentThreadId(convos[0].threadId));
        } else {
          const updated = convos.find(c => c.threadId === selectedChat.threadId);
          if (updated) {
            setSelectedChat(updated);
            dispatch(setCurrentThreadId(updated.threadId));
          } else {
            setSelectedChat(convos[0]);
            dispatch(setCurrentThreadId(convos[0].threadId));
          }
        }
      } else {
        setSelectedChat(null);
        dispatch(setCurrentThreadId(null));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, teacherId, selectedChat, user?.role]);

  // New useEffect: fetch conversations ONLY if not loaded yet
  useEffect(() => {
    if (!conversationsLoaded && teacherId && token) {
      fetchConversations();
    }
  }, [conversationsLoaded, teacherId, token, fetchConversations]);

  // Debounced knock sound
  function playKnockDebounced() {
    const now = Date.now();
    if (now - lastKnockTimeRef.current > 3000) { // 3 seconds debounce
      playKnock();
      lastKnockTimeRef.current = now;
    }
  }

  const handleNewMessage = (message) => {
    const myUserId = String(user._id || user.id);
    const isMyMessage = String(message.senderId) === myUserId;
    const isCurrentThread = selectedChat && message.threadId === selectedChat.threadId;

    if (!isMyMessage && !isCurrentThread) {
      playKnockDebounced();

      dispatch(addOrUpdateConversation({
        threadId: message.threadId,
        lastMessage: message.text,
        incrementUnread: true,
        messages: [message],
      }));
    } else {
      dispatch(addOrUpdateConversation({
        threadId: message.threadId,
        lastMessage: message.text,
        incrementUnread: false,
        messages: [message],
      }));
    }

    if (selectedChat && message.threadId === selectedChat.threadId) {
      setSelectedChat((prev) => ({
        ...prev,
        lastMessage: message.text,
        messages: [...(prev.messages || []), message],
      }));
    }

    dispatch(updateLastMessageInConversation({
      threadId: message.threadId,
      message: { text: message.text, timestamp: message.timestamp }
    }));

    dispatch(addMessageToThread({ threadId: message.threadId, message }));
  };

  const handleRequestUpdate = async (updatedRequest) => {
    dispatch(updateConversationStatus({ requestId: updatedRequest._id, status: updatedRequest.status }));

    try {
      const fullUpdatedConvo = await dispatch(refreshConversationThunk(updatedRequest._id)).unwrap();
      if (selectedChat && selectedChat.requestId === updatedRequest._id) {
        setSelectedChat(fullUpdatedConvo);
      }
    } catch (err) {
      console.error('Failed to refresh conversation after status update', err);
    }
  };

  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(teacherId, handleNewMessage, handleRequestUpdate);

  useEffect(() => {
    if (selectedChat?.threadId) {
      if (!joinedThreadsRef.current.has(selectedChat.threadId)) {
        joinThread(selectedChat.threadId);
        joinedThreadsRef.current.add(selectedChat.threadId);
      }
    }
  }, [selectedChat, joinThread]);

  useEffect(() => {
    if (!teacherId || dedupedConversations.length === 0) return;

    dedupedConversations.forEach((convo) => {
      if (convo.threadId && !joinedThreadsRef.current.has(convo.threadId)) {
        joinThread(convo.threadId);
        joinedThreadsRef.current.add(convo.threadId);
      }
    });
  }, [teacherId, dedupedConversations, joinThread]);

  useEffect(() => {
    if (dedupedConversations.length === 0) {
      if (selectedChat !== null) {
        setSelectedChat(null);
      }
      return;
    }
    if (!selectedChat || !dedupedConversations.find(c => c.threadId === selectedChat.threadId)) {
      setSelectedChat(dedupedConversations[0]);
    }
  }, [dedupedConversations, selectedChat]);

  // Mark thread read on selectedChat change
  useEffect(() => {
    if (!selectedChat) return;

    dispatch(resetUnreadCount({ threadId: selectedChat.threadId }));

    if (emitMarkThreadRead) {
      emitMarkThreadRead(selectedChat.threadId);
    }
  }, [selectedChat, dispatch, emitMarkThreadRead]);

  const handleApprove = async (requestId) => {
    try {
      const updatedConvo = await dispatch(approveRequestThunk(requestId)).unwrap();

      const filtered = conversations.filter(
        (c) => c.requestId !== updatedConvo.requestId
      );

      const updatedList = [...filtered, updatedConvo].sort((a, b) =>
        new Date(b.lastMessage?.timestamp || b.createdAt) - new Date(a.lastMessage?.timestamp || a.createdAt)
      );

      dispatch(setConversations(updatedList));

      setSelectedChat(updatedConvo);
    } catch (error) {
      console.error('Approve request failed:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await fetch(`http://localhost:5000/api/teacher-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchConversations();
    } catch (err) {
      console.error('Reject request failed:', err);
    }
  };

  if (loading) return <p className="p-4">Loading conversations...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  const handleSelectChat = (selected) => {
    const full = conversations.find((c) => c.threadId === selected.threadId);
    const finalSelection = full || selected;

    setSelectedChat(finalSelection);
    dispatch(setCurrentThreadId(finalSelection.threadId));
    // resetUnreadCount and emitMarkThreadRead are now handled in useEffect above
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList
        conversations={dedupedConversations}
        selectedChatId={selectedChat?.threadId}
        onSelect={handleSelectChat}
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
