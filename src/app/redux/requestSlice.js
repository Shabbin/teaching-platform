import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ===============================
// SEND TUITION REQUEST
// ===============================
export const sendTuitionRequest = createAsyncThunk(
  'requests/sendTuitionRequest',
  async ({ teacherId, postId, message }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.user.userInfo.token || localStorage.getItem('token');
      const studentId = state.user.userInfo.id;
      const studentName = state.user.userInfo.name;

      console.log(token, 'token');
      console.log(studentId, 'StudentID');
      console.log(studentName, 'StudentName');

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

      const data = await res.json();
      console.log('✅ Tuition Request ID:', data.request._id);
      return data; // return full response (includes `request`)
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
      const token = state.user.userInfo.token || localStorage.getItem('token');
      const studentId = state.user.userInfo.id;
      const studentName = state.user.userInfo.name;

      console.log(token, 'token');
      console.log(studentId, 'StudentID');
      console.log(studentName, 'StudentName');

      const res = await fetch('http://localhost:5000/api/teacher-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teacherId, studentId, studentName, topic, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send topic help request');
      }

      const data = await res.json();
      console.log('✅ Topic Help Request ID:', data.request._id);
      return data; // return full response (includes `request`)
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
    lastRequestId: null, // optional: useful if you want to access this elsewhere
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
        state.lastRequestId = action.payload.request._id; // Save requestId to state
        console.log('🎯 Tuition Request Fulfilled ID:', state.lastRequestId);
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
        state.lastRequestId = action.payload.request._id; // Save requestId
        console.log('🎯 Topic Help Request Fulfilled ID:', state.lastRequestId);
      })
      .addCase(sendTopicHelpRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send topic help request';
      });
  },
});

export const { clearMessages } = requestSlice.actions;
export default requestSlice.reducer;
