'use client';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logout } from './../../redux/userSlice';

export default function ProtectedRoute({ children, allowedRole }) {
  const { userInfo } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  // 🧠 Token Check Logic
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token || !userInfo || userInfo.role !== allowedRole) {
        dispatch(logout());
        router.push('/login');
      }
    };

    checkAuth();

    // 🧠 Listen to manual changes (even across tabs)
    const handleStorageChange = (event) => {
      if (event.key === 'token' && event.newValue === null) {
        console.warn('Token manually removed. Logging out...');
        dispatch(logout());
        router.push('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userInfo, allowedRole, dispatch, router]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token || !userInfo || userInfo.role !== allowedRole) return null;

  return children;
}
