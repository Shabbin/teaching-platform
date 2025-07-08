import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to create a teacher post
export const createTeacherPost = createAsyncThunk(
  'teacherPosts/createTeacherPost',
  async (postData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      Object.entries(postData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value
            .filter(
              (v) =>
                v !== undefined && v !== null && v !== '' && typeof v === 'string'
            )
            .forEach((v) => formData.append(key, v));
        } else if (key === 'file' && value) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      const token = localStorage.getItem('token');

      const response = await axios.post('http://localhost:5000/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to update a teacher post
export const updateTeacherPost = createAsyncThunk(
  'teacherPosts/updateTeacherPost',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `http://localhost:5000/api/posts/${id}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ Async thunk to delete a teacher post
export const deleteTeacherPost = createAsyncThunk(
  'teacherPosts/deleteTeacherPost',
  async (postId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      return { postId }; // return just the ID for local removal
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const teacherPostSlice = createSlice({
  name: 'teacherPosts',
  initialState: {
    posts: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE
      .addCase(createTeacherPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTeacherPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.push(action.payload);
      })
      .addCase(createTeacherPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create post';
      })

      // UPDATE
      .addCase(updateTeacherPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeacherPost.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.posts.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      })
      .addCase(updateTeacherPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update post';
      })

      // ✅ DELETE
      .addCase(deleteTeacherPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTeacherPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = state.posts.filter((post) => post._id !== action.payload.postId);
      })
      .addCase(deleteTeacherPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete post';
      });
  },
});

export const { resetError } = teacherPostSlice.actions;

export default teacherPostSlice.reducer; 
