'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';
import useSocket from '../../../hooks/useSocket';
import {
  addOrUpdateConversation,
  updateConversationStatus,setConversations
} from '../../../redux/chatSlice';
import { fetchConversationsThunk, refreshConversationThunk,approveRequestThunk } from '../../../redux/chatThunks';  // <-- added refreshConversationThunk import
import { playKnock } from '../../../utils/knock'; // Adjust path as needed
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

  // Deduplicate conversations by threadId to avoid duplicate keys and repeated UI entries
const dedupedConversations = useMemo(() => {
  const map = new Map();
  conversations.forEach((c) => {
    if (c.threadId && !map.has(c.threadId)) {
      map.set(c.threadId, c);
    }
  });

  const deduped = Array.from(map.values());

  // Sort again by lastMessageTimestamp just to be sure
  return deduped.sort((a, b) => {
    const timeA = new Date(a.lastMessageTimestamp || 0);
    const timeB = new Date(b.lastMessageTimestamp || 0);
    return timeB - timeA;
  });
}, [conversations]);


  // Debug: log deduped conversations
  useEffect(() => {
    console.log('Deduped conversations:', dedupedConversations);
  }, [dedupedConversations]);

  // Fetch conversations using thunk
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
          console.log('Auto-selected first conversation:', convos[0]);
        } else {
          // Try to find updated version of selectedChat and update it
          const updated = convos.find(c => c.threadId === selectedChat.threadId);
          if (updated) {
            setSelectedChat(updated);
            console.log('Updated selectedChat with fresh data:', updated);
          } else {
            setSelectedChat(convos[0]);
            console.log('Selected chat missing, switched to first conversation:', convos[0]);
          }
        }
      } else {
        setSelectedChat(null);
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
    console.log("cookieee")
    playKnock();
  }

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


  // UPDATED: handleRequestUpdate now fetches full updated conversation and sets selectedChat accordingly
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

  // Initialize socket with callbacks
  const { joinThread, sendMessage } = useSocket(teacherId, handleNewMessage, handleRequestUpdate);

  // Join thread on selected chat change
  useEffect(() => {
    if (selectedChat?.threadId) {
      joinThread(selectedChat.threadId);
      console.log('Joined thread:', selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

  // Fetch conversations on mount / token or teacherId change
  useEffect(() => {
    if (teacherId && token && !hasFetchedRef.current) {
      fetchConversations();
      hasFetchedRef.current = true;
    }
  }, [teacherId, token, fetchConversations]);

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

  // Approve request handler
const handleApprove = async (requestId) => {
  try {
    const updatedConvo = await dispatch(approveRequestThunk(requestId)).unwrap();
    console.log(updatedConvo, "Updated Conversations");

    const filtered = conversations.filter(
      (c) => c.requestId !== updatedConvo.requestId
    );

    const updatedList = [...filtered, updatedConvo].sort((a, b) =>
      new Date(b.lastMessage?.timestamp || b.createdAt) -
      new Date(a.lastMessage?.timestamp || a.createdAt)
    );

    dispatch(setConversations(updatedList));

    // <-- Add this line to auto-open the chat for the approved request
    setSelectedChat(updatedConvo);
  } catch (error) {
    console.log('conversations in handleApprove:', conversations);

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
const handleSelectChat = (selected) => {
  const full = conversations.find(
    (c) => c.threadId === selected.threadId
  );

  if (!full) {
    console.warn("Could not find full conversation for:", selected.threadId);
  }

  setSelectedChat(full || selected); // fallback to avoid crash
};
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList
        conversations={dedupedConversations}
        selectedChatId={selectedChat?.threadId} /* Make sure this key matches ConversationList */
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
