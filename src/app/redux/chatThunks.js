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
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

// 🔁 Fetch all conversations for current user (teacher or student)
export const fetchConversationsThunk = createAsyncThunk(
  'chat/fetchConversations',
  async ({ userId }, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      if (!userId) throw new Error('No userId found');

      thunkAPI.dispatch(setCurrentUserId(userId)); // <-- Set currentUserId here

      const endpoint = `${BACKEND_URL}/api/chat/conversations/${userId}`;
      const res = await axios.get(endpoint, {
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
      thunkAPI.dispatch(setError(err.message));
      return thunkAPI.rejectWithValue(err.message);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);


// 💬 Load messages for a given threadId
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

export const fetchMessagesThunk = createAsyncThunk(
  'chat/fetchMessages',
  async (threadId, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const res = await axios.get(`${BACKEND_URL}/api/chat/messages/${threadId}`, {
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
      thunkAPI.dispatch(setError(err.message));
      return thunkAPI.rejectWithValue(err.message);
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
      const res = await axios.post(`${BACKEND_URL}/api/chat/messages`, messageData, {
        withCredentials: true,
      });

      // Socket will handle adding message to Redux
      return res.data;
    } catch (err) {
      thunkAPI.dispatch(setError(err.message));
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// 🔁 Refresh single conversation after approval/update
export const refreshConversationThunk = createAsyncThunk(
  'chat/refreshConversation',
  async (requestId, thunkAPI) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/teacher-requests/request/${requestId}`, {
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
      thunkAPI.dispatch(setError(err.message));
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const approveRequestThunk = createAsyncThunk(
  'chat/approveRequest',
  async (requestId, thunkAPI) => {
    try {
      // Use PUT instead of POST to match backend updateRequestStatus route
      await axios.post(
        `${BACKEND_URL}/api/teacher-requests/${requestId}/approve`,
        {},
        { withCredentials: true }
      );

      // Fetch the full thread after approval
      const threadRes = await axios.get(`${BACKEND_URL}/api/chat/thread/${requestId}`, {
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
      thunkAPI.dispatch(setError(err.message));
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);
