import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { logout } from './userSlice';

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

      const response = await axios.post('http://localhost:5000/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
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
      const response = await axios.put(
        `http://localhost:5000/api/posts/${id}`,
        updatedData,
        {
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to delete a teacher post
export const deleteTeacherPost = createAsyncThunk(
  'teacherPosts/deleteTeacherPost',
  async (postId, { rejectWithValue }) => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
        withCredentials: true,
      });

      return { postId };
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
      // Clear posts on logout
      .addCase(logout, (state) => {
        state.posts = [];
        state.loading = false;
        state.error = null;
      })

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

      // DELETE
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
