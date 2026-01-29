// src/app/dashboard/student/schedule/routines/page.jsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, Calendar, ChevronRight, BookOpen, Clock,
  Sparkles, RefreshCw, Mail, Settings, Megaphone,
  ShieldCheck, CreditCard, CalendarDays, MoreHorizontal
} from 'lucide-react';

import API from '../../../../../api/axios';
import useSocket from '../../../../hooks/useSocket';
import { getStudentRoutines } from '../../../../../api/routines';

/** ---------- HELPERS ---------- */
const getImageUrl = (path) => {
  if (!path) return 'https://i.pravatar.cc/150';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/${path}`;
};

const formatDhaka = (iso) => {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d)) return 'TBD';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dhaka',
  });
};

const dhakaDateKey = (dateLike) => {
  const d = new Date(dateLike);
  if (isNaN(d)) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};
const isSameDhakaDay = (a, b) => dhakaDateKey(a) === dhakaDateKey(b);

/** ---------- TRANSFORM: schedules → teachers[] ---------- */
function buildTeachers(list) {
  const byTeacher = new Map();
  for (const s of list || []) {
    const tRaw = s.teacherId?._id || 'unknown';
    const tKey = `t:${tRaw}`;
    if (!byTeacher.has(tKey)) {
      byTeacher.set(tKey, {
        id: String(tRaw),
        name: s.teacherId?.name || 'Teacher',
        avatar: s.teacherId?.profileImage || '',
        courses: new Map(),
      });
    }
    const t = byTeacher.get(tKey);
    const pRaw = (s.postId && (s.postId._id || s.postId)) || 'unknown-post';
    const pKey = `p:${pRaw}`;
    if (!t.courses.has(pKey)) {
      t.courses.set(pKey, {
        id: String(pRaw),
        title: s.postId?.title || 'Academic Session',
        subject: s.subject || '—',
        classes: [],
      });
    }
    t.courses.get(pKey).classes.push({
      id: s._id,
      date: s.date,
      type: s.type,
      status: s.status,
    });
  }
  return Array.from(byTeacher.values()).map((t) => ({
    ...t,
    courses: Array.from(t.courses.values()).map(c => ({
      ...c,
      classes: c.classes.sort((a, b) => new Date(a.date) - new Date(b.date))
    }))
  }));
}

/** ---------- COMPONENTS ---------- */

function StudentSidebar({ studentName, studentImage }) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (path) => () => router.push(path);
  const isActive = (path) =>
    pathname === path || (path !== '/' && pathname?.startsWith(path));

  const itemClass = (active) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 border ${active
      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200 scale-[1.02]'
      : 'text-slate-500 bg-transparent border-transparent hover:bg-white hover:border-slate-100 hover:text-slate-900'
    }`;

  const navItems = [
    { label: 'My Schedule', path: '/dashboard/student/schedule', icon: <CalendarDays size={18} /> },
    { label: 'Regular Routine', path: '/dashboard/student/schedule/routines', icon: <RefreshCw size={18} /> },
    { label: 'My Courses', path: '/dashboard/student/courses', icon: <BookOpen size={18} /> },
    { label: 'Find Teachers', path: '/dashboard/student/find-teachers', icon: <Settings size={18} /> },
    { label: 'Messages', path: '/dashboard/student/messages', icon: <Mail size={18} /> },
    { label: 'Settings', path: '/dashboard/student/settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-[280px] bg-white/40 backdrop-blur-3xl border-r border-white/50 p-6 flex flex-col flex-shrink-0 hidden md:flex relative z-20">
      <div className="text-center mb-8 relative">
        <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full scale-150"></div>
        <div className="relative">
          <img
            src={getImageUrl(studentImage)}
            alt={studentName || 'Student'}
            className="w-20 h-20 rounded-3xl object-cover mx-auto ring-4 ring-white shadow-xl shadow-slate-200/50"
          />
          <div className="absolute -bottom-2 right-1/2 translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
            Student
          </div>
        </div>
        <h3 className="mt-6 text-lg font-black text-slate-900 truncate tracking-tight" title={studentName || 'Student'}>
          {studentName || 'Student'}
        </h3>
      </div>

      <div className="flex-1 space-y-8">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-2">Navigation</h4>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={go(item.path)}
                className={itemClass(isActive(item.path))}
              >
                {item.icon}
                <span className="tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}

function RoutineList({ routines }) {
  if (!Array.isArray(routines) || routines.length === 0) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fmtNext = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBD';

  return (
    <section>
      <div className="mb-8 px-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Master Schedules</h2>
        <div className="flex items-center gap-2 text-purple-600 bg-purple-50/50 w-fit px-3 py-1 rounded-full border border-purple-100/50">
          <RefreshCw size={14} className="animate-spin-slow" />
          <p className="text-[10px] font-black uppercase tracking-widest">{routines.length} Active Routines</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {routines.map((r, idx) => (
          <motion.div
            key={r._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/40 p-8 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors"></div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <img
                src={getImageUrl(r.teacher?.profileImage)}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white shadow-lg"
              />
              <div className="min-w-0">
                <div className="text-lg font-black text-slate-900 truncate tracking-tight uppercase">
                  {r.teacher?.name || 'Academic Mentor'}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {r.post?.title || 'Global Course'}
                </div>
              </div>
              <div className="ml-auto text-[8px] font-black px-3 py-1 rounded-full bg-slate-900 text-white uppercase tracking-widest">
                {r.status}
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              {(r.slots || []).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/40 border border-white/60 shadow-sm text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    {dayNames[s.weekday]}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900">{s.timeHHMM}</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{s.durationMinutes}m</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Session</div>
              <div className="text-[11px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                {fmtNext(
                  (r.slots || [])
                    .map((s) => s.nextRunAt)
                    .filter(Boolean)
                    .sort((a, b) => new Date(a) - new Date(b))[0]
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TeacherSections({ teachers, onPay }) {
  const [openPayFor, setOpenPayFor] = useState(null);
  const toggleMenu = (teacherId) =>
    setOpenPayFor((cur) => (cur === teacherId ? null : teacherId));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
      <AnimatePresence mode="popLayout">
        {teachers.map((t, idx) => {
          const completedDemos = t.courses.reduce(
            (acc, c) =>
              acc +
              c.classes.filter((cl) => cl.type === 'demo' && cl.status === 'completed').length,
            0
          );

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: idx * 0.08
              }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[3.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

              <div className="relative bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/80 shadow-2xl shadow-slate-200/50 hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>

                <div className="p-8">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-3xl scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 p-1 rounded-[2.2rem] bg-gradient-to-br from-indigo-100 to-white shadow-xl">
                        <img
                          src={getImageUrl(t.avatar)}
                          alt={t.name}
                          className="w-20 h-20 rounded-[1.8rem] object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 p-1.5 bg-emerald-500 rounded-2xl border-4 border-white shadow-lg z-20">
                        <ShieldCheck size={12} className="text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors leading-none">
                        {t.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="px-3 py-1 rounded-full bg-slate-900 text-[8px] font-black text-white uppercase tracking-[0.15em] border border-slate-900">
                          {t.courses.length} Courses
                        </div>
                        {completedDemos > 0 && (
                          <div className="px-3 py-1 rounded-full bg-indigo-50 text-[8px] font-black text-indigo-600 uppercase tracking-[0.15em] border border-indigo-100/50">
                            {completedDemos} Demos
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Active Learning</h4>
                    {t.courses.map((c) => (
                      <div key={c.id} className="relative p-5 rounded-[2rem] bg-slate-50/40 border border-slate-100/50 group/course hover:bg-white hover:border-indigo-100 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-full border border-indigo-100/50 uppercase tracking-widest">{c.subject}</span>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <Clock size={12} />
                            {c.classes.length} Sessions
                          </div>
                        </div>
                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight">{c.title || 'Untitled Session'}</div>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleMenu(t.id)}
                      className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white group-hover:bg-indigo-600 transition-all active:scale-[0.97] shadow-xl shadow-slate-200 flex items-center justify-between px-6 overflow-hidden"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-white/20 shadow-inner">
                          <CreditCard size={22} />
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-[0.15em]">Manage Tuition Payments</span>
                      </div>
                      <ChevronRight size={18} className={`transition-transform duration-500 ${openPayFor === t.id ? 'rotate-90' : 'rotate-0'}`} />
                    </button>

                    <AnimatePresence>
                      {openPayFor === t.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 20, scale: 0.9 }}
                          className="absolute bottom-full left-0 right-0 mb-6 p-6 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] z-30"
                        >
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Payment Directory</div>
                          <div className="space-y-3">
                            {t.courses.map((c) => (
                              <div key={`pay-opts-${c.id}`} className="group/opt p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:border-indigo-100 hover:bg-white transition-all">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 truncate px-1">{c.title}</div>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    onClick={() => {
                                      onPay(t.id, c.id, 'HALF');
                                      setOpenPayFor(null);
                                    }}
                                    className="py-3.5 rounded-xl border border-indigo-100 bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                  >
                                    Split Pay
                                  </button>
                                  <button
                                    onClick={() => {
                                      onPay(t.id, c.id, 'FULL');
                                      setOpenPayFor(null);
                                    }}
                                    className="py-3.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                                  >
                                    Full Pay
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function RightSidebar({ teachers }) {
  const todayItems = useMemo(() => {
    const now = new Date();
    const all = [];
    teachers.forEach((t) =>
      t.courses.forEach((c) =>
        c.classes.forEach((cls) => {
          if (!cls.date || cls.status === 'cancelled') return;
          const d = new Date(cls.date);
          if (!isNaN(d) && isSameDhakaDay(d, now)) {
            all.push({
              id: `${t.id}-${c.id}-${cls.id}`,
              teacher: t.name,
              subject: c.subject,
              time: cls.date,
              status: cls.status,
            });
          }
        })
      )
    );
    return all.sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [teachers]);

  return (
    <aside className="w-[320px] bg-white/40 backdrop-blur-3xl p-8 border-l border-white/50 flex-shrink-0 min-h-screen hidden md:block relative z-20 overflow-y-auto">
      <div className="flex flex-col h-full space-y-8">
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100">
              <Megaphone size={18} />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Broadcasts</h3>
          </div>
          <div className="space-y-4">
            <div className="p-5 rounded-[1.5rem] bg-white/60 backdrop-blur-xl border border-white shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-purple-100 transition-all pointer-events-none">
              <div className="flex gap-3 mb-2">
                <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tight">Real-time sync active. Routines update instantly as teachers modify them.</p>
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="relative flex-1">
          <div className="flex items-center gap-3 mb-6 pt-8 border-t border-slate-100">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
              <CalendarDays size={18} />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Today</h3>
          </div>

          {todayItems.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-slate-50/50 border border-dashed border-slate-200">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No classes today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayItems.map((it, idx) => (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group p-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-indigo-100 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(it.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900 truncate tracking-tight uppercase">
                        {it.subject}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 truncate mt-1">{it.teacher}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/** ---------- MAIN PAGE ---------- */

export default function StudentScheduleRoutinesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [routines, setRoutines] = useState([]);

  const { userInfo, studentDashboard } = useSelector((s) => s.user || {});
  const me = studentDashboard?.student || userInfo || {};
  const studentName = me?.name || 'Student';
  const studentImage = me?.profileImage || '';
  const userId = useSelector((s) => s?.auth?.user?._id) || me?._id || me?.id;

  const fetchSchedules = async () => {
    try {
      const now = new Date();
      const from = new Date(now); from.setDate(from.getDate() - 30);
      const to = new Date(now); to.setDate(to.getDate() + 30);
      const res = await API.get(`/schedules/student?from=${from.toISOString()}&to=${to.toISOString()}`);
      setTeachers(buildTeachers(res.data));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutinesList = async () => {
    try {
      const data = await getStudentRoutines();
      setRoutines(Array.isArray(data) ? data : []);
    } catch {
      setRoutines([]);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchRoutinesList();
  }, []);

  const refreshTimer = useRef(null);
  useSocket(userId, undefined, undefined, undefined, (notification) => {
    if (['routine_created', 'routine_refresh', 'schedules_refresh'].includes(notification?.type)) {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        fetchSchedules();
        fetchRoutinesList();
      }, 150);
    }
  });

  const onPay = async (teacherId, postId, plan) => {
    try {
      const feeRaw = window.prompt('Enter monthly fee (BDT):', '3000');
      const monthlyFee = Number(feeRaw || 0);
      if (!monthlyFee) return;
      const r = await API.post('/payments/tuition/initiate', {
        teacherId, postId, monthlyFee, phase: 'FIRST', fraction: plan === 'HALF' ? 0.5 : 1, monthIndex: 1, returnUrl: window.location.href
      });
      if (r?.data?.url) window.location.href = r.data.url;
      else alert('Could not start payment.');
    } catch (e) {
      alert(e?.response?.data?.error || 'Payment failed');
    }
  };

  return (
    <div className="flex w-full h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Legendary Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-purple-500/5 blur-[180px] rounded-full animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-indigo-500/5 blur-[150px] rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply"></div>
      </div>

      <StudentSidebar studentName={studentName} studentImage={studentImage} />

      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-16">
          <RoutineList routines={routines} />

          <section>
            <div className="mb-10 px-2 flex flex-col items-start gap-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">My Educators</h2>
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 border border-indigo-500 group hover:scale-[1.03] transition-all duration-500 cursor-default">
                <div className="p-1.5 rounded-lg bg-white/20 shadow-inner">
                  <Users size={16} className="text-white fill-white/20" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{teachers.length} Connected Teachers</span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-white/40 h-64 rounded-[3rem] border border-white" />
                ))}
              </div>
            ) : error ? (
              <div className="bg-rose-50/50 p-8 rounded-[3rem] text-rose-600 font-black uppercase text-xs">
                {error}
              </div>
            ) : (
              <TeacherSections teachers={teachers} onPay={onPay} />
            )}
          </section>
        </div>
      </main>

      <RightSidebar teachers={teachers} />

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 15s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
      `}</style>
    </div>
  );
}
