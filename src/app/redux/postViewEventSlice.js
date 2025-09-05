import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios'; // ✅ centralized axios (env-driven)

// -------------------------------------------------------------------
// Thunks
// -------------------------------------------------------------------

// Fetch recent view events for a teacher
export const fetchPostViewEvents = createAsyncThunk(
  'postViewEvents/fetch',
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/posts/recent-views/${teacherId}`, {
        withCredentials: true,
      });
      console.log('fetchPostViewEvents response:', response);
      return response.data.events;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

// Fetch full post details by postId
export const fetchPostById = createAsyncThunk(
  'postViewEvents/fetchPostById',
  async (postId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/posts/${postId}`, {
        withCredentials: true,
      });
      console.log("Response the data", data);
      return data; // should include description from backend
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

// ✅ Increment post view (student visiting a post)
export const incrementPostView = createAsyncThunk(
  'postViewEvents/incrementView',
  async (postId, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/posts/${postId}/view`, {}, {
        withCredentials: true,
      });
      console.log("incrementPostView response:", data);
      return { postId, ...data };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

// -------------------------------------------------------------------
// Slice
// -------------------------------------------------------------------
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
      const postIdKey =
        typeof action.payload.postId === 'object'
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
      // Fetch events
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

      // Fetch post by ID
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.posts[action.payload._id] = action.payload;
      })

      // ✅ Increment post view
      .addCase(incrementPostView.fulfilled, (state, action) => {
        const { postId, viewsCount } = action.payload;
        if (state.posts[postId]) {
          state.posts[postId] = {
            ...state.posts[postId],
            viewsCount,
          };
        }
      })
      .addCase(incrementPostView.rejected, (state, action) => {
        state.error = action.payload || 'Failed to increment post view';
      });
  },
});

// -------------------------------------------------------------------
export const { addPostViewEvent, clearPostViewEvents, updatePostViewsCount } =
  postViewEventsSlice.actions;

export default postViewEventsSlice.reducer;
