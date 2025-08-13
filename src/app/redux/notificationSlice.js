// redux/notificationsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to fetch notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        credentials: 'include', // send cookies if your backend uses session cookies
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to mark notifications read
export const markNotificationsRead = createAsyncThunk(
  'notifications/markNotificationsRead',
  async (ids, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send cookies if your backend uses session cookies
        body: JSON.stringify({ notificationIds: ids }),
      });
      if (!res.ok) throw new Error('Failed to mark notifications read');
      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
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
  const exists = state.notifications.find(n => n._id === notif._id);
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

export const { addNotification, markNotificationsReadOptimistic,revertNotificationsRead } = notificationsSlice.actions;

export default notificationsSlice.reducer;
