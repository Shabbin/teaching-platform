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
    if (!isFetched || loading) return;

    // Case 1: User is logged in but role mismatch → send to /login
    if (userInfo && userInfo.role !== allowedRole) {
      router.replace('/login');
    }

    // Case 2: User is logged out → layout handles landing page redirect
    // So we do NOT force push to /login here
  }, [userInfo, allowedRole, router, isFetched, loading]);

  // Don't render until data is ready
  if (!isFetched || loading) return null;

  // If user exists and role matches, render children
  if (userInfo && userInfo.role === allowedRole) return children;

  // Otherwise, null (layout will handle redirect)
  return null;
}
