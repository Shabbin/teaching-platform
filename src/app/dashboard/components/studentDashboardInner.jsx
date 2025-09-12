'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentDashboard, uploadProfilePicture } from '../../redux/userSlice';

import ProtectedRoute from '../../components/auth/protectedRoute';
// ❌ remove next/image to avoid domain config hassles
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { studentDashboard, loading, error, userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (!studentDashboard) {
      dispatch(getStudentDashboard());
    }
  }, [dispatch, studentDashboard]);

  // ---------- derived, safe-to-miss data ----------
  const {
    upcomingSessions,
    pastSessions,
    openRequests,
    walletBalance,
    monthSpend,
    teachersBooked,
    repeatTeachers,
    avgRatingGiven,
    reviewsCount,
  } = useMemo(() => {
    const upcoming =
      studentDashboard?.bookings?.upcoming ||
      studentDashboard?.upcomingSessions ||
      [];

    const history =
      studentDashboard?.bookings?.history ||
      studentDashboard?.pastSessions ||
      [];

    const requestsOpen =
      studentDashboard?.requests?.open ||
      studentDashboard?.openRequests ||
      [];

    const balance =
      studentDashboard?.wallet?.balance ??
      studentDashboard?.billing?.walletBalance ??
      0;

    // Monthly spend from history (best-effort)
    let spend = 0;
    try {
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      spend = history
        .filter((s) => {
          const dt = new Date(s?.date || s?.startTime || s?.createdAt || 0);
          return dt.getMonth() === m && dt.getFullYear() === y;
        })
        .reduce((sum, s) => {
          const cost = Number(
            s?.price ??
              s?.cost ??
              s?.amount ??
              (s?.billing && s?.billing.total) ??
              0
          );
          return sum + (isNaN(cost) ? 0 : cost);
        }, 0);
    } catch (_) {
      // ignore
    }

    // Teacher stats
    const teacherIds = {};
    (history || []).forEach((s) => {
      const id = s?.teacher?.id ?? s?.teacherId ?? s?.tutorId;
      if (!id) return;
      teacherIds[id] = (teacherIds[id] || 0) + 1;
    });

    const uniqueTeachers = Object.keys(teacherIds).length;
    const repeats = Object.values(teacherIds).filter((n) => n > 1).length;

    // Ratings & reviews given by student (best-effort)
    const ratings = (history || [])
      .map((s) => s?.ratingByStudent ?? s?.rating)
      .filter((n) => typeof n === 'number');
    const avgRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10
          ) / 10
        : null;

    const reviews =
      (history || []).filter(
        (s) => (s?.reviewByStudent || s?.review)?.length > 0
      ).length || 0;

    return {
      upcomingSessions: Array.isArray(upcoming) ? upcoming : [],
      pastSessions: Array.isArray(history) ? history : [],
      openRequests: Array.isArray(requestsOpen) ? requestsOpen : [],
      walletBalance: typeof balance === 'number' ? balance : 0,
      monthSpend: typeof spend === 'number' ? spend : 0,
      teachersBooked: uniqueTeachers,
      repeatTeachers: repeats,
      avgRatingGiven: avgRating,
      reviewsCount: reviews,
    };
  }, [studentDashboard]);

  const fmtPKR = (n) => {
    try {
      return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
      }).format(n || 0);
    } catch {
      return `PKR ${Number(n || 0).toLocaleString()}`;
    }
  };

  // ---------- profile image (mirror teacher) ----------
  const rawProfile =
    userInfo?.profileImage || studentDashboard?.student?.profileImage || '';

  const profileSrc =
    !rawProfile || rawProfile.trim() === ''
      ? '/default-avatar.png'
      : rawProfile.startsWith('http')
      ? rawProfile
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${rawProfile}`;

  return (
    <ProtectedRoute allowedRole="student">
      {/* Match teacher dashboard vibe */}
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl p-6 space-y-6">
          {/* Loading/Error */}
          {loading && (
            <p className="text-center text-gray-500 animate-pulse">
              Loading your dashboard...
            </p>
          )}
          {error && <p className="text-center text-red-600">{error}</p>}

          {/* Content */}
          {studentDashboard && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* LEFT RAIL — mimics teacher cards */}
              <aside className="space-y-6 lg:col-span-3">
                {/* Card: Learning Summary */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2 bg-indigo-600 px-4 py-3 text-white">
                    <span className="text-lg">📘</span>
                    <h3 className="text-base font-semibold">Learning Summary</h3>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Monthly Spend</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {fmtPKR(monthSpend)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Upcoming Sessions</p>
                      <p className="mt-1 text-xl font-semibold text-gray-900">
                        {upcomingSessions.length}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Open Requests</p>
                      <p className="mt-1 text-xl font-semibold text-gray-900">
                        {openRequests.length}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Wallet Balance</p>
                      <p className="mt-1 text-xl font-semibold text-gray-900">
                        {fmtPKR(walletBalance)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card: Student Stats */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2 bg-indigo-600 px-4 py-3 text-white">
                    <span className="text-lg">🧮</span>
                    <h3 className="text-base font-semibold">Student Stats</h3>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Teachers Booked</span>
                      <span className="font-semibold text-gray-900">
                        {teachersBooked}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Repeat Teachers</span>
                      <span className="font-semibold text-gray-900">
                        {repeatTeachers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Avg. Rating Given</span>
                      <span className="font-semibold text-gray-900">
                        {avgRatingGiven ? `${avgRatingGiven} ⭐` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Reviews</span>
                      <span className="font-semibold text-gray-900">
                        {reviewsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* RIGHT — profile & panels (keeps your original structure) */}
              <main className="space-y-6 lg:col-span-9">
                {/* Welcome / Profile */}
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                      <div className="w-full h-full rounded-full overflow-hidden object-cover ring-2 ring-indigo-600/40 shadow">
                        <img
                          src={profileSrc}
                          alt="Student Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* 🆕 same change button as teacher */}
                      <button
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className="absolute bottom-1.5 right-1.5 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        title="Change Profile Picture"
                        aria-label="Change Profile Picture"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>

                      {/* hidden input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) dispatch(uploadProfilePicture(file));
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {`Welcome, ${studentDashboard.student?.name || 'Student'}!`}
                      </h1>
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {studentDashboard.student?.email}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                          Student
                        </span>
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                          Eligible
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Link href="/dashboard/student/teachers">
                    <div className="cursor-pointer rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200">
                      <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-white">
                        <span>👩‍🏫</span>
                        <span className="text-xs font-semibold uppercase">
                          Teachers
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        View Teachers
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Browse available and eligible teachers
                      </p>
                    </div>
                  </Link>

                  <Link href="/student/requests">
                    <div className="cursor-pointer rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200">
                      <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-white">
                        <span>📨</span>
                        <span className="text-xs font-semibold uppercase">
                          Requests
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        My Requests
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        See your tuition help or session requests
                      </p>
                    </div>
                  </Link>

                  <Link href="/student/settings">
                    <div className="cursor-pointer rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200">
                      <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-white">
                        <span>⚙️</span>
                        <span className="text-xs font-semibold uppercase">
                          Settings
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Account Settings
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Update your profile or preferences
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Recently Viewed */}
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 ring-1 ring-indigo-100">
                    <span>🗂️</span>
                    <span className="text-sm font-medium">Recently Viewed</span>
                  </div>
                  <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-600">
                    {studentDashboard?.recentlyViewed?.length ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {studentDashboard.recentlyViewed.slice(0, 6).map((t) => (
                          <div
                            key={t?.id || t?.teacherId}
                            className="rounded-xl border p-3 text-left"
                          >
                            <p className="font-medium text-gray-900">
                              {t?.name || 'Teacher'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t?.subject || '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-medium">
                        Log in and browse teachers to see them here.
                      </p>
                    )}
                  </div>
                </section>

                {/* Session / Token Info (unchanged structure) */}
                <details className="group rounded-3xl border border-gray-200 bg-white shadow-sm open:shadow-md">
                  <summary className="flex cursor-pointer items-center justify-between rounded-3xl px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-sm">
                        🔐
                      </span>
                      <span className="font-semibold text-gray-900">
                        Session Details
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 group-open:hidden">
                      Show
                    </span>
                    <span className="hidden text-sm text-gray-500 group-open:inline">
                      Hide
                    </span>
                  </summary>
                  <div className="border-t border-gray-100 px-6 py-5 text-sm text-gray-700">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-gray-900">
                          User ID:
                        </span>{' '}
                        {studentDashboard.user?.id}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Role:</span>{' '}
                        {studentDashboard.user?.role}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Issued At:
                        </span>{' '}
                        {studentDashboard.user?.iat
                          ? new Date(
                              studentDashboard.user.iat * 1000
                            ).toLocaleString()
                          : '—'}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Expires At:
                        </span>{' '}
                        {studentDashboard.user?.exp
                          ? new Date(
                              studentDashboard.user.exp * 1000
                            ).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                  </div>
                </details>
              </main>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
