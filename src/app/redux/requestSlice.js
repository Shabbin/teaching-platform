import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ===============================
// SEND TUITION REQUEST
// ===============================
export const sendTuitionRequest = createAsyncThunk(
  'requests/sendTuitionRequest',
  async ({ teacherId, postId, message }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userInfo = state.user.userInfo;

      if (!userInfo) {
        return rejectWithValue('User not authenticated');
      }

      const studentId = userInfo.id || userInfo._id;
      const studentName = userInfo.name;

      const res = await fetch('http://localhost:5000/api/teacher-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // send cookies
        body: JSON.stringify({ teacherId, postId, message, studentId, studentName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send tuition request');
      }

      const data = await res.json();
      return data; // includes request object
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ===============================
// SEND TOPIC HELP REQUEST
// ===============================
export const sendTopicHelpRequest = createAsyncThunk(
  'requests/sendTopicHelpRequest',
  async ({ teacherId, topic, message }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userInfo = state.user.userInfo;

      if (!userInfo) {
        return rejectWithValue('User not authenticated');
      }

      const studentId = userInfo.id || userInfo._id;
      const studentName = userInfo.name;

      const res = await fetch('http://localhost:5000/api/teacher-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ teacherId, studentId, studentName, topic, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send topic help request');
      }

      const data = await res.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ===============================
// SLICE
// ===============================
const requestSlice = createSlice({
  name: 'requests',
  initialState: {
    loading: false,
    error: null,
    successMessage: null,
    lastRequestId: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
      state.lastRequestId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendTuitionRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(sendTuitionRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'Tuition request sent successfully!';
        state.lastRequestId = action.payload.request._id;
      })
      .addCase(sendTuitionRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send tuition request';
      })
      .addCase(sendTopicHelpRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(sendTopicHelpRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'Topic help request sent successfully!';
        state.lastRequestId = action.payload.request._id;
      })
      .addCase(sendTopicHelpRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send topic help request';
      });
  },
});

export const { clearMessages } = requestSlice.actions;
export default requestSlice.reducer;
