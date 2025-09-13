// src/app/dashboard/teacher/schedule/page.jsx
'use client';
import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FixScheduleModal from '../../components/scheduleComponents/fixScheduleModal';
import { useTeacherSchedules } from '../../../hooks/useSchedules';

// --- Static demo cards (kept as-is) ---
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

/* ---------------- Sidebar (white theme like student) ---------------- */
const Sidebar = ({ onOpen, teacherName, teacherImage }) => {
  const pathname = usePathname();

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

  return (
    <aside className="w-[260px] bg-white/70 backdrop-blur-sm border-r border-slate-200 p-6 flex flex-col flex-shrink-0">
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
        className="rounded-lg px-4 py-2 text-sm text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        Fix Schedule
      </button>

      <h4 className="text-[11px] uppercase tracking-wide text-slate-500 mt-5 mb-2">Menu</h4>
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
    </aside>
  );
};

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

const StudentList = ({ students }) => (
  <section>
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Students</h2>
    <div className="flex flex-wrap gap-4">
      {students.length === 0 ? (
        <p className="text-sm text-slate-500">No students found from your schedules yet.</p>
      ) : (
        students.map(({ id, name, img }) => (
          <div key={id || name} className="flex flex-col items-center flex-shrink-0 w-[72px]">
            <img
              src={getImageUrl(img)}
              alt={name || 'Student'}
              className="w-[60px] h-[60px] rounded-full object-cover ring-2 ring-slate-200"
            />
            <p
              className="text-xs mt-1 text-gray-700 text-center truncate w-full"
              title={name || 'Student'}
            >
              {name || 'Student'}
            </p>
          </div>
        ))
      )}
    </div>
  </section>
);

/* ---------------- Right sidebar (white theme; grouped) ---------------- */
function RightSidebarDynamic({ announcements }) {
  const schedulesQ = useTeacherSchedules();

  const groupedToday = useMemo(() => {
    const all = Array.isArray(schedulesQ.data) ? schedulesQ.data : [];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date();   end.setHours(23, 59, 59, 999);

    const groups = new Map();
    for (const s of all) {
      if (s.status !== 'scheduled') continue;
      const d = new Date(s.date);
      if (isNaN(d) || d < start || d > end) continue;

      const minuteKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
      const postKey = typeof s.postId === 'object' && s.postId?._id ? s.postId._id : (s.postId || '');
      const key = `${minuteKey}|${s.subject}|${s.type || 'regular'}|${postKey}`;

      const current = groups.get(key) || {
        date: d,
        subject: s.subject,
        type: s.type || 'regular',
        postId: postKey,
        count: 0,
      };
      const added = Array.isArray(s.studentIds) ? s.studentIds.length : 1;
      current.count += added;
      groups.set(key, current);
    }

    return Array.from(groups.values()).sort((a, b) => a.date - b.date);
  }, [schedulesQ.data]);

  return (
    <aside className="w-[300px] bg-white/70 backdrop-blur-sm p-6 border-l border-slate-200 flex-shrink-0 min-h-screen hidden md:block">
      {/* Announcements */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 mr-2">📢</span>
          <h3 className="text-base font-semibold text-gray-900">Announcements</h3>
        </div>
        <div className="space-y-3">
          {(announcements || []).map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-white shadow-sm border border-slate-200 hover:shadow-md transition"
            >
              <p className="text-sm text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Schedule (grouped) */}
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
                key={`${g.postId}-${g.subject}-${g.type}-${g.date.getTime()}-${idx}`}
                className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border border-slate-200 hover:shadow-md transition"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {g.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {g.subject}
                  </div>
                  {g.type === 'demo' && (
                    <div className="text-[11px] text-slate-500">Demo class</div>
                  )}
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
    </aside>
  );
}

/* ---------------- Main area that needs React Query ---------------- */
function MainArea() {
  const schedulesQ = useTeacherSchedules();

  // Build a unique student list from schedules (no random avatars)
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
        if (!map.has(id)) {
          map.set(id, { id, name, img });
        }
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
  const [client] = useState(() => new QueryClient());

  // Pull teacher info from Redux (prefer teacherDashboard.teacher, fallback to userInfo)
  const { teacherDashboard, userInfo } = useSelector((state) => state.user);
  const teacherObj = teacherDashboard?.teacher || userInfo || {};
  const teacherName = teacherObj?.name || 'Teacher';
  const teacherImage = teacherObj?.profileImage;

  // 🔄 live-refresh schedules via socket
  useEffect(() => {
    let detach = () => {};
    let tries = 0;
    const maxTries = 20;

    const attach = () => {
      const s = typeof window !== 'undefined' ? window.socket : null;
      if (!s) return false;

      const shouldRefresh = (t) =>
        t === 'new_schedule' ||
        t === 'schedule_cancelled' ||
        t === 'schedule_updated' ||
        t === 'schedule_proposal_update' ||
        t === 'schedule_response' ||
        (typeof t === 'string' && t.startsWith('routine_')) ||
        t === 'schedules_refresh';

      const onNotif = () => {
        client.invalidateQueries({ queryKey: ['schedules'] });
      };

      const onRefresh = () => {
        client.invalidateQueries({ queryKey: ['schedules'] });
      };

      s.on('new_notification', onNotif);
      s.on('schedules_refresh', onRefresh);

      detach = () => {
        s.off('new_notification', onNotif);
        s.off('schedules_refresh', onRefresh);
      };

      return true;
    };

    if (!attach()) {
      const id = setInterval(() => {
        tries += 1;
        if (attach() || tries >= maxTries) clearInterval(id);
      }, 500);
      return () => {
        clearInterval(id);
        detach();
      };
    }

    return () => detach();
  }, [client]);

  return (
    <QueryClientProvider client={client}>
      <div className="flex w-full h-screen bg-gradient-to-b from-white to-slate-50">
        <Sidebar
          onOpen={() => setOpen(true)}
          teacherName={teacherName}
          teacherImage={teacherImage}
        />
        <main className="flex-1 overflow-y-auto">
          <MainArea />
        </main>
        <RightSidebarDynamic announcements={ANNOUNCEMENTS} />
        <FixScheduleModal open={open} onClose={() => setOpen(false)} />
      </div>
    </QueryClientProvider>
  );
}
