import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setConversations,
  addOrUpdateConversation,
  setMessagesForThread,
  addMessageToThread,
  setLoading,
  setError,
} from './chatSlice';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000'; // <-- Set your backend base URL here

// 🔁 Fetch all conversations for current user (teacher or student)

export const fetchConversationsThunk = createAsyncThunk(
  'chat/fetchConversations',
  async ({ userId }, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token found');

      const endpoint = `${BACKEND_URL}/api/chat/conversations/${userId}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = res.data;

      // 🛠 Normalize every item to ensure `threadId` is present and consistent
      const normalized = data
        .filter(chat => chat) // Remove nulls just in case
        .map(chat => ({
          ...chat,
          threadId: chat.threadId || chat._id || chat.requestId, // Fallbacks
          lastMessage: chat.lastMessage || '',
          lastMessageTimestamp:
            chat.lastMessage?.timestamp ||
            chat.lastMessage?.createdAt ||
            chat.updatedAt ||
            chat.createdAt ||
            null,
        }))
        .filter(chat => chat.threadId); // Make sure no conversation without a threadId

      // 🔁 Sort by timestamp (desc)
      normalized.sort((a, b) => {
        const timeA = new Date(a.lastMessageTimestamp || 0);
        const timeB = new Date(b.lastMessageTimestamp || 0);
        return timeB - timeA;
      });

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
// chatThunks.js

export const fetchMessagesThunk = createAsyncThunk(
  'chat/fetchMessages',
  async (threadId, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      const res = await axios.get(`${BACKEND_URL}/api/chat/messages/${threadId}`);
      
      const fetchedMessages = res.data;
      const state = thunkAPI.getState();
      const existingMessages = state.chat.messagesByThread[threadId] || [];

      const uniqueMessages = fetchedMessages.filter(msg => {
        const id = msg._id || `${msg.text}-${msg.timestamp}`;
        return !existingMessages.some(existing => {
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


// 📨 Send a message (POST to backend and update Redux)
export const sendMessageThunk = createAsyncThunk(
  'chat/sendMessage',
  async ({ threadId, messageData }, thunkAPI) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/chat/messages`, messageData);
      // DO NOT dispatch addMessageToThread here, socket will handle adding message to Redux
      // thunkAPI.dispatch(addMessageToThread({ threadId, message: res.data }));
      return res.data;
    } catch (err) {
      thunkAPI.dispatch(setError(err.message));
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// 🔁 Optional: refresh a single conversation after approval/update
export const refreshConversationThunk = createAsyncThunk(
  'chat/refreshConversation',
  async (requestId, thunkAPI) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/teacher-requests/request/${requestId}`);
      const data = res.data;
console.log(res,"dataa")
      const state = thunkAPI.getState();
      const userId = state.user.userInfo.id;

      const otherParticipant = data.participants.find(p => p._id !== userId);
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
      const token = localStorage.getItem('token');

      // 1. Approve the request
      await axios.post(
        `${BACKEND_URL}/api/teacher-requests/${requestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 2. Get ChatThread by requestId
      const threadRes = await axios.get(
        `${BACKEND_URL}/api/chat/thread/${requestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const threadData = threadRes.data;

      // 3. Get messages using threadId
      const messagesRes = await axios.get(
        `${BACKEND_URL}/api/chat/messages/${threadData._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const messages = messagesRes.data;

      // 4. Normalize and dispatch
      const state = thunkAPI.getState();
      const userId = state.user.userInfo.id;
      const otherParticipant = threadData.participants.find(p => p._id !== userId);

      const latestSession = threadData.sessions?.[threadData.sessions.length - 1];
      const status = latestSession?.status || 'approved';

      const normalizedConvo = {
        threadId: threadData._id,
        requestId: threadData.requestId || requestId,
        messages,
        lastMessage: messages.at(-1)?.text || '',
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
