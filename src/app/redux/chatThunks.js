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
  async ({ role, userId }, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token found');

      // Choose API endpoint based on role
      const endpoint =
        role === 'teacher'
          ? `${BACKEND_URL}/api/teacher-requests/teacher`
          : `${BACKEND_URL}/api/chat/student/${userId}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = res.data;

      // Transform response for teacher
      if (role === 'teacher') {
        data = data.map((thread) => {
          const student = thread.participants?.find((p) => p._id !== userId);
          const latestSession = thread.sessions?.[thread.sessions.length - 1];
          const status = latestSession?.status || 'approved';

          return {
            threadId: thread._id,
            participantId: student?._id,
            participantName: student?.name || 'Unknown Student',
            messages: thread.messages || [],
            lastMessage: thread.messages?.at(-1)?.text || '',
            unreadCount: 0,
            status,
            requestId: thread.requestId || null,
          };
        });
      }

      // Transform response for student
      else if (role === 'student') {
        data = data.map((thread) => {
          const teacher = thread.participants?.find((p) => p._id !== userId);
          const latestSession = thread.sessions?.[thread.sessions.length - 1];
          const status = latestSession?.status || 'approved';

          return {
  threadId: thread._id,
  teacherId: teacher?._id,
  teacherName: teacher?.name || 'Unknown Teacher',  // <-- change here
  messages: thread.messages || [],
  lastMessage: thread.messages?.at(-1)?.text || '',
  unreadCount: 0,
  status,
  requestId: thread.requestId || null,
};
        });
      }

      return data;
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
      thunkAPI.dispatch(addOrUpdateConversation(res.data));
      return res.data;
    } catch (err) {
      thunkAPI.dispatch(setError(err.message));
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);
