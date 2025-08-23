'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { uploadProfilePicture, getTeacherDashboard } from './../../redux/userSlice';

import ViewedPostsTimeline from './ViewedPostsTimeline';
import { fetchPostViewEvents } from '../../redux/postViewEventSlice';
import {
  ImageIcon,
  ShieldCheck,
  ShieldOff,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Users,
  Star,
  BookOpen,
  CalendarClock,
  MailCheck,
} from 'lucide-react';

export default function TeacherDashboardInner() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  const { isFetched, isAuthenticated, teacherDashboard, dashboardLoading, dashboardError } =
    useSelector((state) => state.user);
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (userInfo && userInfo._id) {
      dispatch(fetchPostViewEvents(userInfo._id));
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (isFetched && !isAuthenticated) {
      router.push('/login');
    }
  }, [isFetched, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && !teacherDashboard && !dashboardLoading && !dashboardError) {
      dispatch(getTeacherDashboard());
    }
  }, [dispatch, isAuthenticated, teacherDashboard, dashboardLoading, dashboardError]);

  const handleImageClick = () => fileInputRef.current && fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // use redux thunk so cookies/response handling stay centralized
    dispatch(uploadProfilePicture(file));
  };

  if (dashboardLoading)
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-500 animate-pulse">
        Loading your dashboard...
      </div>
    );

  if (dashboardError || !teacherDashboard)
    return (
      <div className="max-w-xl mx-auto p-6 text-red-700 bg-red-50 border border-red-100 rounded-2xl shadow-sm">
        <h2 className="font-semibold text-xl mb-2">Unable to load dashboard</h2>
        <p className="text-sm">Please try refreshing or check your internet connection.</p>
      </div>
    );

  const teacher = teacherDashboard.teacher || {};
  const upcomingSessions = teacherDashboard.upcomingSessions || [];
  const sessionRequests = teacherDashboard.sessionRequests || [];

  const paymentSummary = {
    monthlyEarnings: 45000,
    totalSessions: 18,
    commissionPaid: 4500,
  };

  const studentStats = {
    taught: 12,
    repeat: 5,
    rating: 4.7,
    reviews: 32,
  };

  const profileSrc =
    teacher && teacher.profileImage
      ? (String(teacher.profileImage).startsWith('http')
          ? teacher.profileImage
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${teacher.profileImage}`)
      : '/default-avatar.png';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
          {/* Payment Summary */}
          <div className="bg-white/95 relative rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Payment Summary</h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-700 text-sm">
                Monthly Earnings:
                <span className="block text-xl font-bold text-gray-900">
                  PKR {paymentSummary.monthlyEarnings.toLocaleString()}
                </span>
              </p>
              <p className="text-gray-700 text-sm">
                Total Sessions:
                <span className="block text-lg font-semibold text-indigo-700">
                  {paymentSummary.totalSessions}
                </span>
              </p>
              <p className="text-gray-700 text-sm">
                Commission Paid:
                <span className="block text-lg font-semibold text-red-600">
                  PKR {paymentSummary.commissionPaid.toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          {/* Student Stats */}
          <div className="bg-white/95 relative rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Student Stats</h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-700 text-sm">
                Students Taught:
                <span className="block text-xl font-bold text-gray-900">{studentStats.taught}</span>
              </p>
              <p className="text-gray-700 text-sm">
                Repeat Students:
                <span className="block text-lg font-semibold text-indigo-700">{studentStats.repeat}</span>
              </p>
              <p className="text-gray-700 text-sm flex items-center gap-1">
                Rating:
                <span className="block text-lg font-semibold text-yellow-600 flex items-center gap-1">
                  {studentStats.rating}
                  <Star className="w-4 h-4 text-yellow-500" />
                </span>
              </p>
              <p className="text-gray-700 text-sm">
                Reviews:
                <span className="block text-lg font-semibold text-gray-900">{studentStats.reviews}</span>
              </p>
            </div>
          </div>
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 space-y-8">
          {/* Profile Section */}
          <section className="bg-white/95 p-6 flex flex-col sm:flex-row items-center gap-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36">
              {/* Circular Profile Image */}
              <div className="w-full h-full rounded-full overflow-hidden shadow-md ring-2 ring-indigo-500/60">
                <img src={profileSrc} alt="Profile" className="w-full h-full object-cover" />
              </div>

              {/* Floating edit button */}
              <button
                onClick={handleImageClick}
                className="absolute bottom-1.5 right-1.5 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
                title="Change Profile Picture"
                aria-label="Change Profile Picture"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex flex-col justify-center flex-grow min-w-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {teacher.name || 'Teacher'}
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 text-xs font-medium">
                  Verified teacher
                </span>
              </h1>

              {/* Ratings & Reviews */}
              <p className="text-gray-600 text-sm flex items-center justify-center sm:justify-start gap-2 mt-1">
                <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                  {studentStats.rating} <Star className="w-4 h-4" />
                </span>
                <span className="text-gray-500">({studentStats.reviews} reviews)</span>
              </p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 font-medium text-xs rounded-full border border-indigo-100">
                  Role: {teacher.role || '—'}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
                    teacher.isEligible
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}
                >
                  {teacher.isEligible ? (
                    <ShieldCheck className="w-4 h-4 mr-1" />
                  ) : (
                    <ShieldOff className="w-4 h-4 mr-1" />
                  )}
                  {teacher.isEligible ? 'Eligible' : 'Not Eligible'}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
                    teacher.hasPaid
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {teacher.hasPaid ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-1" />
                  )}
                  {teacher.hasPaid ? 'Paid' : 'Not Paid'}
                </span>
              </div>
            </div>
          </section>

          {/* Recently Viewed Posts */}
          <section className="bg-white/95 rounded-3xl border border-gray-100 shadow-sm ">
            {/* Header aligned with inner content */}
            <div className="px-6 pt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">Recently Viewed Posts</span>
              </div>
            </div>
            {/* Body with same gutter */}
            <div className="p-6">
              <ViewedPostsTimeline />
            </div>
          </section>

          {/* Upcoming Sessions & Requests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="bg-white/95 rounded-3xl border border-gray-100 shadow-sm">
              <div className="px-6 pt-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100">
                  <CalendarClock className="w-4 h-4" />
                  <span className="text-sm font-medium">Upcoming Sessions</span>
                </div>
              </div>

              <div className="p-6">
                {upcomingSessions.length ? (
                  upcomingSessions.map((session, i) => (
                    <div
                      key={i}
                      className="p-3 mb-2 border border-gray-100 rounded-lg transition hover:bg-indigo-50/50 hover:border-indigo-200"
                    >
                      <h3 className="text-gray-900 font-medium truncate">{session.title}</h3>
                      <p className="text-gray-500 text-sm">{session.date}</p>
                      <p className="text-gray-500 text-sm">{session.time}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">No upcoming sessions scheduled.</p>
                )}
              </div>
            </section>

            <section className="bg-white/95 rounded-3xl border border-gray-100 shadow-sm">
              <div className="px-6 pt-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100">
                  <MailCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Session Requests</span>
                </div>
              </div>

              <div className="p-6">
                {sessionRequests.length ? (
                  sessionRequests.map((request, i) => (
                    <div
                      key={i}
                      className="p-3 mb-2 border border-gray-100 rounded-lg transition hover:bg-indigo-50/60 hover:border-indigo-200"
                    >
                      <h3 className="text-gray-900 font-medium truncate">{request.studentName}</h3>
                      <p className="text-gray-500 text-sm truncate">{request.topic}</p>
                      <p className="text-gray-500 text-sm truncate">{request.status}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">No session requests at the moment.</p>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
