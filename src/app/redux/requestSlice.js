import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Your existing async thunks
export const sendTuitionRequest = createAsyncThunk(
  'requests/sendTuitionRequest',
  async ({ teacherId, postId, message }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.user.userInfo.token || localStorage.getItem('token');
      const studentId = state.user.userInfo.id;
      const studentName = state.user.userInfo.name;

      const res = await fetch('http://localhost:5000/api/teacher-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teacherId, postId, message, studentId, studentName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send tuition request');
      }

      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
export const sendTopicHelpRequest = createAsyncThunk(
  'requests/sendTopicHelpRequest',
  async ({ teacherId, topic, message }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.user.userInfo.token || localStorage.getItem('token');
      const studentId = state.user.userInfo.id;
      const studentName = state.user.userInfo.name;

      const res = await fetch('http://localhost:5000/api/teacher-requests', {  // UPDATED URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teacherId, studentId, studentName, topic, message }),  // include all required fields + topic
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send topic help request');
      }

      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const requestSlice = createSlice({
  name: 'requests',
  initialState: {
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendTuitionRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(sendTuitionRequest.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Tuition request sent successfully!';
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
      .addCase(sendTopicHelpRequest.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Topic help request sent successfully!';
      })
      .addCase(sendTopicHelpRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send topic help request';
      });
  },
});

export const { clearMessages } = requestSlice.actions;
export default requestSlice.reducer;
