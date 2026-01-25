'use client';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
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
const getImageUrl = (img) =>
  !img || String(img).trim() === ''
    ? '/default-avatar.png'
    : String(img).startsWith('http')
    ? img
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${img}`;

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
    `rounded-lg px-3 py-2 text-sm text-left transition border ${
      active
        ? 'bg-slate-900 text-white border-slate-900'
        : 'text-slate-700 bg-white/0 hover:bg-slate-50 border-transparent hover:border-slate-200'
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
      <aside className="w-[260px] bg-white/70 backdrop-blur-sm border-r border-slate-200 p-6 flex flex-col flex-shrink-0 hidden md:flex">
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
            className="fixed inset-0 z-50 w-[260px] bg-white/95 backdrop-blur-sm p-6 flex flex-col border-r border-slate-200 md:hidden shadow-lg"
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
  <>
    <div className="text-center mb-6">
      <img
        src={getImageUrl(teacherImage)}
        alt={teacherName || 'Teacher'}
        className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-slate-200"
      />
      <h3
        className="mt-2 text-base font-semibold text-slate-800 truncate"
        title={teacherName || 'Teacher'}
      >
        {teacherName || 'Teacher'}
      </h3>
    </div>

    <button
      onClick={onOpen}
      className="rounded-lg px-4 py-2 text-sm text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 mb-5"
    >
      Fix Schedule
    </button>

    <h4 className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Menu</h4>
    <nav className="flex flex-col gap-1.5">
      {links.map((item) => {
        const active = isActive(item.href);
        return (
          <Link key={item.href} href={item.href} className={itemClass(active)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  </>
);

/* ---------------- Class Overview ---------------- */
const ClassOverview = ({ subjects }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Overview</h2>
    <div className="flex flex-wrap gap-5">
      {subjects.map(({ name, studentsCount }) => (
        <div
          key={name}
          className="bg-white p-5 rounded-xl shadow-sm w-48 border border-gray-100 hover:border-slate-200 hover:shadow-md transition"
        >
          <h3 className="text-base font-semibold text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-slate-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-slate-800 bg-slate-100 ring-1 ring-slate-200">
              Students: {studentsCount}
            </span>
          </p>
        </div>
      ))}
    </div>
  </section>
);

/* ---------------- Student List ---------------- */
const StudentList = ({ students }) => (
  <section>
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Students</h2>
    <div className="flex flex-wrap gap-4">
      {students.length === 0 ? (
        <p className="text-sm text-slate-500">No students found from your schedules yet.</p>
      ) : (
        students.map(({ id, name, img }) => (
          <div key={id} className="flex flex-col items-center flex-shrink-0 w-[72px]">
            <img
              src={getImageUrl(img)}
              alt={name || 'Student'}
              className="w-[60px] h-[60px] rounded-full object-cover ring-2 ring-slate-200"
            />
            <p className="text-xs mt-1 text-gray-700 text-center truncate w-full" title={name || 'Student'}>
              {name || 'Student'}
            </p>
          </div>
        ))
      )}
    </div>
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
    <>
      {/* Announcements */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 mr-2">📢</span>
          <h3 className="text-base font-semibold text-gray-900">Announcements</h3>
        </div>
        <div className="space-y-3">
          {(announcements || []).map((item, i) => (
            <div key={`ann-${i}`} className="p-3 rounded-lg bg-white shadow-sm border border-slate-200 hover:shadow-md transition">
              <p className="text-sm text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center mb-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 mr-2">📅</span>
          <h3 className="text-base font-semibold text-gray-900">Today’s Schedule</h3>
        </div>

        {schedulesQ.isLoading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : groupedToday.length === 0 ? (
          <div className="text-sm text-slate-500">No classes scheduled today.</div>
        ) : (
          <div className="space-y-3">
            {groupedToday.map((g, idx) => (
              <div
                key={`sched-${idx}-${g.date.getTime()}-${g.subject}-${g.type}-${g.postId || 'none'}`}
                className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border border-slate-200 hover:shadow-md transition"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {g.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {g.subject}
                  </div>
                  {g.type === 'demo' && <div className="text-[11px] text-slate-500">Demo class</div>}
                </div>
                <span
                  className="ml-3 inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 text-white bg-slate-900"
                  title={`${g.count} student${g.count > 1 ? 's' : ''}`}
                >
                  {g.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="w-[300px] bg-white/70 backdrop-blur-sm p-6 border-l border-slate-200 flex-shrink-0 min-h-screen hidden md:block">
        <RightSidebarContent />
      </aside>

      {/* Mobile Bottom Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm p-6 border-t border-slate-200 md:hidden max-h-[80%] overflow-y-auto"
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
      const arr = Array.isArray(s.studentIds)
        ? s.studentIds
        : s.studentId
        ? [s.studentId]
        : [];

      for (const st of arr) {
        let id, name, img;
        if (st && typeof st === 'object') {
          id = String(st._id || st.id || st._id?.toString?.() || Math.random().toString(36).slice(2));
          name = st.name || st.fullName || st.username || 'Student';
          img = st.profileImage || st.avatar || '';
        } else {
          id = String(st);
          name = 'Student';
          img = '';
        }
        if (!map.has(id)) map.set(id, { id, name, img });
      }
    }

    return Array.from(map.values()).slice(0, 24);
  }, [schedulesQ.data]);

  return (
    <div className="p-8">
      <ClassOverview subjects={SUBJECTS} />
      <StudentList students={studentsFromSchedules} />
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function TeacherClassroom() {
  const [open, setOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [client] = useState(() => new QueryClient());

  const { teacherDashboard, userInfo } = useSelector((state) => state.user);
  const teacherObj = teacherDashboard?.teacher || userInfo || {};
  const teacherName = teacherObj?.name || 'Teacher';
  const teacherImage = teacherObj?.profileImage;

  // 🔄 Socket live-refresh
  useEffect(() => {
    let detach = () => {};
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
    <QueryClientProvider client={client}>
      <div className="flex w-full h-screen bg-gradient-to-b from-white to-slate-50 relative">
        {/* Floating Bottom Hamburger Button (Left Sidebar) */}
        <button
          id="mobile-hamburger-btn"
          className="md:hidden fixed bottom-6 right-6 z-50 p-5 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl"
          onClick={() => setMobileSidebarOpen(prev => !prev)}
        >
          ☰
        </button>

        {/* Floating Bottom Right Sidebar Button (Mobile) */}
        <button
          className="md:hidden fixed bottom-6 left-6 z-50 p-5 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl"
          onClick={() => setMobileRightOpen(prev => !prev)}
        >
          📢
        </button>

        <Sidebar
          onOpen={() => setOpen(true)}
          teacherName={teacherName}
          teacherImage={teacherImage}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto">
          <MainArea />
        </main>

        <RightSidebarDynamic
          announcements={ANNOUNCEMENTS}
          mobileOpen={mobileRightOpen}
          onClose={() => setMobileRightOpen(false)}
        />

        <FixScheduleModal open={open} onClose={() => setOpen(false)} />
      </div>
    </QueryClientProvider>
  );
}
