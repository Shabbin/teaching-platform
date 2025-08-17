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
      {/* Soft background, no pure white glare */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="p-6 max-w-6xl mx-auto space-y-8">
          {/* Loading/Error */}
          {loading && (
            <p className="text-gray-500 text-center animate-pulse">
              Loading your dashboard...
            </p>
          )}
          {error && <p className="text-red-600 text-center">{error}</p>}

          {/* Dashboard content */}
          {studentDashboard && (
            <>
              {/* Welcome Section */}
              <div className="bg-white/95 backdrop-blur-sm p-6 flex items-center gap-5 rounded-3xl border border-gray-100 shadow-sm">
                <Image
                  src={studentDashboard.student?.profileImage || '/default-avatar.png'}
                  alt="Student Profile"
                  width={72}
                  height={72}
                  className="rounded-full object-cover ring-2 ring-indigo-500/60"
                />
                <div>
                  {/* Neutral heading with branded emphasis on the name */}
                 <h1 className="text-2xl font-bold text-gray-900">
  Welcome, {studentDashboard.student?.name || 'Student'}!
</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {studentDashboard.student?.email}
                  </p>
                </div>
              </div>

              {/* Quick Links Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* View Teachers */}
                <Link href="/dashboard/student/teachers">
                  <div
                    className="group bg-white/95 p-6 rounded-3xl text-center cursor-pointer border border-gray-100 shadow-sm transition
                               hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <div className="inline-flex items-center gap-2 mx-auto mb-3 px-3 py-1 rounded-full
                                    text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100">
                      <span className="text-base">👩‍🏫</span>
                      <span className="text-sm font-medium">Teachers</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">View Teachers</h3>
                    <p className="text-gray-600 text-sm mt-2">
                      Browse available and eligible teachers
                    </p>
                  </div>
                </Link>

                {/* My Requests */}
                <Link href="/student/requests">
                  <div
                    className="group bg-white/95 p-6 rounded-3xl text-center cursor-pointer border border-gray-100 shadow-sm transition
                               hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <div className="inline-flex items-center gap-2 mx-auto mb-3 px-3 py-1 rounded-full
                                    text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100">
                      <span className="text-base">📨</span>
                      <span className="text-sm font-medium">Requests</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">My Requests</h3>
                    <p className="text-gray-600 text-sm mt-2">
                      See your tuition help or session requests
                    </p>
                  </div>
                </Link>

                {/* Account Settings */}
                <Link href="/student/settings">
                  <div
                    className="group bg-white/95 p-6 rounded-3xl text-center cursor-pointer border border-gray-100 shadow-sm transition
                               hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <div className="inline-flex items-center gap-2 mx-auto mb-3 px-3 py-1 rounded-full
                                    text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100">
                      <span className="text-base">⚙️</span>
                      <span className="text-sm font-medium">Settings</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                    <p className="text-gray-600 text-sm mt-2">
                      Update your profile or preferences
                    </p>
                  </div>
                </Link>
              </div>

              {/* Token / Session Info */}
              <details className="mt-6 bg-white/95 p-5 rounded-2xl shadow-sm border border-gray-100 text-sm text-gray-700 open:shadow-md">
                <summary className="cursor-pointer font-semibold text-gray-900 hover:text-indigo-700 transition">
                  🔐 Session Details
                </summary>
                <div className="mt-3 space-y-1">
                  <p>
                    <span className="font-medium">User ID:</span>{' '}
                    {studentDashboard.user?.id}
                  </p>
                  <p>
                    <span className="font-medium">Role:</span>{' '}
                    {studentDashboard.user?.role}
                  </p>
                  <p>
                    <span className="font-medium">Issued At:</span>{' '}
                    {studentDashboard.user?.iat
                      ? new Date(studentDashboard.user.iat * 1000).toLocaleString()
                      : '—'}
                  </p>
                  <p>
                    <span className="font-medium">Expires At:</span>{' '}
                    {studentDashboard.user?.exp
                      ? new Date(studentDashboard.user.exp * 1000).toLocaleString()
                      : '—'}
                  </p>
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
