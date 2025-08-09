'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from '../redux/userSlice';

export default function UserRehydrator({ children }) {
  const dispatch = useDispatch();
  const isFetched = useSelector((state) => state.user.isFetched);

  useEffect(() => {
    if (!isFetched) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isFetched]);

  if (!isFetched) {
    return null; // Wait until user info is fetched before rendering children
  }

  return children;
}
