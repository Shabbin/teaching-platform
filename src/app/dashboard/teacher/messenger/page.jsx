'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';
import useSocket from '../../../hooks/useSocket';
import {
  addMessageToThread,
  updateConversationStatus,
  updateLastMessageInConversation,
  setConversations,
  setCurrentThreadId,
  resetUnreadCount,
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
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasFetchedRef = useRef(false);

  // Track joined threads to avoid re-joining
  const joinedThreadsRef = useRef(new Set());

  // Deduplicate conversations by threadId
  const dedupedConversations = useMemo(() => {
    const map = new Map();
    conversations.forEach((c) => {
      if (c.threadId && !map.has(c.threadId)) {
        map.set(c.threadId, c);
      }
    });
    const deduped = Array.from(map.values());
    return deduped.sort((a, b) => {
      const timeA = new Date(a.lastMessageTimestamp || 0);
      const timeB = new Date(b.lastMessageTimestamp || 0);
      return timeB - timeA;
    });
  }, [conversations]);

  // Debug logs
  useEffect(() => {
    console.log('Deduped conversations:', dedupedConversations);
  }, [dedupedConversations]);

  const fetchConversations = useCallback(async () => {
    if (!teacherId || !token) return;
    setLoading(true);
    setError(null);

    try {
      const convos = await dispatch(fetchConversationsThunk({ role: user.role, userId: teacherId })).unwrap();
      console.log('Fetched conversations:', convos);

      if (convos.length > 0) {
        if (!selectedChat) {
          setSelectedChat(convos[0]);
          dispatch(setCurrentThreadId(convos[0].threadId)); // <-- sync on initial load
          console.log('Auto-selected first conversation:', convos[0]);
        } else {
          const updated = convos.find(c => c.threadId === selectedChat.threadId);
          if (updated) {
            setSelectedChat(updated);
            dispatch(setCurrentThreadId(updated.threadId)); // <-- sync updated match
            console.log('Updated selectedChat with fresh data:', updated);
          } else {
            setSelectedChat(convos[0]);
            dispatch(setCurrentThreadId(convos[0].threadId)); // <-- sync fallback
            console.log('Selected chat missing, switched to first conversation:', convos[0]);
          }
        }
      } else {
        setSelectedChat(null);
        dispatch(setCurrentThreadId(null)); // <-- clear state when no chats
        console.log('No conversations found, cleared selection');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, teacherId, selectedChat, user?.role]);

  // Socket callbacks
  const handleNewMessage = (message) => {
    const myUserId = String(user._id || user.id);
    const isMyMessage = String(message.senderId) === myUserId;
    const isCurrentThread = selectedChat && message.threadId === selectedChat.threadId;

    if (!isMyMessage && !isCurrentThread) {
      playKnock();
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

  // Get emitMarkThreadRead from useSocket
  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(teacherId, handleNewMessage, handleRequestUpdate);

  // Join selected chat thread on change (keep this)
  useEffect(() => {
    if (selectedChat?.threadId) {
      if (!joinedThreadsRef.current.has(selectedChat.threadId)) {
        joinThread(selectedChat.threadId);
        joinedThreadsRef.current.add(selectedChat.threadId);
        console.log('Joined selected thread:', selectedChat.threadId);
      }
    }
  }, [selectedChat, joinThread]);

  // NEW: Join all conversation threads to get real-time updates everywhere
  useEffect(() => {
    if (!teacherId || dedupedConversations.length === 0) return;

    dedupedConversations.forEach((convo) => {
      if (convo.threadId && !joinedThreadsRef.current.has(convo.threadId)) {
        joinThread(convo.threadId);
        joinedThreadsRef.current.add(convo.threadId);
        console.log('Joined thread from conversation list:', convo.threadId);
      }
    });
  }, [teacherId, dedupedConversations, joinThread]);

  // Fetch conversations on mount or when user changes
  useEffect(() => {
    if (teacherId && token && !hasFetchedRef.current) {
      fetchConversations();
      hasFetchedRef.current = true;
    }
  }, [teacherId, token, fetchConversations]);

  // Validate selectedChat exists in conversations
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

  // Approve request handler
  const handleApprove = async (requestId) => {
    try {
      const updatedConvo = await dispatch(approveRequestThunk(requestId)).unwrap();
      console.log(updatedConvo, 'Updated Conversations');

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

  // Reject request handler
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

  // On selecting a chat:
  const handleSelectChat = (selected) => {
    const full = conversations.find((c) => c.threadId === selected.threadId);
    const finalSelection = full || selected;

    if (!full) {
      console.warn('Could not find full conversation for:', selected.threadId);
    }

    setSelectedChat(finalSelection);
    dispatch(setCurrentThreadId(finalSelection.threadId));
   dispatch(resetUnreadCount({ threadId: finalSelection.threadId })); // reset unread count locally

    // Notify server and other clients that this thread is read by this user
    if (emitMarkThreadRead) {
      emitMarkThreadRead(finalSelection.threadId);
    }
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
