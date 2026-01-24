import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';
import { logout } from './userSlice';

// Fetch teacher profile (with posts)
export const fetchTeacherProfile = createAsyncThunk(
  'teacherProfile/fetchTeacherProfile',
  async ({ teacherId }, { rejectWithValue }) => {
    if (!teacherId) return rejectWithValue('Teacher ID is required');

    try {
      const res = await API.get(`/teachers/${teacherId}/profile`, {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch teacher profile');
    }
  }
);


// Upload profile or cover image
export const uploadTeacherImage = createAsyncThunk(
  'teacherProfile/uploadTeacherImage',
  async ({ file, type, teacherId }, { rejectWithValue }) => {
    
    try {
      const formData = new FormData();
      formData.append(type, file);

      const endpoint = type === 'profileImage' ? 'profile-picture' : 'cover-image';

      await API.put(`/teachers/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      // Re-fetch updated profile using the correct teacherId
      const refreshed = await API.get(`/teachers/${teacherId}/profile`, {
        withCredentials: true,
      });

      return refreshed.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.response?.data || 'Image upload failed'
      );
    }
  }
);

const teacherProfileSlice = createSlice({
  name: 'teacherProfile',
  initialState: {
    teacher: null,
    posts: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => {
        state.teacher = null;
        state.posts = [];
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTeacherProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.teacher = action.payload.teacher;
        state.posts = action.payload.posts || [];
      })
      .addCase(fetchTeacherProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadTeacherImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadTeacherImage.fulfilled, (state, action) => {
        state.loading = false;
        state.teacher = action.payload.teacher;
        state.posts = action.payload.posts || [];
      })
      .addCase(uploadTeacherImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default teacherProfileSlice.reducer;
