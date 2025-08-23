import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setConversations,
  addOrUpdateConversation,
  setMessagesForThread,
  setConversationsLoaded,
  setLoading,
  setCurrentUserId,
  setError,
} from './chatSlice';
import API from '../api/axios'; // ✅ env-driven axios instance

// 🔁 Fetch all conversations for current user (teacher or student)
export const fetchConversationsThunk = createAsyncThunk(
  'chat/fetchConversations',
  async ({ userId }, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      if (!userId) throw new Error('No userId found');

      thunkAPI.dispatch(setCurrentUserId(userId)); // <-- Set currentUserId here

      const res = await API.get(`/chat/conversations/${userId}`, {
        withCredentials: true,
      });

      const data = res.data;

      const normalized = data
        .filter(Boolean)
        .map((chat) => {
          // We do NOT assign 'name' or 'profileImage' here since
          // addOrUpdateConversation will do that with currentUserId context
          return {
            ...chat,
            threadId: chat.threadId || chat._id || chat.requestId,
            unreadCount: chat.unreadCount || 0,
            lastMessage: chat.lastMessage || '',
            lastMessageTimestamp:
              chat.lastMessage?.timestamp ||
              chat.lastMessage?.createdAt ||
              chat.updatedAt ||
              chat.createdAt ||
              null,
            sessions: chat.sessions || [],
          };
        })
        .filter((chat) => chat.threadId);

      thunkAPI.dispatch(setConversations(normalized));
      thunkAPI.dispatch(setConversationsLoaded(true));
      return normalized;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch conversations';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

// 💬 Normalize a single message object
export function normalizeMessage(msg) {
  let senderObj = msg.sender || msg.senderId;

  const senderId =
    typeof senderObj === 'object' && senderObj !== null
      ? senderObj._id
      : senderObj;

  return {
    ...msg,
    senderId: senderId,
    sender:
      typeof senderObj === 'object'
        ? senderObj
        : {
            _id: senderId,
            name: 'Unknown',
            profileImage: `https://i.pravatar.cc/150?u=${senderId}`,
            role: null,
          },
  };
}

// 💬 Load messages for a given threadId
export const fetchMessagesThunk = createAsyncThunk(
  'chat/fetchMessages',
  async (threadId, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));

      const res = await API.get(`/chat/messages/${threadId}`, {
        withCredentials: true,
      });

      let fetchedMessages = res.data;

      fetchedMessages = fetchedMessages.map(normalizeMessage);

      const state = thunkAPI.getState();
      const existingMessages = state.chat.messagesByThread[threadId] || [];

      const uniqueMessages = fetchedMessages.filter((msg) => {
        const id = msg._id || `${msg.text}-${msg.timestamp}`;
        return !existingMessages.some((existing) => {
          const existingId = existing._id || `${existing.text}-${existing.timestamp}`;
          return existingId === id;
        });
      });

      if (uniqueMessages.length > 0) {
        const updatedMessages = [...existingMessages, ...uniqueMessages];
        thunkAPI.dispatch(setMessagesForThread({ threadId, messages: updatedMessages }));
      }

      return fetchedMessages;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch messages';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

// 📨 Send a message
export const sendMessageThunk = createAsyncThunk(
  'chat/sendMessage',
  async ({ threadId, messageData }, thunkAPI) => {
    try {
      const res = await API.post('/chat/messages', messageData, {
        withCredentials: true,
      });

      // Socket will handle adding message to Redux
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send message';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// 🔁 Refresh single conversation after approval/update
export const refreshConversationThunk = createAsyncThunk(
  'chat/refreshConversation',
  async (requestId, thunkAPI) => {
    try {
      const res = await API.get(`/teacher-requests/request/${requestId}`, {
        withCredentials: true,
      });
      const data = res.data;

      const state = thunkAPI.getState();
      const userId = state.user.userInfo.id || state.user.userInfo._id;

      const otherParticipant = data.participants.find((p) => p._id !== userId);
      const latestSession = data.sessions?.[data.sessions.length - 1];
      const status = latestSession?.status || 'approved';

      const normalizedConvo = {
        threadId: data._id,
        requestId: data.requestId || requestId,
        messages: data.messages || [],
        lastMessage: data.messages?.at(-1)?.text || '',
        unreadCount: 0,
        status,
        teacherId: otherParticipant?._id,
        teacherName: otherParticipant?.name,
      };

      thunkAPI.dispatch(addOrUpdateConversation(normalizedConvo));
      return normalizedConvo;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to refresh conversation';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// ✅ Approve request (kept as POST to match your existing usage)
export const approveRequestThunk = createAsyncThunk(
  'chat/approveRequest',
  async (requestId, thunkAPI) => {
    try {
      await API.post(`/teacher-requests/${requestId}/approve`, {}, { withCredentials: true });

      // Fetch the full thread after approval
      const threadRes = await API.get(`/chat/thread/${requestId}`, {
        withCredentials: true,
      });

      const threadData = threadRes.data;
      const state = thunkAPI.getState();
      const userId = state.user.userInfo.id || state.user.userInfo._id;

      const otherParticipant = threadData.participants.find((p) => p._id !== userId);
      const latestSession = threadData.sessions?.[threadData.sessions.length - 1];
      const status = latestSession?.status || 'approved';

      const lastMsg =
        threadData.lastMessage?.text ||
        (threadData.messages.length > 0
          ? threadData.messages[threadData.messages.length - 1].text
          : '');

      const normalizedConvo = {
        threadId: threadData._id,
        requestId: threadData.requestId || requestId,
        messages: threadData.messages || [],
        lastMessage: lastMsg,
        unreadCount: 0,
        status,
        teacherId: otherParticipant?._id,
        teacherName: otherParticipant?.name || 'Unknown',
        teacherImage: otherParticipant?.profileImage || '',
      };

      thunkAPI.dispatch(addOrUpdateConversation(normalizedConvo));
      return normalizedConvo;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to approve request';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    }
  }
);
