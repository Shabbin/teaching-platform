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

  const conversations = useSelector((state) => state.chat.conversations);
  const conversationsLoaded = useSelector((state) => state.chat.conversationsLoaded);

  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const joinedThreadsRef = useRef(new Set());
  const lastKnockTimeRef = useRef(0);

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
      const convos = await dispatch(
        fetchConversationsThunk({ role: user.role, userId: currentUserId })
      ).unwrap();

      if (convos.length > 0) {
        if (!selectedChat) {
          setSelectedChat(convos[0]);
          dispatch(setCurrentThreadId(convos[0].threadId));
        } else {
          const updated = convos.find((c) => c.threadId === selectedChat.threadId);
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
  }, [dispatch, token, currentUserId, selectedChat, user?.role]);

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
      joinThread(selectedChat.threadId);
      joinedThreadsRef.current.add(selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

  // Join all thread rooms on socket
  useEffect(() => {
    if (!currentUserId || dedupedConversations.length === 0) return;

    dedupedConversations.forEach((convo) => {
      if (convo.threadId && !joinedThreadsRef.current.has(convo.threadId)) {
        joinThread(convo.threadId);
        joinedThreadsRef.current.add(convo.threadId);
      }
    });
  }, [currentUserId, dedupedConversations, joinThread]);

  // Update selected chat when conversations change
  useEffect(() => {
    if (dedupedConversations.length === 0 && selectedChat !== null) {
      setSelectedChat(null);
      return;
    }
    if (
      !selectedChat ||
      !dedupedConversations.find((c) => c.threadId === selectedChat.threadId)
    ) {
      setSelectedChat(dedupedConversations[0]);
    }
  }, [dedupedConversations, selectedChat]);

  // Reset unread count when selected chat changes
  useEffect(() => {
    if (!selectedChat) return;

    dispatch(resetUnreadCount({ threadId: selectedChat.threadId }));

    if (emitMarkThreadRead) {
      emitMarkThreadRead(selectedChat.threadId);
    }
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
    const full = conversations.find((c) => c.threadId === selected.threadId);
    const finalSelection = full || selected;

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
