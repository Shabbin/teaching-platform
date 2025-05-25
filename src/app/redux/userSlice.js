import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 🔐 Login Thunk (already in your code)
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

      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 🧠 New: Student Dashboard Thunk
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
const initialState = {
  userInfo: initialUser,
  loading: false,
  error: null,
  studentDashboard: null,
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
  },

  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Student Dashboard
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

// ✅ Exports
export const { logout } = userSlice.actions;
export default userSlice.reducer;
