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
  TrendingUp, Activity, MoreHorizontal, ArrowRight, Sparkles, Clock, Calendar, RefreshCw
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

  const getImageUrl = (img) => {
    if (!img || String(img).trim() === '') return null;
    const s = String(img);
    if (s.startsWith('http')) return s;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${s.startsWith('/') ? s.slice(1) : s}`;
  };

  const profileSrc = getImageUrl(teacher?.profileImage);
  const teacherName = teacher?.name || userInfo?.name || 'Educator';
  const firstName = teacherName.split(' ')[0];
  const isLoading = dashboardLoading;
  const hasError = dashboardError || !teacherDashboard;

  if (isLoading && !teacherDashboard) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <RefreshCw className="animate-spin text-slate-100" size={64} />
            <div className="absolute inset-0 grid place-items-center">
              <div className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse" />
            </div>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden isolate">
      {/* Legendary Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 45, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-200/30 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [45, 0, 45],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-200/30 blur-[120px] rounded-full"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-8 lg:p-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto w-full mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[2rem] bg-slate-900 grid place-items-center shadow-2xl shadow-slate-200 relative overflow-hidden group">
                  {profileSrc ? (
                    <img src={profileSrc} alt={teacherName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <Activity className="text-white" size={28} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                    Welcome, {firstName}
                  </h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Insights & Activity • Teacher Portal</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="px-8 py-4 bg-white border border-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-lg shadow-slate-100">
                Edit Schedule
              </button>
              <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-2xl shadow-slate-200">
                Create Post
              </button>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto w-full">

          {/* Stats Grid */}
          <motion.div
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
          >
            {/* Earnings Card */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500">
              <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                <CreditCard size={120} className="text-indigo-600" />
              </div>
              <div className="relative z-10">
                <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">Earnings</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                  <CountUp to={monthlyEarnings} prefix={'৳'} />
                </h3>
                <div className="mt-6 flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50/50 w-fit px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-100/50">
                  <TrendingUp size={12} className="mr-2" /> +12% VS LAST MONTH
                </div>
              </div>
            </motion.div>

            {/* Sessions Card */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500">
              <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                <Clock size={120} className="text-blue-600" />
              </div>
              <div className="relative z-10">
                <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">Sessions</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                  <CountUp to={totalSessions} />
                </h3>
                <div className="mt-6 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 w-fit px-3 py-1.5 rounded-xl border border-slate-100/50">
                  Completed this month
                </div>
              </div>
            </motion.div>

            {/* Students Card */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-500">
              <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                <Users size={120} className="text-purple-600" />
              </div>
              <div className="relative z-10">
                <p className="text-purple-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">Network</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                  <CountUp to={studentStats.taught} />
                </h3>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 w-fit px-3 py-1.5 rounded-xl border border-slate-100/50">
                  <span className="text-purple-600">{studentStats.repeat}</span> Repeat students
                </div>
              </div>
            </motion.div>

            {/* Rating Card */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500">
              <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                <Star size={120} className="text-amber-500" />
              </div>
              <div className="relative z-10">
                <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">Reputation</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                  {studentStats.rating?.toFixed(1) || '0.0'} <Star size={28} className="text-amber-400 fill-amber-400" />
                </h3>
                <div className="mt-6 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 w-fit px-3 py-1.5 rounded-xl border border-slate-100/50">
                  {studentStats.reviews} Total Reviews
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Profile & quick info */}
            <div className="lg:col-span-1 space-y-6">
              <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] p-10 border border-white shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                <div className="flex flex-col items-center text-center">
                  <div className="relative group/avatar mb-8">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-2xl shadow-indigo-200/50 group-hover/avatar:scale-105 transition-transform duration-500">
                      <img
                        src={profileSrc || '/default-avatar.png'}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover border-4 border-white"
                      />
                    </div>
                    <button
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="absolute bottom-2 right-2 bg-slate-900 text-white p-2.5 rounded-2xl shadow-xl opacity-0 group-hover/avatar:opacity-100 transition-all transform hover:scale-110 active:scale-90"
                    >
                      <ImageIcon size={16} />
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

                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2 mb-1">
                    {teacherName}
                    {teacher.isEligible && <ShieldCheck size={20} className="text-indigo-600" />}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{teacher.role || 'Professional Educator'}</p>

                  <div className="w-full grid grid-cols-2 gap-4 mb-8">
                    <div className={`p-4 rounded-[2rem] border border-white shadow-sm ${teacher.isEligible ? 'bg-indigo-50/50 text-indigo-700' : 'bg-rose-50/50 text-rose-700'}`}>
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Status</div>
                      <div className="font-black text-xs uppercase tracking-tight">
                        {teacher.isEligible ? 'Verified' : 'Pending'}
                      </div>
                    </div>
                    <div className={`p-4 rounded-[2rem] border border-white shadow-sm ${teacher.hasPaid ? 'bg-emerald-50/50 text-emerald-700' : 'bg-amber-50/50 text-amber-700'}`}>
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Billing</div>
                      <div className="font-black text-xs uppercase tracking-tight">
                        {teacher.hasPaid ? 'Active' : 'Awaiting'}
                      </div>
                    </div>
                  </div>

                  {!teacher.isEligible && (
                    <button
                      onClick={handleMakeEligible}
                      className="w-full py-5 rounded-[2rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-2xl shadow-slate-200"
                    >
                      Verify Account
                    </button>
                  )}
                </div>
              </section>

              {/* Commission Info */}
              <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <CreditCard size={200} />
                </div>
                <div className="relative z-10">
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-indigo-200 mb-6 flex items-center gap-2">
                    <Sparkles size={14} /> Service metrics
                  </h3>
                  <p className="text-sm font-bold text-white mb-2">Platform Contribution</p>
                  <div className="text-4xl font-black tracking-tighter mb-8">
                    ৳ {Number(commissionPaid || 0).toLocaleString()}
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 flex items-center gap-2">
                    Synced with billing cycles
                  </p>
                </div>
              </section>
            </div>

            {/* Right Column: Feeds & Lists */}
            <div className="lg:col-span-2 space-y-6">

              {/* Recent Activity */}
              <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden group">
                <div className="p-8 border-b border-white flex justify-between items-center bg-slate-50/30">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                    <BookOpen size={16} className="text-indigo-600" /> Recent History
                  </h3>
                  <button className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
                    <MoreHorizontal size={18} className="text-slate-400" />
                  </button>
                </div>
                <div className="p-8">
                  <ViewedPostsTimeline />
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upcoming Sessions */}
                <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[400px]">
                  <div className="p-8 border-b border-white bg-slate-50/30">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                      <Clock size={16} className="text-blue-600" /> Scheduled
                    </h3>
                  </div>
                  <div className="p-8 flex-1">
                    {upcomingSessions.length ? (
                      <div className="space-y-4">
                        {upcomingSessions.map((session, i) => (
                          <div key={i} className="flex items-center gap-5 p-5 bg-white rounded-[2rem] border border-white hover:shadow-xl transition-all group/session">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center font-black text-slate-400 shadow-sm text-[10px] group-hover/session:bg-indigo-600 group-hover/session:text-white transition-colors duration-500 shrink-0">
                              <div className="opacity-60">{session.date?.split(' ')[1] || '---'}</div>
                              <div className="text-lg leading-none mt-0.5">{session.date?.split(' ')[0] || '--'}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-900 text-sm truncate tracking-tight uppercase group-hover/session:text-indigo-600 transition-colors">{session.title}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                <Clock size={10} /> {session.time}
                              </p>
                            </div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <Clock size={40} className="text-slate-200 mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quiet day today</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Requests */}
                <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[400px]">
                  <div className="p-8 border-b border-white bg-slate-50/30">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                      <MailCheck size={16} className="text-purple-600" /> Requests
                    </h3>
                  </div>
                  <div className="p-8 flex-1">
                    {sessionRequests.length ? (
                      <div className="space-y-4">
                        {sessionRequests.map((request, i) => (
                          <div key={i} className="group/req p-6 bg-white hover:bg-slate-50 rounded-[2rem] border border-white hover:shadow-2xl transition-all duration-500">
                            <div className="flex justify-between items-start mb-4">
                              <div className="min-w-0">
                                <h4 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{request.studentName}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{request.topic}</p>
                              </div>
                              <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm shrink-0">{request.status}</span>
                            </div>
                            <button className="w-full py-3.5 rounded-2xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/req:opacity-100 transform translate-y-2 group-hover/req:translate-y-0 transition-all shadow-xl shadow-slate-200">
                              Review Proposal
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <MailCheck size={40} className="text-slate-200 mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inbox is clear</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
