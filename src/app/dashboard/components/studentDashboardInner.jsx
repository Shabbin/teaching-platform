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

  useEffect(() => {
    if (!studentDashboard) {
      dispatch(getStudentDashboard());
    }
  }, [dispatch, studentDashboard]);

  return (
    <ProtectedRoute allowedRole="student">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">

        <div className="p-6 max-w-6xl mx-auto space-y-8">
          {/* Loading/Error */}
          {loading && <p className="text-gray-500 text-center animate-pulse">Loading your dashboard...</p>}
          {error && <p className="text-red-500 text-center">{error}</p>}

          {/* Dashboard content */}
          {studentDashboard && (
            <>
              {/* Welcome Section */}
              <div className="bg-white p-6 flex items-center gap-5 rounded-3xl">
                <Image
                  src={studentDashboard.student?.profileImage || '/default-avatar.png'}
                  alt="Student Profile"
                  width={72}
                  height={72}
                  className="rounded-full object-cover ring-2 ring-indigo-500"
                />
                <div>
                  <h2 className="text-2xl font-extrabold text-[oklch(0.55_0.28_296.71)]">
                    Welcome, {studentDashboard.student?.name || 'Student'}!
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{studentDashboard.student?.email}</p>
                </div>
              </div>

              {/* Quick Links Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/student/teachers">
                  <div className="bg-white hover:shadow-xl transition p-6 rounded-3xl text-center cursor-pointer border border-gray-100 hover:border-indigo-200">
                    <h3 className="text-lg font-semibold text-indigo-600">👩‍🏫 View Teachers</h3>
                    <p className="text-gray-500 text-sm mt-2">Browse available and eligible teachers</p>
                  </div>
                </Link>

                <Link href="/student/requests">
                  <div className="bg-white hover:shadow-xl transition p-6 rounded-3xl text-center cursor-pointer border border-gray-100 hover:border-green-200">
                    <h3 className="text-lg font-semibold text-green-600">📨 My Requests</h3>
                    <p className="text-gray-500 text-sm mt-2">See your tuition help or session requests</p>
                  </div>
                </Link>

                <Link href="/student/settings">
                  <div className="bg-white hover:shadow-xl transition p-6 rounded-3xl text-center cursor-pointer border border-gray-100 hover:border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-700">⚙️ Account Settings</h3>
                    <p className="text-gray-500 text-sm mt-2">Update your profile or preferences</p>
                  </div>
                </Link>
              </div>

              {/* Token / Session Info */}
              <details className="mt-6 bg-white p-5 rounded-2xl shadow text-sm text-gray-600">
                <summary className="cursor-pointer font-semibold text-gray-800 hover:text-indigo-600 transition">
                  🔐 Session Details
                </summary>
                <div className="mt-3 space-y-1">
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
