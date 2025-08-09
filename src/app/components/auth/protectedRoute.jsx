'use client';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logout } from './../../redux/userSlice';

export default function ProtectedRoute({ children, allowedRole }) {
  const { userInfo, isFetched, loading } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    // Only check auth after rehydration and loading complete
    if (isFetched && !loading) {
      if (!userInfo || userInfo.role !== allowedRole) {
        dispatch(logout());
        router.push('/login');
      }
    }
  }, [userInfo, allowedRole, dispatch, router, isFetched, loading]);

  // Don't render or redirect until user data is loaded and ready
  if (!isFetched || loading) return null;

  // If user not allowed, don't render children
  if (!userInfo || userInfo.role !== allowedRole) return null;

  return children;
}
