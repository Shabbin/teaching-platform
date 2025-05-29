'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUserInfo } from '../redux/userSlice';

const UserRehydrator = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      dispatch(setUserInfo(JSON.parse(storedUser)));
    }
  }, [dispatch]);

  return null;
};

export default UserRehydrator;
