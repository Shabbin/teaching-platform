'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children, allowedRole }) => {
  const router = useRouter();
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userInfo || userInfo.role !== allowedRole) {
      router.push('/');
    }
  }, [userInfo, allowedRole, router]);

  // While checking, you may want to avoid flashing content
  if (!userInfo || userInfo.role !== allowedRole) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
