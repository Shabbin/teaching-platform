'use client';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, Calendar, Bell, Settings, LogOut,
  ChevronRight, Search, Plus, Filter,
  BookOpen, Clock, AlertCircle, Sparkles,
  Layout, Grid, List, CheckCircle2,
  CalendarDays, Megaphone, User
} from 'lucide-react';
import FixScheduleModal from '../../components/scheduleComponents/fixScheduleModal';
import { useTeacherSchedules } from '../../../hooks/useSchedules';

// --- Static demo cards ---
const SUBJECTS = [
  { name: 'Physics', studentsCount: 3 },
  { name: 'Chemistry', studentsCount: 4 },
  { name: 'Mathematics', studentsCount: 2 },
];
const ANNOUNCEMENTS = ['Physics class moved to Friday', 'New video uploaded: Motion'];

/* ---------------- Utils ---------------- */
const getImageUrl = (img) => {
  if (!img || String(img).trim() === '') return null;
  const s = String(img);
  if (s.startsWith('http')) return s;
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${s.startsWith('/') ? s.slice(1) : s}`;
};

const StudentAvatar = ({ src, name, size = "w-16 h-16" }) => {
  const [error, setError] = useState(false);
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className={`${size} rounded-[1.25rem] bg-slate-100 border-2 border-white shadow-sm md:shadow-lg overflow-hidden flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500`}>
      {(!src || error) ? (
        <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
          <span className="text-xs font-black text-indigo-300 tracking-tighter">{initials}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          onError={() => setError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

/* ---------------- Sidebar ---------------- */
const Sidebar = ({ onOpen, teacherName, teacherImage, mobileOpen, onClose }) => {
  const pathname = usePathname();
  const sidebarRef = useRef();

  const links = [
    { label: 'Schedule (Today)', href: '/dashboard/teacher/schedule' },
    { label: 'Routines', href: '/dashboard/teacher/schedule/routines' },
  ];

  const isActive = (href) =>
    pathname === href || (href !== '/dashboard/teacher/schedule' && pathname?.startsWith(href));

  const itemClass = (active) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 border ${active
      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200 scale-[1.02]'
      : 'text-slate-500 bg-transparent border-transparent hover:bg-white hover:border-slate-100 hover:text-slate-900'
    }`;

  // Close sidebar when clicking outside, ignore the hamburger button
  useEffect(() => {
    const handleClickOutside = (e) => {
      const hamburger = document.getElementById('mobile-hamburger-btn');
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        hamburger &&
        !hamburger.contains(e.target)
      ) {
        onClose();
      }
    };
    if (mobileOpen) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen, onClose]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-[280px] bg-white/40 backdrop-blur-md md:backdrop-blur-3xl border-r border-white/50 p-6 flex flex-col flex-shrink-0 hidden md:flex relative z-20">
        <SidebarContent
          onOpen={onOpen}
          teacherName={teacherName}
          teacherImage={teacherImage}
          links={links}
          itemClass={itemClass}
          isActive={isActive}
        />
      </aside>

      {/* Mobile Slide-in Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            ref={sidebarRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="fixed inset-0 z-50 w-[260px] bg-white/95 backdrop-blur-md p-6 flex flex-col border-r border-slate-200 md:hidden shadow-lg"
          >
            <SidebarContent
              onOpen={onOpen}
              teacherName={teacherName}
              teacherImage={teacherImage}
              links={links}
              itemClass={itemClass}
              isActive={isActive}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

const SidebarContent = ({ onOpen, teacherName, teacherImage, links, itemClass, isActive }) => (
  <div className="flex flex-col h-full">
    <div className="text-center mb-8 relative">
      <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full scale-150"></div>
      <div className="relative">
        <img
          src={getImageUrl(teacherImage)}
          alt={teacherName || 'Teacher'}
          className="w-20 h-20 rounded-3xl object-cover mx-auto ring-4 ring-white shadow-xl shadow-slate-200/50"
        />
        <div className="absolute -bottom-2 right-1/2 translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
          Teacher
        </div>
      </div>
      <h3
        className="mt-6 text-lg font-black text-slate-900 truncate tracking-tight"
        title={teacherName || 'Teacher'}
      >
        {teacherName || 'Teacher'}
      </h3>
    </div>

    <button
      onClick={onOpen}
      className="group relative rounded-2xl p-4 bg-slate-900 text-white overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] mb-8"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]">
        <Clock size={14} />
        Fix Schedule
      </div>
    </button>

    <div className="flex-1 space-y-8">
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-2">Navigation</h4>
        <nav className="flex flex-col gap-2">
          {links.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={itemClass(active)}>
                {item.label === 'Schedule (Today)' ? <CalendarDays size={18} /> : <List size={18} />}
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  </div>
);

/* ---------------- Class Overview ---------------- */
const ClassOverview = ({ subjects }) => (
  <section className="mb-12">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Class Overview</h2>
        <p className="text-sm font-medium text-slate-400">Your subject performance at a glance.</p>
      </div>
      <div className="p-3 rounded-2xl bg-white/50 border border-white shadow-sm">
        <BookOpen className="text-indigo-600" size={20} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map(({ name, studentsCount }, idx) => (
        <motion.div
          key={name}
          initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : idx * 0.1 }}
          className="group relative bg-white/60 backdrop-blur-md md:backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-xl shadow-indigo-100/20 hover:shadow-2xl hover:shadow-indigo-200/40 hover:-translate-y-1 transition-all duration-500"
        >
          <div className="absolute top-4 right-4 p-2 rounded-xl bg-indigo-50 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles size={14} />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">{name}</h3>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=${name}${i}`} alt="" />
                </div>
              ))}
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
              {studentsCount} Students
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

/* ---------------- Student List ---------------- */
const StudentList = ({ students, loading }) => (
  <section className="mt-16">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 px-2">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Connected Learners</h2>
        <div className="flex items-center gap-2 text-indigo-500 bg-indigo-50/50 w-fit px-3 py-1 rounded-full border border-indigo-100/50">
          <Users size={14} />
          <p className="text-[10px] font-black uppercase tracking-widest">{students.length} Total Students</p>
        </div>
      </div>
    </div>

    {loading ? (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 md:gap-8">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="animate-pulse space-y-3">
            <div className="aspect-square bg-slate-100 rounded-[1.5rem]" />
            <div className="h-2 w-1/2 bg-slate-100 mx-auto rounded" />
          </div>
        ))}
      </div>
    ) : students.length === 0 ? (
      <div className="bg-white/40 backdrop-blur-md md:backdrop-blur-xl rounded-[3rem] p-16 border border-white text-center shadow-2xl shadow-slate-200/50">
        <div className="w-16 h-16 rounded-full bg-slate-50 grid place-items-center mx-auto mb-6">
          <Users size={24} className="text-slate-200" />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">No active students found in your schedule</p>
      </div>
    ) : (
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-6 md:gap-8 pb-32">
        {students.map(({ id, name, img }, idx) => (
          <motion.div
            key={id}
            initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : idx * 0.03 }}
            className="flex flex-col items-center group"
          >
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <StudentAvatar src={getImageUrl(img)} name={name} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100" />
            </div>
            <p className="text-[10px] font-black text-slate-500 group-hover:text-indigo-600 transition-all text-center uppercase tracking-tight truncate w-full px-2">
              {name || 'Student'}
            </p>
          </motion.div>
        ))}
      </div>
    )}
  </section>
);

/* ---------------- Right Sidebar (Dynamic) ---------------- */
function RightSidebarDynamic({ announcements, mobileOpen, onClose }) {
  const schedulesQ = useTeacherSchedules();

  const groupedToday = useMemo(() => {
    const all = Array.isArray(schedulesQ.data) ? schedulesQ.data : [];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    const groups = new Map();
    for (const s of all) {
      if (s.status !== 'scheduled') continue;
      const d = new Date(s.date);
      if (isNaN(d) || d < start || d > end) continue;

      const minuteKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
      const postKey = typeof s.postId === 'object' && s.postId?._id ? s.postId._id : (s.postId || '');
      const key = `${minuteKey}|${s.subject}|${s.type || 'regular'}|${postKey}`;

      const current = groups.get(key) || { date: d, subject: s.subject, type: s.type || 'regular', postId: postKey, count: 0 };
      const added = Array.isArray(s.studentIds) ? s.studentIds.length : 1;
      current.count += added;
      groups.set(key, current);
    }

    return Array.from(groups.values()).sort((a, b) => a.date - b.date);
  }, [schedulesQ.data]);

  const RightSidebarContent = () => (
    <div className="flex flex-col h-full space-y-8">
      {/* Announcements */}
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100">
              <Megaphone size={18} />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Announcements</h3>
          </div>
        </div>
        <div className="space-y-4">
          {(announcements || []).map((item, i) => (
            <motion.div
              key={`ann-${i}`}
              initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : i * 0.1 }}
              className="p-5 rounded-[1.5rem] bg-white/60 backdrop-blur-md md:backdrop-blur-xl border border-white shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-purple-100 transition-all cursor-default"
            >
              <div className="flex gap-3 mb-2">
                <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tight">{item}</p>
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">{new Date().toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="relative flex-1">
        <div className="flex items-center justify-between mb-6 pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
              <Calendar size={18} />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Today</h3>
          </div>
        </div>

        {schedulesQ.isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin"></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Syncing...</p>
          </div>
        ) : groupedToday.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-slate-50/50 border border-dashed border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quiet day today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedToday.map((g, idx) => (
              <motion.div
                key={`sched-${idx}-${g.date.getTime()}`}
                initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : idx * 0.05 }}
                className="group p-4 rounded-2xl bg-white/60 backdrop-blur-md md:backdrop-blur-xl border border-white shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-indigo-100 transition-all cursor-default"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={12} className="text-indigo-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {g.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-900 truncate tracking-tight uppercase">
                      {g.subject}
                    </div>
                    {g.type === 'demo' && (
                      <span className="mt-1 inline-block text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md uppercase tracking-tight">
                        Demo session
                      </span>
                    )}
                  </div>
                  <div
                    className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 group-hover:bg-indigo-600 transition-colors"
                    title={`${g.count} student${g.count > 1 ? 's' : ''}`}
                  >
                    <span className="text-xs font-black">{g.count}</span>
                    <Users size={10} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="w-[320px] bg-white/40 backdrop-blur-md md:backdrop-blur-3xl p-8 border-l border-white/50 flex-shrink-0 min-h-screen hidden md:block relative z-20 overflow-y-auto">
        <RightSidebarContent />
      </aside>

      {/* Mobile Bottom Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md p-6 border-t border-slate-200 md:hidden max-h-[80%] overflow-y-auto"
          >
            <button onClick={onClose} className="self-end mb-4 text-slate-700 font-bold focus:outline-none">
              ✕
            </button>
            <RightSidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------- Main Area ---------------- */
function MainArea() {
  const schedulesQ = useTeacherSchedules();

  const studentsFromSchedules = useMemo(() => {
    const all = Array.isArray(schedulesQ.data) ? schedulesQ.data : [];
    const map = new Map();

    for (const s of all) {
      // Collect students from both studentIds array and individual studentId field
      const arr = Array.isArray(s.studentIds)
        ? s.studentIds
        : s.studentId
          ? [s.studentId]
          : [];

      for (const st of arr) {
        if (!st) continue;
        const id = String(st._id || st.id || st);
        if (map.has(id)) continue;

        const name = st.name || st.fullName || st.username || 'Student';
        const img = st.profileImage || st.avatar || '';
        map.set(id, { id, name, img });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [schedulesQ.data]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <ClassOverview subjects={SUBJECTS} />
      <StudentList students={studentsFromSchedules} loading={schedulesQ.isLoading} />
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function TeacherClassroom() {
  const [open, setOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  const client = useQueryClient();

  const { teacherDashboard, userInfo } = useSelector((state) => state.user);
  const teacherObj = teacherDashboard?.teacher || userInfo || {};
  const teacherName = teacherObj?.name || 'Teacher';
  const teacherImage = teacherObj?.profileImage;

  // 🔄 Socket live-refresh
  useEffect(() => {
    let detach = () => { };
    let tries = 0;
    const maxTries = 20;

    const attach = () => {
      const s = typeof window !== 'undefined' ? window.socket : null;
      if (!s) return false;

      const onRefresh = () => client.invalidateQueries({ queryKey: ['schedules'] });
      s.on('new_notification', onRefresh);
      s.on('schedules_refresh', onRefresh);

      detach = () => {
        s.off('new_notification', onRefresh);
        s.off('schedules_refresh', onRefresh);
      };

      return true;
    };

    if (!attach()) {
      const id = setInterval(() => {
        tries += 1;
        if (attach() || tries >= maxTries) clearInterval(id);
      }, 500);
      return () => { clearInterval(id); detach(); };
    }

    return () => detach();
  }, [client]);

  return (
    <div className="flex w-full h-[100dvh] bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Legendary Background (Light Edition) - Optimized for mobile */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="hidden md:block">
          <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-indigo-500/5 blur-[180px] rounded-full animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-purple-500/5 blur-[150px] rounded-full animate-blob animation-delay-2000"></div>
        </div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply"></div>
      </div>

      {/* Mobile Buttons */}
      <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 bg-white/80 backdrop-blur-md border border-white rounded-[2.5rem] shadow-2xl shadow-indigo-200/50">
        <button
          id="mobile-hamburger-btn"
          className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200 active:scale-95 transition-transform"
          onClick={() => setMobileSidebarOpen(prev => !prev)}
        >
          <Grid size={20} />
        </button>
        <div className="w-px h-8 bg-slate-200 mx-2"></div>
        <button
          className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-900 shadow-xl shadow-slate-100 active:scale-95 transition-transform"
          onClick={() => setMobileRightOpen(prev => !prev)}
        >
          <Megaphone size={20} />
        </button>
      </div>

      <Sidebar
        onOpen={() => setOpen(true)}
        teacherName={teacherName}
        teacherImage={teacherImage}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <main
        className="flex-1 overflow-y-auto relative z-10 custom-scrollbar overscroll-contain touch-pan-y"
        style={{
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      >
        <div className="w-full transform-gpu">
          <MainArea />
        </div>
      </main>

      <RightSidebarDynamic
        announcements={ANNOUNCEMENTS}
        mobileOpen={mobileRightOpen}
        onClose={() => setMobileRightOpen(false)}
      />

      <FixScheduleModal open={open} onClose={() => setOpen(false)} />

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 15s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
