import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// 🔐 Login Thunk
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/login', formData, {
        withCredentials: true,
      });
      return data.user;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

// 🎓 Student Dashboard Thunk
export const getStudentDashboard = createAsyncThunk(
  'user/getStudentDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/students/dashboard', {
        withCredentials: true,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

// 🧑‍🏫 Teacher Dashboard Thunk
export const getTeacherDashboard = createAsyncThunk(
  'user/getTeacherDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/teachers/dashboard', {
        withCredentials: true,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

// 🧠 Get current logged-in user info
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/auth/me', { withCredentials: true });
      return res.data.user;
    } catch (error) {
      if (error?.response?.status === 401) return null;
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

// 📷 Upload Profile Picture (FormData; no manual headers)
export const uploadProfilePicture = createAsyncThunk(
  'user/uploadProfilePicture',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('profileImage', file); // must match backend field

      const { data } = await API.put('/teachers/profile-picture', formData, {
        withCredentials: true,
        // DO NOT set Content-Type here; Axios will set proper multipart boundary
      });

      return data.profileImage;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

// 🧾 Initial State
const initialState = {
  userInfo: null,
  profileImage: '/default-avatar.png',

  studentDashboard: null,
  teacherDashboard: null,

  loading: false,
  error: null,

  dashboardLoading: false,
  dashboardError: null,

  isFetched: false,
  isAuthenticated: false,
};

// 🔧 Slice
const userSlice = createSlice({
  name: 'user',
  initialState,

  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.isFetched = true;
      state.isAuthenticated = false;
      state.error = null;
      state.studentDashboard = null;
      state.teacherDashboard = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    updateProfileImage: (state, action) => {
      const base = action.payload || '/default-avatar.png';
      const newUrl = base + (base.includes('?') ? '&' : '?') + 'v=' + Date.now();

      state.profileImage = newUrl;

      if (state.userInfo) state.userInfo.profileImage = newUrl;
      if (state.teacherDashboard?.teacher) {
        state.teacherDashboard.teacher.profileImage = newUrl;
      }
    },

    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
      state.isFetched = true;
      state.isAuthenticated = Boolean(action.payload);

      const img = action.payload?.profileImage;
      state.profileImage =
        img?.startsWith('http') || !img
          ? img || '/default-avatar.png'
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${img}`;
    },

    setTeacherData: (state, action) => {
      state.userInfo = action.payload;
      state.isFetched = true;
      state.isAuthenticated = Boolean(action.payload);

      const img = action.payload?.profileImage;
      state.profileImage =
        img?.startsWith('http') || !img
          ? img || '/default-avatar.png'
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${img}`;
    },
  },

  extraReducers: (builder) => {
    builder
      // === Login ===
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;

        const img = action.payload?.profileImage;
        state.profileImage =
          img?.startsWith('http') || !img
            ? img || '/default-avatar.png'
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${img}`;

        state.isFetched = true;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // === Fetch Current User ===
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;

        const img = action.payload?.profileImage;
        state.profileImage =
          img?.startsWith('http') || !img
            ? img || '/default-avatar.png'
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${img}`;

        if (action.payload === null) {
          state.error = null;
          state.isAuthenticated = false;
        } else {
          state.isAuthenticated = true;
        }

        state.isFetched = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.userInfo = null;
        state.profileImage = '/default-avatar.png';

        if (action.payload === 'Not authenticated') {
          state.error = null;
          state.isAuthenticated = false;
        } else {
          state.error = action.payload;
        }

        state.isFetched = true;
      })

      // === Student Dashboard ===
      .addCase(getStudentDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStudentDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.studentDashboard = action.payload;
      })
      .addCase(getStudentDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // === Teacher Dashboard ===
      .addCase(getTeacherDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(getTeacherDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.teacherDashboard = action.payload;
      })
      .addCase(getTeacherDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload;
      })

      // === Upload Profile Picture ===
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        const base = action.payload;
        const cacheBusted = base + (base.includes('?') ? '&' : '?') + 'v=' + Date.now();

        state.profileImage = cacheBusted;

        if (state.userInfo) state.userInfo.profileImage = cacheBusted;
        if (state.teacherDashboard?.teacher) {
          state.teacherDashboard.teacher.profileImage = cacheBusted;
        }
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  logout,
  updateProfileImage,
  setUserInfo,
  setTeacherData,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;
