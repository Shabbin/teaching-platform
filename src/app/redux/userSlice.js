import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for login
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

const initialUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
const initialState = {
  userInfo: null,
  loading: false,
  error: null,
};
const userSlice = createSlice({
  name: 'user',
  initialState,
  
  reducers: {
    logout: (state) => {
    Object.assign(state, initialState);  // Clears all keys, useful if you don’t store other data
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
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});


export const { logout } = userSlice.actions;
export default userSlice.reducer;
