'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentDashboard } from './../../redux/userSlice';
import Topbar from './components/Topbar';
import ProtectedRoute from './../../components/auth/protectedRoute';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { studentDashboard, loading, error } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(getStudentDashboard());
  }, [dispatch]);

  return (
    <ProtectedRoute allowedRole="student">
      <div className="min-h-screen bg-gray-50">
        <Topbar title="🎓 Student Dashboard" />

        <div className="p-6">
          {loading && <p className="text-gray-500">Loading your dashboard...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          {studentDashboard && (
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
              <p className="text-lg">
                <span className="font-semibold">Message:</span> {studentDashboard.message}
              </p>
              <div>
                <p className="text-lg">
                  <span className="font-semibold">User ID:</span> {studentDashboard.user?.userId}
                </p>
                <p className="text-lg">
                  <span className="font-semibold">Role:</span> {studentDashboard.user?.role}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Session Issued At:</span>{' '}
                  {new Date(studentDashboard.user?.iat * 1000).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Session Expires At:</span>{' '}
                  {new Date(studentDashboard.user?.exp * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
