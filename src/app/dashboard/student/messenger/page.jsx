'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSocket from '../../../hooks/useSocket';
import {
  addOrUpdateConversation,
  setCurrentThreadId,
  resetUnreadCount,
  updateLastMessageInConversation,
  addMessageToThread,
} from '../../../redux/chatSlice';
import { fetchConversationsThunk } from '../../../redux/chatThunks';
import ConversationList from '../../components/chat-components/conversationList';
import ChatPanel from '../../components/chat-components/chatPanel';
import { playKnock } from '../../../utils/knock';

function getFallbackAvatar(userId) {
  return `https://i.pravatar.cc/150?u=${userId}`;
}

export default function StudentMessengerPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);

  const currentUserId = (user?.id || user?._id)?.toString();
  const onlineUserIds = useSelector((state) => state.chat.onlineUserIds || []);
  const conversations = useSelector((state) => state.chat.conversations);
  const conversationsLoaded = useSelector((state) => state.chat.conversationsLoaded);

  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const joinedThreadsRef = useRef(new Set());
  const lastKnockTimeRef = useRef(0);
  const userSelectedChatRef = useRef(false);

  // Deduplicate and prepare conversations: show teacher info for student
  const dedupedConversations = useMemo(() => {
    const map = new Map();
    conversations.forEach((c) => {
      if (c.threadId && !map.has(c.threadId)) {
        map.set(c.threadId, c);
      }
    });
    const deduped = Array.from(map.values());

    return deduped
      .map((conv) => {
        const mySession = conv.sessions?.find(
          (s) => s.userId?.toString() === currentUserId
        );
        const lastSeen = mySession?.lastSeen ? new Date(mySession.lastSeen) : null;
        const lastMsgTime = new Date(conv.lastMessageTimestamp || 0);
        const isUnread = lastSeen ? lastSeen < lastMsgTime : true;

        const studentId = conv.studentId?.toString();
        const teacherId = conv.teacherId?.toString();

        let displayName = conv.name;
        let displayImage = conv.profileImage;

        if (currentUserId === studentId) {
          // Show teacher info for student
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
      })
      .sort((a, b) => {
        return new Date(b.lastMessageTimestamp || 0) - new Date(a.lastMessageTimestamp || 0);
      });
  }, [conversations, currentUserId]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);

    try {
      const convos = await dispatch(fetchConversationsThunk({ role: 'student', userId: currentUserId })).unwrap();

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

      userSelectedChatRef.current = false;
    } catch (err) {
      setError(err.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [dispatch, currentUserId, selectedChat]);

useEffect(() => {
  if (!conversationsLoaded && currentUserId) {
    dispatch(fetchConversationsThunk({ userId: currentUserId }));
  }
}, [conversationsLoaded, currentUserId, dispatch]);

  // Debounced knock sound
  function playKnockDebounced() {
    const now = Date.now();
    if (now - lastKnockTimeRef.current > 3000) {
      playKnock();
      lastKnockTimeRef.current = now;
    }
  }

  // Handle incoming messages
  const handleNewMessage = (message) => {
    const isMyMessage = String(message.senderId) === currentUserId;
    const isCurrentThread = selectedChat && message.threadId === selectedChat.threadId;

    let sender = null;
    if (message.sender) {
      sender = message.sender;
    } else if (message.participants && Array.isArray(message.participants)) {
      sender = message.participants.find((p) => String(p._id) === String(message.senderId));
    }

    sender = {
      _id: message.senderId,
      name: sender?.name || message.senderName || 'Unknown',
      profileImage: sender?.profileImage || getFallbackAvatar(message.senderId),
      role: sender?.role || null,
    };

    if (!isMyMessage && !isCurrentThread) {
      playKnockDebounced();
    }

    dispatch(
      addOrUpdateConversation({
        threadId: message.threadId,
        lastMessage: message.text,
        incrementUnread: !isCurrentThread,
        messages: [message],
        sender,
      })
    );

    if (isCurrentThread) {
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

  // Handle request approval notifications
  const handleRequestUpdate = useCallback(
    async (data) => {
      if (data.type === 'approved') {
        try {
          const updatedConvos = await dispatch(fetchConversationsThunk({ role: 'student', userId: currentUserId })).unwrap();

          const approvedConvo = updatedConvos.find(
            (convo) => convo.threadId === data.threadId || convo.requestId === data.requestId
          );

          if (approvedConvo) {
            dispatch(addOrUpdateConversation(approvedConvo));
            setSelectedChat((prevSelected) => {
              if (prevSelected?.threadId === approvedConvo.threadId) {
                return { ...approvedConvo };
              }
              return prevSelected;
            });
            dispatch(setCurrentThreadId(approvedConvo.threadId));
            userSelectedChatRef.current = true;
          } else {
            console.warn('Approved conversation not found after refresh');
          }
        } catch (err) {
          console.error('Error refetching conversations after approval:', err);
        }
      }
    },
    [dispatch, currentUserId]
  );

  // Sync selectedChat with conversations updates
  useEffect(() => {
    if (!selectedChat) return;

    const updatedConvo = conversations.find(c => c.threadId === selectedChat.threadId);
    if (!updatedConvo) return;

    const hasChanged =
      updatedConvo.unreadCount !== selectedChat.unreadCount ||
      updatedConvo.lastMessageTimestamp !== selectedChat.lastMessageTimestamp ||
      updatedConvo.lastMessage !== selectedChat.lastMessage;

    if (hasChanged) {
      setSelectedChat(updatedConvo);
    }
  }, [conversations, selectedChat]);

  // Setup socket hooks
  const { joinThread, sendMessage, emitMarkThreadRead } = useSocket(
    currentUserId,
    handleNewMessage,
    handleRequestUpdate
  );

  // Join selected thread room
  useEffect(() => {
    if (selectedChat?.threadId && !joinedThreadsRef.current.has(selectedChat.threadId)) {
      joinThread(selectedChat.threadId);
      joinedThreadsRef.current.add(selectedChat.threadId);
    }
  }, [selectedChat, joinThread]);

  // Join all conversation threads
  useEffect(() => {
    if (!currentUserId || dedupedConversations.length === 0) return;

    dedupedConversations.forEach((convo) => {
      if (convo.threadId && !joinedThreadsRef.current.has(convo.threadId)) {
        joinThread(convo.threadId);
        joinedThreadsRef.current.add(convo.threadId);
      }
    });
  }, [currentUserId, dedupedConversations, joinThread]);

  // Manage selectedChat updates when conversations change
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

  // Reset unread count on selected chat change
  useEffect(() => {
    if (!selectedChat) return;

    dispatch(resetUnreadCount({ threadId: selectedChat.threadId }));

    if (emitMarkThreadRead) {
      emitMarkThreadRead(selectedChat.threadId);
    }
  }, [selectedChat, dispatch, emitMarkThreadRead]);

  // Handle user selecting a chat
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
      />
      <ChatPanel chat={selectedChat} user={user} sendMessage={sendMessage} />
    </div>
  );
}
