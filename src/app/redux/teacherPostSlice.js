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
            .filter(v => v !== undefined && v !== null && v !== '' && typeof v === 'string')
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
      });
  },
});

export const { resetError } = teacherPostSlice.actions;

export default teacherPostSlice.reducer;
