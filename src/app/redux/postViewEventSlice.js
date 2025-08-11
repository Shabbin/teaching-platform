import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk to fetch recent view events for teacher
export const fetchPostViewEvents = createAsyncThunk(
  'postViewEvents/fetch',
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/posts/recent-views/${teacherId}`);
      console.log('fetchPostViewEvents response:', response)
      return response.data.events;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Thunk to fetch full post details by postId
export const fetchPostById = createAsyncThunk(
  'postViewEvents/fetchPostById',
  async (postId, thunkAPI) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch post');
      const data = await res.json();
      return data;  // data must include description here from backend
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const postViewEventsSlice = createSlice({
  name: 'postViewEvents',
  initialState: {
    events: [],
    posts: {}, // post objects here, including description, title, viewsCount, etc
    loading: false,
    error: null,
  },
  reducers: {
    addPostViewEvent: (state, action) => {
      const postIdKey = typeof action.payload.postId === 'object'
        ? action.payload.postId._id?.toString() || JSON.stringify(action.payload.postId)
        : action.payload.postId;

      // Add event immutably at the front:
      state.events = [action.payload, ...state.events].slice(0, 20);

      // Update viewsCount immutably:
      if (state.posts[postIdKey]) {
        state.posts[postIdKey] = {
          ...state.posts[postIdKey],
          viewsCount: (state.posts[postIdKey].viewsCount || 0) + 1,
        };
      }
    },

    updatePostViewsCount: (state, action) => {
      let postIdKey = action.payload.postId;
      if (typeof postIdKey === 'object') {
        postIdKey = postIdKey._id?.toString() || JSON.stringify(postIdKey);
      }
      const viewsCount = action.payload.viewsCount;

      if (state.posts[postIdKey]) {
        state.posts[postIdKey] = {
          ...state.posts[postIdKey],
          viewsCount,
        };
      }
    },

    clearPostViewEvents: (state) => {
      state.events = [];
      state.posts = {};
      state.loading = true;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchPostViewEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostViewEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchPostViewEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch post view events';
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        // This post object should include `description` field from backend
        state.posts[action.payload._id] = action.payload;
      });
  },
});

export const { addPostViewEvent, clearPostViewEvents, updatePostViewsCount } = postViewEventsSlice.actions;

export default postViewEventsSlice.reducer;
