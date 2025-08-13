import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import teacherProfileReducer from './teacherProfileSlice'
import teacherPostsReducer from './teacherPostSlice'
import requestReducer from './requestSlice';
import chatReducer from './chatSlice';
import postViewEventsReducer from './postViewEventSlice';
import notificationsReducer from './notificationSlice';
export const store = configureStore({
  reducer: {
    user: userReducer,
    // <--- key here is 'requests'
    teacherProfile: teacherProfileReducer,
    teacherPosts: teacherPostsReducer,
 chat: chatReducer,
    requests: requestReducer,
      postViewEvents: postViewEventsReducer,
          notifications: notificationsReducer,
  },
});
