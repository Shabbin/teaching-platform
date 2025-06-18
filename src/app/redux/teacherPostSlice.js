import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ✅ Create post
 const createTeacherPost = createAsyncThunk(
  'teacherPosts/createTeacherPost',
  async (postData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create post');
console.log(data, "Data")
      return data.post || data; // ✅ Return only the post
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


// ✅ Fetch posts
 const fetchTeacherPosts = createAsyncThunk(
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

// ✅ Update post
 const updateTeacherPost = createAsyncThunk(
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

// ✅ Delete post
 const deleteTeacherPost = createAsyncThunk(
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
      // Fetch
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
      })

      // Create
      .addCase(createTeacherPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTeacherPost.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createTeacherPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateTeacherPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeacherPost.fulfilled, (state, action) => {
        state.loading = false;
        // Optional: update post in items if needed
      })
      .addCase(updateTeacherPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteTeacherPost.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(post => post._id !== action.payload.id);
      });
  },
});

// ✅ Export reducer + thunks
export default teacherPostSlice.reducer;

export {
  createTeacherPost,
  fetchTeacherPosts,
  updateTeacherPost,
  deleteTeacherPost,
};
