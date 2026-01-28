'use client';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { uploadProfilePicture, getTeacherDashboard } from './../../redux/userSlice';
import API from '../../../api/axios';

import ViewedPostsTimeline from './ViewedPostsTimeline';
import { fetchPostViewEvents } from '../../redux/postViewEventSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon, ShieldCheck, ShieldOff, CheckCircle, AlertCircle,
  CreditCard, Users, Star, BookOpen, CalendarClock, MailCheck,
  TrendingUp, Activity, MoreHorizontal, ArrowRight
} from 'lucide-react';
import { getTeacherSummary } from '../../../api/payments';

// Animated Counter Component
const CountUp = ({ to, prefix = '' }) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="tabular-nums"
    >
      {prefix}
      {typeof to === 'number' ? to.toLocaleString() : to}
    </motion.span>
  );
};

export default function TeacherDashboardInner() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  const {
    isFetched,
    isAuthenticated,
    teacherDashboard,
    dashboardLoading,
    dashboardError,
  } = useSelector((state) => state.user);
  const { userInfo } = useSelector((state) => state.user);

  const [fallbackPayments, setFallbackPayments] = useState(null);

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

  useEffect(() => {
    const hasAnyPayments =
      (Array.isArray(teacherDashboard?.payments) && teacherDashboard.payments.length > 0) ||
      (Array.isArray(teacherDashboard?.paymentHistory) && teacherDashboard.paymentHistory.length > 0);

    if (isAuthenticated && teacherDashboard && !hasAnyPayments && fallbackPayments === null) {
      getTeacherSummary()
        .then((res) => setFallbackPayments(res?.payments || []))
        .catch(() => setFallbackPayments([]));
    }
  }, [isAuthenticated, teacherDashboard, fallbackPayments]);

  const handleMakeEligible = async () => {
    if (!teacher._id) return;
    try {
      await API.patch(`/teachers/approve/${teacher._id}`);
      dispatch(getTeacherDashboard());
    } catch (err) {
      console.error('Failed to approve teacher', err.response?.data || err.message);
    }
  };

  const teacher = teacherDashboard?.teacher || {};
  const upcomingSessions = teacherDashboard?.upcomingSessions || [];
  const sessionRequests = teacherDashboard?.sessionRequests || [];

  const { monthlyEarnings, commissionPaid, totalSessions } = useMemo(() => {
    const paymentsRaw =
      (Array.isArray(teacherDashboard?.payments) && teacherDashboard.payments) ||
      (Array.isArray(teacherDashboard?.paymentHistory) && teacherDashboard.paymentHistory) ||
      (Array.isArray(fallbackPayments) && fallbackPayments) || [];

    const schedulesRaw = (Array.isArray(teacherDashboard?.schedules) && teacherDashboard.schedules) || [];

    const now = new Date();
    const sameMonth = (d) => {
      const dd = new Date(d);
      return !isNaN(dd) && dd.getFullYear() === now.getFullYear() && dd.getMonth() === now.getMonth();
    };

    const monthPayments = paymentsRaw.filter((p) => sameMonth(p.createdAt || p.paidAt || p.updatedAt));
    const sum = (arr, fn) => arr.reduce((acc, x) => acc + (Number(fn(x)) || 0), 0);

    const earnedThisMonth = sum(monthPayments, (p) => {
      if (typeof p.teacherShare === 'number') return p.teacherShare;
      const amt = Number(p.amount) || 0;
      const rate = typeof p.commissionRate === 'number' ? p.commissionRate : 0;
      return amt - amt * rate;
    });

    const commissionThisMonth = sum(monthPayments, (p) => {
      if (typeof p.yourShare === 'number') return p.yourShare;
      const amt = Number(p.amount) || 0;
      const rate = typeof p.commissionRate === 'number' ? p.commissionRate : 0;
      return amt * rate;
    });

    const sessionsThisMonth = schedulesRaw.filter((s) => {
      const d = s?.date || s?.createdAt;
      if (!d) return false;
      const ok = sameMonth(d);
      if (!ok) return false;
      return s.status !== 'cancelled';
    }).length;

    return {
      monthlyEarnings: Math.round(earnedThisMonth),
      commissionPaid: Math.round(commissionThisMonth),
      totalSessions: sessionsThisMonth,
    };
  }, [teacherDashboard, fallbackPayments]);

  const studentStats = useMemo(() => {
    const schedulesRaw = (Array.isArray(teacherDashboard?.schedules) && teacherDashboard.schedules) || [];
    const counts = new Map();
    schedulesRaw.forEach((s) => {
      const ids = Array.isArray(s.studentIds) ? s.studentIds : [];
      ids.forEach((id) => {
        const key = String(id?._id || id);
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    const taught = counts.size;
    const repeat = Array.from(counts.values()).filter((n) => n > 1).length;
    const rating = Number(teacher.avgRating ?? teacher.rating ?? 0) || 0;
    const reviews = Number(teacher.reviewsCount ?? teacher.ratingCount ?? teacher.totalReviews ?? 0) || 0;

    return { taught, repeat, rating, reviews };
  }, [teacherDashboard, teacher]);

  const profileSrc = teacher && teacher.profileImage
    ? (String(teacher.profileImage).startsWith('http') ? teacher.profileImage : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${teacher.profileImage}`)
    : '/default-avatar.png';

  const currencyPrefix = teacherDashboard?.currencySymbol || '৳';
  const isLoading = dashboardLoading;
  const hasError = dashboardError || !teacherDashboard;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

      {/* Top Banner / Welcome Area */}
      <div className="bg-slate-900 text-white pb-32 pt-12 rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/30 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wider text-xs mb-2"
            >
              <Activity size={14} /> Teacher Dashboard
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-2"
            >
              Welcome back, {teacher.name?.split(' ')[0] || 'Teacher'}
            </motion.h1>
            <p className="text-slate-400">Here's what's happening with your students today.</p>
          </div>

          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl font-semibold hover:bg-white/20 transition-all">
              Edit Schedule
            </button>
            <button className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all">
              Create Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Earnings Card */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CreditCard size={80} className="text-indigo-600" />
            </div>
            <div className="relative z-10">
              <p className="text-indigo-600 font-bold text-sm uppercase tracking-wide mb-1">Monthly Earnings</p>
              <h3 className="text-3xl font-bold text-slate-800">
                <CountUp to={monthlyEarnings} prefix={currencyPrefix + ' '} />
              </h3>
              <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                <TrendingUp size={12} className="mr-1" /> +12% vs last month
              </div>
            </div>
          </motion.div>

          {/* Sessions Card */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CalendarClock size={80} className="text-blue-600" />
            </div>
            <div className="relative z-10">
              <p className="text-blue-600 font-bold text-sm uppercase tracking-wide mb-1">Total Sessions</p>
              <h3 className="text-3xl font-bold text-slate-800">
                <CountUp to={totalSessions} />
              </h3>
              <p className="text-slate-400 text-xs mt-4">Completed this month</p>
            </div>
          </motion.div>

          {/* Students Card */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={80} className="text-purple-600" />
            </div>
            <div className="relative z-10">
              <p className="text-purple-600 font-bold text-sm uppercase tracking-wide mb-1">Active Students</p>
              <h3 className="text-3xl font-bold text-slate-800">
                <CountUp to={studentStats.taught} />
              </h3>
              <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
                <span className="font-bold text-purple-600">{studentStats.repeat}</span> returning students
              </div>
            </div>
          </motion.div>

          {/* Rating Card */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Star size={80} className="text-amber-500" />
            </div>
            <div className="relative z-10">
              <p className="text-amber-600 font-bold text-sm uppercase tracking-wide mb-1">Reputation</p>
              <h3 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                {studentStats.rating?.toFixed(1) || '0.0'} <Star size={24} className="text-amber-400 fill-amber-400" />
              </h3>
              <p className="text-slate-400 text-xs mt-4">{studentStats.reviews} total reviews</p>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Profile & quick info */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 mb-4">
                    <img
                      src={profileSrc}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border-4 border-white"
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="absolute bottom-4 right-2 bg-slate-900 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                  >
                    <ImageIcon size={14} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) dispatch(uploadProfilePicture(file));
                    }}
                  />
                </div>

                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {teacher.name}
                  {teacher.isEligible && <ShieldCheck size={18} className="text-indigo-500" />}
                </h2>
                <p className="text-slate-500 text-sm mb-6">{teacher.role || 'Educator'}</p>

                <div className="w-full grid grid-cols-2 gap-3 mb-6">
                  <div className={`p-3 rounded-2xl border text-center ${teacher.isEligible ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <div className="text-xs font-bold uppercase mb-1">Status</div>
                    <div className="font-bold text-sm flex items-center justify-center gap-1">
                      {teacher.isEligible ? 'Verified' : 'Pending'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl border text-center ${teacher.hasPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                    <div className="text-xs font-bold uppercase mb-1">Payment</div>
                    <div className="font-bold text-sm flex items-center justify-center gap-1">
                      {teacher.hasPaid ? 'Active' : 'Unpaid'}
                    </div>
                  </div>
                </div>

                {!teacher.isEligible && (
                  <button
                    onClick={handleMakeEligible}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Request Verification
                  </button>
                )}
              </div>
            </section>

            {/* Commission Info (Mini) */}
            <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CreditCard size={100} />
              </div>
              <h3 className="font-bold text-lg mb-1">Commission Paid</h3>
              <p className="text-indigo-200 text-sm mb-4">Total platform fees deducted</p>
              <div className="text-3xl font-bold mb-2">
                {currencyPrefix} {Number(commissionPaid || 0).toLocaleString()}
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 w-3/4 rounded-full"></div>
              </div>
            </section>
          </div>

          {/* Right Column: Feeds & Lists */}
          <div className="lg:col-span-2 space-y-6">

            {/* Recent Activity */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-500" /> Recent Activity
                </h3>
                <button className="p-2 hover:bg-white rounded-full transition-colors">
                  <MoreHorizontal size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6">
                {/* Assuming Timeline is styled, wrapping it */}
                <ViewedPostsTimeline />
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <CalendarClock size={18} className="text-blue-500" /> Scheduled
                  </h3>
                </div>
                <div className="p-4 flex-1">
                  {upcomingSessions.length ? (
                    <div className="space-y-3">
                      {upcomingSessions.map((session, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-slate-700 shadow-sm text-xs">
                            {session.date.split(' ')[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{session.title}</h4>
                            <p className="text-xs text-slate-500">{session.time}</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-60">
                      <CalendarClock size={40} className="text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">No upcoming sessions</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Requests */}
              <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <MailCheck size={18} className="text-purple-500" /> New Requests
                  </h3>
                </div>
                <div className="p-4 flex-1">
                  {sessionRequests.length ? (
                    <div className="space-y-3">
                      {sessionRequests.map((request, i) => (
                        <div key={i} className="group p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{request.studentName}</h4>
                              <p className="text-xs text-slate-500">{request.topic}</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{request.status}</span>
                          </div>
                          <button className="w-full mt-2 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            Review Request
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-60">
                      <MailCheck size={40} className="text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">No pending requests</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
