'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import UserRehydrator from '../components/userRehydrator';

export default function ReduxProviderWrapper({ children }) {
  return (
    <Provider store={store}>
      <UserRehydrator>{children}</UserRehydrator>
    </Provider>
  );
}
