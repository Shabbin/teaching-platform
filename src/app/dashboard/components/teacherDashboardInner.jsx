'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfileImage, getTeacherDashboard } from './../../redux/userSlice';

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
  const { isFetched, isAuthenticated, teacherDashboard, dashboardLoading, dashboardError } = useSelector(
    (state) => state.user
  );
  const { userInfo } = useSelector(state => state.user); 
  const postViewEventsState = useSelector(state => state.postViewEvents);

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

  const handleImageClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const res = await fetch('http://localhost:5000/api/teachers/profile-picture', {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      dispatch(updateProfileImage(data.profileImage));
    } catch (err) {
      console.error(err);
    }
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Section */}
        <section className="bg-white p-6 flex flex-col sm:flex-row items-center gap-5 rounded-3xl border border-gray-100 transition">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden cursor-pointer">
            <img
              src={
                teacher?.profileImage?.startsWith('http')
                  ? teacher.profileImage
                  : `http://localhost:5000/${teacher.profileImage}`
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleImageClick}
              className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition"
              title="Change Profile Picture"
              aria-label="Change Profile Picture"
            >
              <ImageIcon className="w-6 h-6" />
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
            <h1 className="text-2xl font-extrabold text-gray-900 truncate">{teacher.name}</h1>
            <p className="text-gray-500 text-sm mt-1 truncate">{teacher.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 font-medium text-xs rounded-full border border-gray-100">
                Role: {teacher.role}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border border-gray-100 ${
                  teacher.isEligible ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {teacher.isEligible ? <ShieldCheck className="w-4 h-4 mr-1" /> : <ShieldOff className="w-4 h-4 mr-1" />}
                {teacher.isEligible ? 'Eligible' : 'Not Eligible'}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border border-gray-100 ${
                  teacher.hasPaid ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-500'
                }`}
              >
                {teacher.hasPaid ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                {teacher.hasPaid ? 'Paid' : 'Not Paid'}
              </span>
            </div>
          </div>
        </section>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 transition">
            <h2 className="text-lg font-semibold text-indigo-600 mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Payment Summary
            </h2>
            <p className="text-gray-700 text-sm">Monthly Earnings: <span className="font-semibold">PKR {paymentSummary.monthlyEarnings.toLocaleString()}</span></p>
            <p className="text-gray-700 text-sm">Total Sessions: <span className="font-semibold">{paymentSummary.totalSessions}</span></p>
            <p className="text-gray-700 text-sm">Commission Paid: <span className="font-semibold">PKR {paymentSummary.commissionPaid.toLocaleString()}</span></p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 transition">
            <h2 className="text-lg font-semibold text-indigo-600 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" /> Student Stats
            </h2>
            <p className="text-gray-700 text-sm">Students Taught: <span className="font-semibold">{studentStats.taught}</span></p>
            <p className="text-gray-700 text-sm">Repeat Students: <span className="font-semibold">{studentStats.repeat}</span></p>
            <p className="text-gray-700 text-sm flex items-center gap-1">Rating: <span className="font-semibold flex items-center gap-1">{studentStats.rating} <Star className="w-4 h-4 text-yellow-400" /></span></p>
          </div>
        </div>

        {/* Recently Viewed Posts */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 transition">
          <h2 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Recently Viewed Posts
          </h2>
          <ViewedPostsTimeline />
        </section>

        {/* Upcoming Sessions & Requests */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-3xl border border-gray-100 transition">
            <h2 className="text-lg font-semibold text-indigo-600 mb-3 flex items-center gap-2">
              <CalendarClock className="w-5 h-5" /> Upcoming Sessions
            </h2>
            {upcomingSessions.length ? (
              upcomingSessions.map((session, i) => (
                <div key={i} className="p-3 mb-2 border border-gray-100 rounded-lg transition">
                  <h3 className="text-gray-900 font-medium truncate">{session.title}</h3>
                  <p className="text-gray-500 text-sm">{session.date}</p>
                  <p className="text-gray-500 text-sm">{session.time}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-6">No upcoming sessions scheduled.</p>
            )}
          </section>

          <section className="bg-white p-6 rounded-3xl border border-gray-100 transition">
            <h2 className="text-lg font-semibold text-indigo-600 mb-3 flex items-center gap-2">
              <MailCheck className="w-5 h-5" /> Session Requests
            </h2>
            {sessionRequests.length ? (
              sessionRequests.map((request, i) => (
                <div key={i} className="p-3 mb-2 border border-gray-100 rounded-lg transition">
                  <h3 className="text-gray-900 font-medium truncate">{request.studentName}</h3>
                  <p className="text-gray-500 text-sm truncate">{request.topic}</p>
                  <p className="text-gray-500 text-sm truncate">{request.status}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-6">No session requests at the moment.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
