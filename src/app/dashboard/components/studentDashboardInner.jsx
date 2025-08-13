'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentDashboard } from '../../redux/userSlice';

import ProtectedRoute from '../../components/auth/protectedRoute';
import Image from 'next/image';
import Link from 'next/link';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { studentDashboard, loading, error } = useSelector((state) => state.user);
console.log(studentDashboard ,"gswderfgdsfg")
useEffect(() => {
  if (!studentDashboard) {
    console.log('Dispatching getStudentDashboard');
    dispatch(getStudentDashboard());
  }
}, [dispatch, studentDashboard]);

  return (
    <ProtectedRoute allowedRole="student">
      <div className="min-h-screen bg-gray-50">


        <div className="p-6 max-w-6xl mx-auto space-y-6">
          {/* Loading/Error */}
          {loading && <p className="text-gray-500">Loading your dashboard...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          {/* Dashboard content */}
          {studentDashboard && (
            <>
              {/* Welcome Section */}
              <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
                <Image
                  src={studentDashboard.student?.profileImage || '/default-avatar.png'}
                  alt="Student Profile"
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold">
                    Welcome, {studentDashboard.student?.name || 'Student'}!
                  </h2>
                  <p className="text-sm text-gray-600">{studentDashboard.student?.email}</p>
                </div>
              </div>

              {/* Quick Links Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/student/teachers">
                  <div className="bg-white hover:bg-blue-50 transition p-6 rounded-lg shadow-md text-center cursor-pointer">
                    <h3 className="text-lg font-semibold text-blue-600">👩‍🏫 View Teachers</h3>
                    <p className="text-gray-500 text-sm mt-1">Browse available and eligible teachers</p>
                  </div>
                </Link>

                <Link href="/student/requests">
                  <div className="bg-white hover:bg-green-50 transition p-6 rounded-lg shadow-md text-center cursor-pointer">
                    <h3 className="text-lg font-semibold text-green-600">📨 My Requests</h3>
                    <p className="text-gray-500 text-sm mt-1">See your tuition help or session requests</p>
                  </div>
                </Link>

                <Link href="/student/settings">
                  <div className="bg-white hover:bg-gray-100 transition p-6 rounded-lg shadow-md text-center cursor-pointer">
                    <h3 className="text-lg font-semibold text-gray-700">⚙️ Account Settings</h3>
                    <p className="text-gray-500 text-sm mt-1">Update your profile or preferences</p>
                  </div>
                </Link>
              </div>

              {/* Token Info (optional) */}
              <details className="mt-6 bg-white p-4 rounded shadow text-sm text-gray-600">
                <summary className="cursor-pointer font-semibold text-gray-800">🔐 Session Details</summary>
                <div className="mt-2 space-y-1">
                  <p><span className="font-medium">User ID:</span> {studentDashboard.user?.id}</p>
                  <p><span className="font-medium">Role:</span> {studentDashboard.user?.role}</p>
                  <p><span className="font-medium">Issued At:</span> {new Date(studentDashboard.user?.iat * 1000).toLocaleString()}</p>
                  <p><span className="font-medium">Expires At:</span> {new Date(studentDashboard.user?.exp * 1000).toLocaleString()}</p>
                </div>
              </details>
            </>
          )}
        </div>
  
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
