import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import teacherProfileReducer from './teacherProfileSlice'
export const store = configureStore({
  reducer: {
    user: userReducer,
    teacherProfile: teacherProfileReducer
  },
});
