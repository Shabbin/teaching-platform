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

      // We assume updatedData is a plain object, not FormData
      // Adjust headers and body accordingly if you want to send multipart/form-data instead
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
      // createTeacherPost cases
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

      // updateTeacherPost cases
      .addCase(updateTeacherPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeacherPost.fulfilled, (state, action) => {
        state.loading = false;
        // Find and update post in posts array
        const index = state.posts.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      })
      .addCase(updateTeacherPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update post';
      });
  },
});

export const { resetError } = teacherPostSlice.actions;

export default teacherPostSlice.reducer;
