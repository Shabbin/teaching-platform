import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 🔐 Login Thunk (unchanged)
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 🎓 Student Dashboard Thunk (unchanged)
export const getStudentDashboard = createAsyncThunk(
  'user/getStudentDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/students/dashboard', {
        credentials: 'include',
      });

      console.log('getStudentDashboard response status:', res.status);

      const data = await res.json();

      console.log('getStudentDashboard response data:', data);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch student dashboard');
      }

      return data;
    } catch (error) {
      console.error('getStudentDashboard error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// 🧑‍🏫 Teacher Dashboard Thunk (unchanged)
export const getTeacherDashboard = createAsyncThunk(
  'user/getTeacherDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/teachers/dashboard', {
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch teacher dashboard');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 🧠 Get current logged-in user info (unchanged thunk code)
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        credentials: 'include',
      });

      console.log('fetchCurrentUser response status:', res.status);

      if (res.status === 401) {
        // 401 means not authenticated, return null silently (no error)
        return null;
      }

      const data = await res.json();

      console.log('fetchCurrentUser data:', data);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      return data.user;
    } catch (error) {
       return rejectWithValue(error.message);
     
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

  isFetched: false,        // true once we attempted fetchCurrentUser (success or fail)
  isAuthenticated: false,  // true if userInfo exists and valid
};

// 🔧 Slice
const userSlice = createSlice({
  name: 'user',
  initialState,

  reducers: {
    logout: (state) => {
      state.userInfo = null;
      // state.profileImage = '/default-avatar.png';
      state.isFetched = true;
      state.isAuthenticated = false;  // reset auth state on logout
      state.error = null;
      state.studentDashboard = null;
      state.teacherDashboard = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    updateProfileImage: (state, action) => {
      const newImg = action.payload;
      state.profileImage = newImg;

      if (state.userInfo) {
        state.userInfo.profileImage = newImg;
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
          : `http://localhost:5000/${img}`;
    },

    setTeacherData: (state, action) => {
      state.userInfo = action.payload;
      state.isFetched = true;
      state.isAuthenticated = Boolean(action.payload);

      const img = action.payload?.profileImage;
      state.profileImage =
        img?.startsWith('http') || !img
          ? img || '/default-avatar.png'
          : `http://localhost:5000/${img}`;
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
            : `http://localhost:5000/${img}`;

        state.isFetched = true;
        state.isAuthenticated = true;  // user is logged in
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
            : `http://localhost:5000/${img}`;

        if (action.payload === null) {
          // Not authenticated
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
        console.log('Reducer received studentDashboard:', action.payload);
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
