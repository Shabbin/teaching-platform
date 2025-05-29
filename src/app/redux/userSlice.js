import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 🔐 Login Thunk
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 🧠 Student Dashboard Thunk
export const getStudentDashboard = createAsyncThunk(
  'user/getStudentDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/students/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch student dashboard');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 🧾 Initial State
const initialUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
const initialProfileImage =
  initialUser?.profileImage?.startsWith('http') || !initialUser?.profileImage
    ? initialUser?.profileImage
    : `http://localhost:5000/${initialUser?.profileImage}`;

const initialState = {
  userInfo: initialUser,
  profileImage: initialProfileImage || '/default-profile.png', // 👈 ADDED
  loading: false,
  error: null,
  studentDashboard: null,
  teacherProfile: null,
};

// 🔧 Slice
const userSlice = createSlice({
  name: 'user',
  initialState,

  reducers: {
    logout: (state) => {
      Object.assign(state, initialState);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setTeacherData: (state, action) => {
      state.teacherProfile = action.payload;
    },
    updateProfileImage: (state, action) => {
      const newImg = action.payload;
      state.profileImage = newImg;
      if (state.userInfo) {
        state.userInfo.profileImage = newImg;
      }
      if (state.teacherProfile) {
        state.teacherProfile.profileImage = newImg;
      }

      // ⬇️ Update user in localStorage if already there
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.profileImage = newImg;
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
  },

  extraReducers: (builder) => {
    builder
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
            ? img || '/default-profile.png'
            : `http://localhost:5000/${img}`;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

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
      });
  },
});

// ✅ Export actions
export const { logout, setTeacherData, updateProfileImage } = userSlice.actions;
export default userSlice.reducer;
