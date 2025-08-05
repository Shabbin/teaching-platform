'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';
import useSocket from '../../../hooks/useSocket';

import {
  resetUnreadCount,
  setCurrentThreadId,
  addOrUpdateConversation,
  updateLastMessageInConversation,
  addMessageToThread,
} from '../../../redux/chatSlice';

import {
  fetchConversationsThunk,
  approveRequestThunk,
} from '../../../redux/chatThunks';

import { playKnock } from '../../../utils/knock';

// Helper fallback avatar function (optional)
function getFallbackAvatar(userId) {
  return `https://i.pravatar.cc/150?u=${userId}`;
}

export default function MessengerPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const currentUserId = (user?.id || user?._id)?.toString();
  const onlineUserIds = useSelector((state) => state.chat.onlineUserIds || []);
  const conversations = useSelector((state) => state.chat.conversations);
  const conversationsLoaded = useSelector((state) => state.chat.conversationsLoaded);

  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const joinedThreadsRef = useRef(new Set());
  const lastKnockTimeRef = useRef(0);

  // Track if user manually selected a chat recently
  const userSelectedChatRef = useRef(false);

  // Track last threadId for which unread was reset
  const lastResetThreadIdRef = useRef(null);

  // Deduplicate conversations and prepare display info: show *other participant* info
  const dedupedConversations = useMemo(() => {
    const map = new Map();
    conversations.forEach((c) => {
      if (c.threadId && !map.has(c.threadId)) {
        map.set(c.threadId, c);
      }
    });

    const deduped = Array.from(map.values());

    // Add isUnread flag and correct display name/image to show opposite participant
    const withUnreadAndDisplay = deduped.map((conv) => {
      // Find current user session lastSeen time
      const mySession = conv.sessions?.find(
        (s) => s.userId?.toString() === currentUserId
      );
      const lastSeen = mySession?.lastSeen ? new Date(mySession.lastSeen) : null;
      const lastMsgTime = new Date(conv.lastMessageTimestamp || 0);
      const isUnread = lastSeen ? lastSeen < lastMsgTime : true;

      // Determine opposite participant to display
      const studentId = conv.studentId?.toString();
      const teacherId = conv.teacherId?.toString();

      let displayName = conv.name;
      let displayImage = conv.profileImage;

      if (currentUserId === teacherId) {
        // Current user is teacher, show student info
        displayName = conv.studentName || 'Student';
        // Try to find participant profileImage
        const studentParticipant = conv.participants?.find(
          (p) => p._id.toString() === studentId
        );
        displayImage =
          conv.studentProfileImage ||
          studentParticipant?.profileImage ||
          getFallbackAvatar(studentId);
      } else if (currentUserId === studentId) {
        // Current user is student, show teacher info
        displayName = conv.teacherName || 'Teacher';
        const teacherParticipant = conv.participants?.find(
          (p) => p._id.toString() === teacherId
        );
        displayImage =
          conv.teacherProfileImage ||
          teacherParticipant?.profileImage ||
          getFallbackAvatar(teacherId);
      }

      return {
        ...conv,
        isUnread,
        name: displayName,
        profileImage: displayImage,
      };
    });

    // Sort by last message timestamp descending
    withUnreadAndDisplay.sort((a, b) => {
      const timeA = new Date(a.lastMessageTimestamp || 0);
      const timeB = new Date(b.lastMessageTimestamp || 0);
      return timeB - timeA;
    });

    return withUnreadAndDisplay;
  }, [conversations, currentUserId]);

  // Fetch conversations from server
  const fetchConversations = useCallback(async () => {
    if (!currentUserId || !token) return;
    setLoading(true);
    setError(null);

    try {
      console.log('[fetchConversations] Fetching conversations...');
      const convos = await dispatch(
        fetchConversationsThunk({ role: user.role, userId: currentUserId })
      ).unwrap();

      console.log('[fetchConversations] Conversations fetched:', convos.length);

      if (convos.length > 0) {
        if (!selectedChat) {
          console.log('[fetchConversations] No selected chat, selecting first');
          setSelectedChat(convos[0]);
          dispatch(setCurrentThreadId(convos[0].threadId));
        } else {
          const updated = convos.find((c) => c.threadId === selectedChat.threadId);
          if (updated) {
            console.log('[fetchConversations] Keeping selected chat:', selectedChat.threadId);
            setSelectedChat(updated);
            dispatch(setCurrentThreadId(updated.threadId));
          } else {
            console.log('[fetchConversations] Selected chat not found, selecting first');
            setSelectedChat(convos[0]);
            dispatch(setCurrentThreadId(convos[0].threadId));
          }
        }
      } else {
        console.log('[fetchConversations] No conversations found');
        setSelectedChat(null);
        dispatch(setCurrentThreadId(null));
      }

      // Reset user selection flag after fetch sets selection
      userSelectedChatRef.current = false;

    } catch (err) {
      console.error('[fetchConversations] Failed to fetch conversations:', err);
      setError(err.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, currentUserId, user?.role, selectedChat]);

  useEffect(() => {
    if (!conversationsLoaded && currentUserId && token) {
      fetchConversations();
    }
  }, [conversationsLoaded, currentUserId, token, fetchConversations]);

  function playKnockDebounced() {
    const now = Date.now();
    if (now - lastKnockTimeRef.current > 3000) {
      playKnock();
      lastKnockTimeRef.current = now;
    }
  }

  // Handle new incoming message
  const handleNewMessage = (message) => {
    const myUserId = currentUserId;
    const isMyMessage = String(message.senderId) === myUserId;
    const isCurrentThread = selectedChat && message.threadId === selectedChat.threadId;

    // Try to find sender info from message or participants
    let sender = null;
    if (message.sender) {
      sender = message.sender;
    } else if (message.participants && Array.isArray(message.participants)) {
      sender = message.participants.find(
        (p) => String(p._id) === String(message.senderId)
      );
    }

    if (!sender) {
      sender = {
        _id: message.senderId,
        name: message.senderName || 'Unknown',
        profileImage: null,
        role: null,
      };
    }

    sender.name = sender.name || 'Unknown';
    sender.profileImage = sender.profileImage || getFallbackAvatar(sender._id);
    sender.role = sender.role || null;

    if (!isMyMessage && !isCurrentThread) {
      playKnockDebounced();
      dispatch(
        addOrUpdateConversation({
          threadId: message.threadId,
          lastMessage: message.text,
          incrementUnread: true,
          messages: [message],
          sender,
        })
      );
    } else {
      dispatch(
        addOrUpdateConversation({
          threadId: message.threadId,
          lastMessage: message.text,
          incrementUnread: false,
          messages: [message],
          sender,
        })
      );
    }

    if (selectedChat && message.threadId === selectedChat.threadId) {
      setSelectedChat((prev) => ({
        ...prev,
        lastMessage: message.text,
        messages: [...(prev.messages || []), message],
      }));
    }

    dispatch(
      updateLastMessageInConversation({
        threadId: message.threadId,
        message: { text: message.text, timestamp: message.timestamp },
      })
    );

    dispatch(addMessageToThread({ threadId: message.threadId, message }));
  };

  // Handle request status update (approve/reject)
  const handleRequestUpdate = async (requestId, status) => {
    try {
      let updatedThread;

      if (status === 'approved') {
        updatedThread = await dispatch(approveRequestThunk(requestId)).unwrap();
      } else if (status === 'rejected') {
        updatedThread = await dispatch(rejectRequestThunk(requestId)).unwrap();
      }

      if (updatedThread) {
        dispatch(addOrUpdateConversation(updatedThread));
      }
    } catch (err) {
      console.error('Failed to update request status:', err);
    }
  };

  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(
    currentUserId,
    handleNewMessage,
    handleRequestUpdate
  );

  // Join selected thread room on socket
  useEffect(() => {
    if (
      selectedChat?.threadId &&
      !joinedThreadsRef.current.has(selectedChat.threadId)
    ) {
      console.log('[Socket] Joining selected thread:', selectedChat.threadId);
      joinThread(selectedChat.threadId);
      joinedThreadsRef.current.add(selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

  // Join all thread rooms on socket
  useEffect(() => {
    if (!currentUserId || dedupedConversations.length === 0) return;

    dedupedConversations.forEach((convo) => {
      if (convo.threadId && !joinedThreadsRef.current.has(convo.threadId)) {
        console.log('[Socket] Joining thread from deduped list:', convo.threadId);
        joinThread(convo.threadId);
        joinedThreadsRef.current.add(convo.threadId);
      }
    });
  }, [currentUserId, dedupedConversations, joinThread]);

  // Update selected chat when conversations change
  useEffect(() => {
    console.log('[selectedChat effect] Running with selectedChat:', selectedChat?.threadId);
    console.log('[selectedChat effect] Conversations count:', dedupedConversations.length);

    if (dedupedConversations.length === 0 && selectedChat !== null) {
      console.log('[selectedChat effect] No conversations, clearing selectedChat');
      setSelectedChat(null);
      return;
    }

    if (!selectedChat) {
      // Only update if first conversation is different from current selectedChat
      if (
        dedupedConversations.length > 0 &&
        dedupedConversations[0].threadId !== selectedChat?.threadId
      ) {
        console.log('[selectedChat effect] No selectedChat, setting to first conversation');
        setSelectedChat(dedupedConversations[0]);
      }
      return;
    }

    // Skip update if user manually selected a chat recently
    if (userSelectedChatRef.current) {
      console.log('[selectedChat effect] Skipping update due to recent user selection');
      return;
    }

    // Check if current selectedChat still exists in conversations
    const stillExists = dedupedConversations.some(
      (c) => c.threadId === selectedChat.threadId
    );

    if (!stillExists) {
      console.log(
        `[selectedChat effect] Selected chat ${selectedChat.threadId} no longer exists, switching to first conversation`
      );
      setSelectedChat(dedupedConversations[0]);
    } else {
      console.log('[selectedChat effect] Selected chat still exists, no change');
    }
  }, [dedupedConversations, selectedChat]);

  // Reset unread count when selected chat changes
  useEffect(() => {
    if (!selectedChat) return;

    if (lastResetThreadIdRef.current === selectedChat.threadId) return;

    console.log('[UnreadReset] Resetting unread count for:', selectedChat.threadId);
    dispatch(resetUnreadCount({ threadId: selectedChat.threadId }));

    if (emitMarkThreadRead) {
      console.log('[UnreadReset] Emitting mark thread read for:', selectedChat.threadId);
      emitMarkThreadRead(selectedChat.threadId);
    }

    lastResetThreadIdRef.current = selectedChat.threadId;
  }, [selectedChat, dispatch, emitMarkThreadRead]);

  // Approve request handler
  const handleApprove = async (requestId) => {
    try {
      await dispatch(approveRequestThunk(requestId)).unwrap();
      await fetchConversations(); // Refresh after approval
    } catch (error) {
      console.error('Approve request failed:', error);
    }
  };

  // Reject request handler
  const handleReject = async (requestId) => {
    try {
      await fetch(
        `http://localhost:5000/api/teacher-requests/${requestId}/reject`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchConversations(); // Refresh after rejection
    } catch (err) {
      console.error('Reject request failed:', err);
    }
  };

  // When user selects a conversation
  const handleSelectChat = (selected) => {
    console.log('[User Action] Selecting chat:', selected.threadId);
    const full = conversations.find((c) => c.threadId === selected.threadId);
    const finalSelection = full || selected;

    // Mark user selection so effect does not override
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
