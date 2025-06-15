import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import teacherProfileReducer from './teacherProfileSlice'
import teacherPostsReducer from './teacherPostSlice'
export const store = configureStore({
  reducer: {
    user: userReducer,
    teacherProfile: teacherProfileReducer,
        teacherPosts: teacherPostsReducer
  },
});
