// redux/notificationsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios'; // ✅ env-driven axios instance

// Async thunk to fetch notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/notifications', { withCredentials: true });
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

// Async thunk to mark notifications read
export const markNotificationsRead = createAsyncThunk(
  'notifications/markNotificationsRead',
  async (ids, { rejectWithValue }) => {
    try {
      const { data } = await API.post(
        '/notifications/mark-read',
        { notificationIds: ids },
        { withCredentials: true }
      );
      return data; // expect { readIds: [...] }
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      const notif = action.payload;
      const exists = state.notifications.find((n) => n._id === notif._id);
      console.log('[notificationsSlice] addNotification called with:', notif);
      if (exists) {
        console.log('[notificationsSlice] Notification already exists:', notif._id);
      } else {
        state.notifications.unshift(notif);
        console.log('[notificationsSlice] Notification added:', notif._id);
      }
    },
    markNotificationsReadOptimistic: (state, action) => {
      const readIds = action.payload;
      console.log('[notificationsSlice] Marking as read (optimistic):', readIds);
      state.notifications = state.notifications.map((n) =>
        readIds.includes(n._id || n.id) ? { ...n, read: true } : n
      );
    },
    revertNotificationsRead: (state, action) => {
      const idsToRevert = action.payload;
      state.notifications = state.notifications.map((n) =>
        idsToRevert.includes(n._id || n.id) ? { ...n, read: false } : n
      );
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(markNotificationsRead.fulfilled, (state, action) => {
        const readIds = action.payload.readIds || [];
        state.notifications = state.notifications.map((n) =>
          readIds.includes(n._id || n.id) ? { ...n, read: true } : n
        );
      })
      .addCase(markNotificationsRead.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  addNotification,
  markNotificationsReadOptimistic,
  revertNotificationsRead,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
