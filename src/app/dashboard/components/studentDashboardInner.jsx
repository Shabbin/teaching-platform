'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentDashboard, uploadProfilePicture } from '../../redux/userSlice';
import ProtectedRoute from '../../components/auth/protectedRoute';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, ArrowRight, Settings, Users, Sparkles, BookOpen, Clock, Calendar, RefreshCw,
  Wallet, CreditCard, TrendingUp, Star, GraduationCap, Activity, ImageIcon, Mail, ShieldCheck
} from 'lucide-react';

// Animated Counter Component
const CountUp = ({ to, prefix = '', suffix = '' }) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="tabular-nums"
    >
      {prefix}
      {typeof to === 'number' ? to.toLocaleString() : to}
      {suffix}
    </motion.span>
  );
};

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { studentDashboard, loading, error, userInfo, isFetched, isAuthenticated } = useSelector((state) => state.user);

  useEffect(() => {
    if (!studentDashboard && isAuthenticated) {
      dispatch(getStudentDashboard());
    }
  }, [dispatch, studentDashboard, isAuthenticated]);

  // ---------- derived data ----------
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
    const upcoming = studentDashboard?.bookings?.upcoming || studentDashboard?.upcomingSessions || [];
    const history = studentDashboard?.bookings?.history || studentDashboard?.pastSessions || [];
    const requestsOpen = studentDashboard?.requests?.open || studentDashboard?.openRequests || [];
    const balance = studentDashboard?.wallet?.balance ?? studentDashboard?.billing?.walletBalance ?? 0;

    // Monthly spend calculation
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
          const cost = Number(s?.price ?? s?.cost ?? s?.amount ?? (s?.billing && s?.billing.total) ?? 0);
          return sum + (isNaN(cost) ? 0 : cost);
        }, 0);
    } catch (_) { }

    // Teacher stats
    const teacherIds = {};
    (history || []).forEach((s) => {
      const id = s?.teacher?.id ?? s?.teacherId ?? s?.tutorId;
      if (!id) return;
      teacherIds[id] = (teacherIds[id] || 0) + 1;
    });

    const uniqueTeachers = Object.keys(teacherIds).length;
    const repeats = Object.values(teacherIds).filter((n) => n > 1).length;

    // Ratings & reviews given
    const ratings = (history || []).map((s) => s?.ratingByStudent ?? s?.rating).filter((n) => typeof n === 'number');
    const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
    const reviews = (history || []).filter((s) => (s?.reviewByStudent || s?.review)?.length > 0).length || 0;

    return {
      upcomingSessions: Array.isArray(upcoming) ? upcoming : [],
      pastSessions: Array.isArray(history) ? history : [],
      openRequests: Array.isArray(requestsOpen) ? requestsOpen : [],
      walletBalance: Number(balance),
      monthSpend: Number(spend),
      teachersBooked: uniqueTeachers,
      repeatTeachers: repeats,
      avgRatingGiven: avgRating,
      reviewsCount: reviews,
    };
  }, [studentDashboard]);

  const getImageUrl = (img) => {
    if (!img || String(img).trim() === '') return null;
    const s = String(img);
    if (s.startsWith('http')) return s;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${s.startsWith('/') ? s.slice(1) : s}`;
  };

  const profileSrc = getImageUrl(userInfo?.profileImage || studentDashboard?.student?.profileImage);
  const studentName = studentDashboard?.student?.name || userInfo?.name || 'Learner';
  const firstName = studentName.split(' ')[0];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading && !studentDashboard) {
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
    <ProtectedRoute allowedRole="student">
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
                      <img src={profileSrc} alt={studentName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <GraduationCap className="text-white" size={28} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                      Hello, {firstName}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ready to learn today? • Student Portal</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/dashboard/student/teachers">
                  <button className="px-8 py-4 bg-white border border-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-lg shadow-slate-100">
                    Find Teachers
                  </button>
                </Link>
                <Link href="/student/requests">
                  <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-2xl shadow-slate-200">
                    Post Request
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="max-w-7xl mx-auto w-full">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 p-6 bg-rose-50/50 backdrop-blur-xl border border-rose-100 text-rose-600 rounded-[2rem] flex items-center gap-4"
              >
                <Activity size={24} />
                <p className="text-sm font-black uppercase tracking-tight">{error}</p>
              </motion.div>
            )}

            {studentDashboard && (
              <>
                {/* Stats Grid - MIRRORED FROM TEACHER */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
                >
                  {/* Wallet Card */}
                  <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500">
                    <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                      <Wallet size={120} className="text-indigo-600" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">Wallet Balance</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                        <CountUp to={walletBalance} prefix={'৳'} />
                      </h3>
                      <div className="mt-6 flex items-center text-[10px] font-black text-indigo-600 bg-indigo-50/50 w-fit px-3 py-1.5 rounded-xl uppercase tracking-widest border border-indigo-100/50">
                        Available to spend
                      </div>
                    </div>
                  </motion.div>

                  {/* Monthly Spend Card */}
                  <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-500">
                    <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                      <CreditCard size={120} className="text-purple-600" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-purple-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">This Month</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                        <CountUp to={monthSpend} prefix={'৳'} />
                      </h3>
                      <div className="mt-6 flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50/50 w-fit px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-100/50">
                        <TrendingUp size={12} className="mr-2" /> Within budget
                      </div>
                    </div>
                  </motion.div>

                  {/* Sessions Card */}
                  <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500">
                    <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                      <Clock size={120} className="text-blue-600" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">Learning activity</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                        <CountUp to={upcomingSessions.length + pastSessions.length} />
                      </h3>
                      <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 w-fit px-3 py-1.5 rounded-xl border border-slate-100/50">
                        <span className="text-blue-600">{upcomingSessions.length}</span> upcoming sessions
                      </div>
                    </div>
                  </motion.div>

                  {/* Rating Card */}
                  <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500">
                    <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                      <Star size={120} className="text-amber-500" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">Feedback given</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        {avgRatingGiven?.toFixed(1) || '0.0'} <Star size={28} className="text-amber-400 fill-amber-400" />
                      </h3>
                      <div className="mt-6 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 w-fit px-3 py-1.5 rounded-xl border border-slate-100/50">
                        {reviewsCount} Reviews written
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Main Layout - 1/3 and 2/3 - MIRRORED FROM TEACHER */}
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
                              className="w-full h-full rounded-full object-cover border-4 border-white mx-auto"
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
                          {studentName}
                          <ShieldCheck size={20} className="text-indigo-600" />
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{studentDashboard?.student?.email}</p>

                        <div className="w-full grid grid-cols-2 gap-4 mb-8">
                          <div className="p-4 rounded-[2rem] border border-white bg-indigo-50/50 text-indigo-700 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Role</div>
                            <div className="font-black text-xs uppercase tracking-tight">Active Student</div>
                          </div>
                          <div className="p-4 rounded-[2rem] border border-white bg-emerald-50/50 text-emerald-700 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Account</div>
                            <div className="font-black text-xs uppercase tracking-tight">Verified</div>
                          </div>
                        </div>

                        <Link href="/student/settings" className="w-full">
                          <button className="w-full py-5 rounded-[2rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-2xl shadow-slate-200">
                            Portal Settings
                          </button>
                        </Link>
                      </div>
                    </section>

                    {/* Learning Stats */}
                    <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
                      <div className="absolute -top-10 -right-10 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <GraduationCap size={200} />
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-indigo-200 mb-6 flex items-center gap-2">
                          <Sparkles size={14} /> Knowledge Network
                        </h3>
                        <p className="text-sm font-bold text-white mb-2">Educators you've met</p>
                        <div className="text-4xl font-black tracking-tighter mb-8">
                          {teachersBooked} Teachers
                        </div>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-4">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(teachersBooked * 10, 100)}%` }}
                            className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 flex items-center gap-2">
                          <RefreshCw size={12} /> {repeatTeachers} Repeat bookings made
                        </p>
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Feeds & Lists */}
                  <div className="lg:col-span-2 space-y-6">

                    {/* Recently Viewed teachers feed */}
                    <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden group">
                      <div className="p-8 border-b border-white flex justify-between items-center bg-slate-50/30">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                          <Users size={16} className="text-indigo-600" /> Recent Network
                        </h3>
                        <button className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
                          <MoreHorizontal size={18} className="text-slate-400" />
                        </button>
                      </div>
                      <div className="p-8">
                        {studentDashboard?.recentlyViewed?.length ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {studentDashboard.recentlyViewed.slice(0, 4).map((t, i) => (
                              <div key={i} className="flex items-center gap-5 p-5 bg-white border border-white rounded-[2rem] hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-pointer group/item">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center font-black text-white shadow-xl shadow-slate-200 group-hover/item:scale-110 transition-transform duration-500 overflow-hidden">
                                  {t?.profileImage ? (
                                    <img src={getImageUrl(t.profileImage)} alt={t.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xl uppercase">{t?.name?.[0] || 'T'}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-black text-slate-900 text-sm tracking-tight uppercase group-hover/item:text-indigo-600 transition-colors">{t?.name || 'Educator'}</h4>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t?.subject || 'Professional'}</p>
                                </div>
                                <div className="ml-auto w-10 h-10 rounded-xl bg-slate-50 grid place-items-center text-slate-300 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                                  <ArrowRight size={14} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-20 opacity-60">
                            <div className="w-20 h-20 rounded-full bg-slate-50 grid place-items-center mx-auto mb-6">
                              <Users size={40} className="text-slate-200" />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">No recent interactions</p>
                            <p className="text-xs text-slate-400 mt-2">Visit profiles to grow your network</p>
                          </div>
                        )}
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Upcoming Classes */}
                      <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[400px]">
                        <div className="p-8 border-b border-white bg-slate-50/30">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                            <Clock size={16} className="text-blue-600" /> Upcoming
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
                                    <h4 className="font-black text-slate-900 text-sm truncate tracking-tight uppercase group-hover/session:text-indigo-600 transition-colors">{session.title || 'Session'}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                      <Clock size={10} /> {session.time || 'Schedule pending'}
                                    </p>
                                  </div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                              <Clock size={40} className="text-slate-200 mb-4" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No classes pending</p>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Sent Requests */}
                      <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[400px]">
                        <div className="p-8 border-b border-white bg-slate-50/30">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                            <Mail size={16} className="text-purple-600" /> Requests
                          </h3>
                        </div>
                        <div className="p-8 flex-1">
                          {openRequests.length ? (
                            <div className="space-y-4">
                              {openRequests.map((request, i) => (
                                <div key={i} className="group/req p-6 bg-white hover:bg-slate-50 rounded-[2rem] border border-white hover:shadow-2xl transition-all duration-500">
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="min-w-0">
                                      <h4 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{request.topic || 'Inquiry'}</h4>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Awaiting Response</p>
                                    </div>
                                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm shrink-0">Pending</span>
                                  </div>
                                  <button className="w-full py-3.5 rounded-2xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/req:opacity-100 transform translate-y-2 group-hover/req:translate-y-0 transition-all shadow-xl shadow-slate-200">
                                    View Portfolio
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                              <Mail size={40} className="text-slate-200 mb-4" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">No active requests</p>
                              <Link href="/student/requests">
                                <button className="px-8 py-3.5 border-2 border-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95">
                                  Start Inquiry
                                </button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden group">
                      <details className="group">
                        <summary className="flex cursor-pointer items-center justify-between p-8 bg-slate-50/10">
                          <div className="flex items-center gap-4">
                            <ShieldCheck size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Gateway Credentials</span>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-white grid place-items-center text-slate-300 group-open:rotate-180 transition-all duration-500 shadow-sm border border-slate-100">
                            <MoreHorizontal size={18} />
                          </div>
                        </summary>
                        <div className="p-8 border-t border-white grid grid-cols-2 md:grid-cols-4 gap-8">
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">User Token</div>
                            <div className="text-[10px] font-black text-slate-600 truncate uppercase tracking-tighter">{studentDashboard?.user?.id || 'ANON_SESSION'}</div>
                          </div>
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Security</div>
                            <div className="text-[10px] font-black text-slate-600 tracking-tighter italic">ENCRYPTED_SSL</div>
                          </div>
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Initialized</div>
                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                              {studentDashboard?.user?.iat ? new Date(studentDashboard.user.iat * 1000).toLocaleDateString() : 'TBD'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Session Exp</div>
                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                              {studentDashboard?.user?.exp ? new Date(studentDashboard.user.exp * 1000).toLocaleDateString() : 'TBD'}
                            </div>
                          </div>
                        </div>
                      </details>
                    </section>

                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default StudentDashboard;
