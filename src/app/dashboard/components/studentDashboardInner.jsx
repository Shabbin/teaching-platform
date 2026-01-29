'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentDashboard, uploadProfilePicture } from '../../redux/userSlice';
import ProtectedRoute from '../../components/auth/protectedRoute';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon, ShieldCheck, Mail, Wallet,
  CreditCard, GraduationCap, Star, BookOpen,
  CalendarClock, MailCheck, TrendingUp, Activity,
  MoreHorizontal, ArrowRight, Settings, Users
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

  const currencyPrefix = studentDashboard?.currencySymbol || '৳';

  const profileSrc = userInfo?.profileImage || studentDashboard?.student?.profileImage
    ? (String(userInfo?.profileImage || studentDashboard?.student?.profileImage).startsWith('http')
      ? (userInfo?.profileImage || studentDashboard?.student?.profileImage)
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${userInfo?.profileImage || studentDashboard?.student?.profileImage}`)
    : '/default-avatar.png';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Student Portal</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRole="student">
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

        {/* Top Banner / Welcome Area - MIRRORED FROM TEACHER */}
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
                <GraduationCap size={14} /> Student Dashboard
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-bold mb-2"
              >
                Welcome back, {studentDashboard?.student?.name?.split(' ')[0] || userInfo?.name?.split(' ')[0] || 'Learner'}
              </motion.h1>
              <p className="text-slate-400">Ready to master something new today?</p>
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard/student/teachers">
                <button className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl font-semibold hover:bg-white/20 transition-all">
                  Find Teachers
                </button>
              </Link>
              <Link href="/student/requests">
                <button className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all">
                  Post Request
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
              <Activity size={20} />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {studentDashboard && (
            <>
              {/* Stats Grid - MIRRORED FROM TEACHER */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              >
                {/* Wallet Card */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet size={80} className="text-indigo-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-indigo-600 font-bold text-sm uppercase tracking-wide mb-1">Wallet Balance</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      <CountUp to={walletBalance} prefix={currencyPrefix + ' '} />
                    </h3>
                    <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-lg">
                      Available to spend
                    </div>
                  </div>
                </motion.div>

                {/* Monthly Spend Card */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CreditCard size={80} className="text-blue-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-blue-600 font-bold text-sm uppercase tracking-wide mb-1">Monthly Spend</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      <CountUp to={monthSpend} prefix={currencyPrefix + ' '} />
                    </h3>
                    <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                      <TrendingUp size={12} className="mr-1" /> within budget
                    </div>
                  </div>
                </motion.div>

                {/* Sessions Card */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CalendarClock size={80} className="text-purple-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-purple-600 font-bold text-sm uppercase tracking-wide mb-1">Total Classes</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      <CountUp to={upcomingSessions.length + pastSessions.length} />
                    </h3>
                    <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
                      <span className="font-bold text-purple-600">{upcomingSessions.length}</span> upcoming
                    </div>
                  </div>
                </motion.div>

                {/* Rating Given Card */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Star size={80} className="text-amber-500" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-amber-600 font-bold text-sm uppercase tracking-wide mb-1">Engagement</p>
                    <h3 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                      {avgRatingGiven?.toFixed(1) || '0.0'} <Star size={24} className="text-amber-400 fill-amber-400" />
                    </h3>
                    <p className="text-slate-400 text-xs mt-4">{reviewsCount} feedback provided</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Main Layout - 1/3 and 2/3 - MIRRORED FROM TEACHER */}
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
                            className="w-full h-full rounded-full object-cover border-4 border-white shadow-md mx-auto"
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
                        {studentDashboard?.student?.name || 'Student'}
                        <ShieldCheck size={18} className="text-indigo-500" />
                      </h2>
                      <p className="text-slate-500 text-sm mb-6">{studentDashboard?.student?.email}</p>

                      <div className="w-full grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 rounded-2xl border text-center bg-indigo-50 border-indigo-100 text-indigo-700">
                          <div className="text-xs font-bold uppercase mb-1">Role</div>
                          <div className="font-bold text-sm flex items-center justify-center gap-1">Student</div>
                        </div>
                        <div className="p-3 rounded-2xl border text-center bg-emerald-50 border-emerald-100 text-emerald-700">
                          <div className="text-xs font-bold uppercase mb-1">Status</div>
                          <div className="font-bold text-sm flex items-center justify-center gap-1">Active</div>
                        </div>
                      </div>

                      <Link href="/student/settings" className="w-full">
                        <button className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg">
                          Account Settings
                        </button>
                      </Link>
                    </div>
                  </section>

                  {/* Learning Stats (Sidebar variant of teacher commission) */}
                  <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <GraduationCap size={100} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Teachers Met</h3>
                    <p className="text-indigo-200 text-sm mb-4">Unique educators you've booked</p>
                    <div className="text-3xl font-bold mb-2">
                      {teachersBooked} Teachers
                    </div>
                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/80 w-1/2 rounded-full"></div>
                    </div>
                    <p className="mt-4 text-xs font-semibold text-indigo-100">
                      {repeatTeachers} repeat bookings — consistency is key!
                    </p>
                  </section>
                </div>

                {/* Right Column: Feeds & Lists */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Recently Viewed teachers feed instead of posts */}
                  <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Users size={18} className="text-indigo-500" /> Recently Interacted
                      </h3>
                      <button className="p-2 hover:bg-white rounded-full transition-colors">
                        <MoreHorizontal size={18} className="text-slate-400" />
                      </button>
                    </div>
                    <div className="p-6">
                      {studentDashboard?.recentlyViewed?.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {studentDashboard.recentlyViewed.slice(0, 4).map((t, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                                {t?.name?.[0] || 'T'}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{t?.name || 'Teacher'}</h4>
                                <p className="text-xs text-slate-500">{t?.subject || 'Educator'}</p>
                              </div>
                              <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 opacity-60">
                          <Users size={40} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No recent interactions</p>
                          <p className="text-xs text-slate-400 mt-1">Visit teacher profiles to see them here.</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upcoming Classes */}
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                      <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <CalendarClock size={18} className="text-blue-500" /> Upcoming
                        </h3>
                      </div>
                      <div className="p-4 flex-1">
                        {upcomingSessions.length ? (
                          <div className="space-y-3">
                            {upcomingSessions.map((session, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-slate-700 shadow-sm text-xs">
                                  {session.date?.split(' ')[0] || 'TBD'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-slate-900 text-sm truncate">{session.title || 'Tuition Session'}</h4>
                                  <p className="text-xs text-slate-500">{session.time || 'Schedule pending'}</p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-60">
                            <CalendarClock size={40} className="text-slate-300 mb-2" />
                            <p className="text-sm text-slate-400">No upcoming classes</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Sent Requests */}
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                      <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <MailCheck size={18} className="text-purple-500" /> My Requests
                        </h3>
                      </div>
                      <div className="p-4 flex-1">
                        {openRequests.length ? (
                          <div className="space-y-3">
                            {openRequests.map((request, i) => (
                              <div key={i} className="group p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{request.topic || 'Inquiry'}</h4>
                                    <p className="text-xs text-slate-500">Wait for teacher response</p>
                                  </div>
                                  <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Pending</span>
                                </div>
                                <button className="w-full mt-2 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  View Details
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-60">
                            <MailCheck size={40} className="text-slate-300 mb-2" />
                            <p className="text-sm text-slate-400">No active requests</p>
                            <Link href="/student/requests" className="mt-3">
                              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Create one now</button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Session / Credentials Footer - Styled as a detail card */}
                  <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <details className="group">
                      <summary className="flex cursor-pointer items-center justify-between p-6 bg-slate-50/30">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-slate-400" />
                          <span className="font-bold text-slate-600 text-sm">Portal Credential Details</span>
                        </div>
                        <MoreHorizontal className="text-slate-400 group-open:rotate-90 transition-transform" size={18} />
                      </summary>
                      <div className="p-6 border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] uppercase tracking-widest font-black text-slate-400">
                        <div>
                          <div className="mb-1 text-slate-300">User ID</div>
                          <div className="text-slate-600 truncate">{studentDashboard?.user?.id || '---'}</div>
                        </div>
                        <div>
                          <div className="mb-1 text-slate-300">Access Key</div>
                          <div className="text-slate-600">••••••••••</div>
                        </div>
                        <div>
                          <div className="mb-1 text-slate-300">Active Since</div>
                          <div className="text-slate-600">
                            {studentDashboard?.user?.iat ? new Date(studentDashboard.user.iat * 1000).toLocaleDateString() : '---'}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-slate-300">Session Exp</div>
                          <div className="text-slate-600">
                            {studentDashboard?.user?.exp ? new Date(studentDashboard.user.exp * 1000).toLocaleDateString() : '---'}
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
    </ProtectedRoute>
  );
};

export default StudentDashboard;
