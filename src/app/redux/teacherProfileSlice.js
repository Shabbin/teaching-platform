import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async: Fetch teacher profile (with posts)
export const fetchTeacherProfile = createAsyncThunk(
  'teacherProfile/fetchTeacherProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const teacherId = state.user?.user?._id;
      const token = state.user?.token || localStorage.getItem('token');

      if (!teacherId || !token) {
        return rejectWithValue('Unauthorized or missing credentials');
      }

      const res = await axios.get(
        `http://localhost:5000/api/teachers/${teacherId}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch teacher profile');
    }
  }
);

// Async: Upload profile or background image
export const uploadTeacherImage = createAsyncThunk(
  'teacherProfile/uploadTeacherImage',
  async ({ file, type }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const teacherId = state.user?.user?._id;
      const token = state.user?.token || localStorage.getItem('token');

      if (!teacherId || !token) {
        return rejectWithValue('Unauthorized or missing credentials');
      }

      const formData = new FormData();
      formData.append(type, file);

      const endpoint = type === 'profileImage'
        ? 'profile-picture'
        : 'cover-image';

      await axios.put(
        `http://localhost:5000/api/teachers/${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Re-fetch updated profile
      const refreshed = await axios.get(
        `http://localhost:5000/api/teachers/${teacherId}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return refreshed.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Image upload failed');
    }
  }
);

// Slice
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
      // Fetch
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

      // Upload
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
