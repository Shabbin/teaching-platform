// src/redux/teacherProfileSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// Fetch teacher profile data (details + posts)
export const fetchTeacherProfile = createAsyncThunk(
  'teacherProfile/fetchTeacherProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState()
      const teacherId = state.user.user._id  // 🔄 dynamically from auth state

      const res = await axios.get(`http://localhost:5000/api/teachers/${teacherId}/profile`)
      
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch profile')
    }
  }
)

// Upload profile or background image
export const uploadTeacherImage = createAsyncThunk(
  'teacherProfile/uploadTeacherImage',
  async ({ file, type }, { getState, rejectWithValue }) => {
    try {
      const state = getState()
      const teacherId = state.user.user._id  // 🔄 dynamically from auth state
      const token = state.user.token || localStorage.getItem('token')

      const formData = new FormData()
      formData.append(type, file)

      const uploadEndpoint = type === 'profileImage'
        ? 'profile-picture'
        : 'cover-image'

      await axios.put(
        `http://localhost:5000/api/teachers/${uploadEndpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Fetch updated profile after image upload
      const refreshed = await axios.get(`http://localhost:5000/api/teachers/${teacherId}/profile`)
      return refreshed.data
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Image upload failed')
    }
  }
)

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
      // fetchTeacherProfile
      .addCase(fetchTeacherProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTeacherProfile.fulfilled, (state, action) => {
        state.loading = false
        state.teacher = action.payload.teacher
        state.posts = action.payload.posts
      })
      .addCase(fetchTeacherProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // uploadTeacherImage
      .addCase(uploadTeacherImage.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadTeacherImage.fulfilled, (state, action) => {
        state.loading = false
        state.teacher = action.payload.teacher
        state.posts = action.payload.posts
      })
      .addCase(uploadTeacherImage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export default teacherProfileSlice.reducer
