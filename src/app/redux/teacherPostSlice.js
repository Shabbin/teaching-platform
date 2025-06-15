import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ✅ Async thunk
export const fetchTeacherPosts = createAsyncThunk(
  'teacherPosts/fetchTeacherPosts',
  async (teacherId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/posts/teacher/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch teacher posts');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
export const updateTeacherPost = createAsyncThunk(
  'teacherPosts/updateTeacherPost',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update post');
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
export const deleteTeacherPost = createAsyncThunk(
  'teacherPosts/deleteTeacherPost',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete post');
      return { id, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
// ✅ Initial state
const initialState = {
  items: [],
  loading: false,
  error: null,
};

// ✅ Slice
const teacherPostSlice = createSlice({
  name: 'teacherPosts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeacherPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTeacherPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      }).addCase(updateTeacherPost.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(updateTeacherPost.fulfilled, (state, action) => {
  state.loading = false;
  // Optional: update specific post in state.items if needed
})
.addCase(updateTeacherPost.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
});

  },
});

// ✅ Only export ONCE each
export default teacherPostSlice.reducer;
