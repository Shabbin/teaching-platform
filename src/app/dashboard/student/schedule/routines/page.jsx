// src/app/dashboard/student/schedule/routines/page.jsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import API from '../../../../../api/axios';
import useSocket from '../../../../hooks/useSocket';
import { getStudentRoutines } from '../../../../../api/routines';
import { useRouter, usePathname } from 'next/navigation';

/** ---------- HELPERS ---------- */
const formatDhaka = (iso) => {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d)) return 'TBD';
  const datePart = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Dhaka',
  });
  const timePart = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Dhaka',
  });
  return `${datePart}, ${timePart}`;
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
    const tName = s.teacherId?.name || 'Teacher';
    const tAvatar = s.teacherId?.profileImage || 'https://i.pravatar.cc/100?img=12';

    if (!byTeacher.has(tKey)) {
      byTeacher.set(tKey, {
        id: String(tRaw),
        name: tName,
        avatar: tAvatar,
        courses: new Map(),
      });
    }
    const t = byTeacher.get(tKey);

    const pRaw = (s.postId && (s.postId._id || s.postId)) || 'unknown-post';
    const pKey = `p:${pRaw}`;
    const pTitle = s.postId?.title || 'Untitled Course';
    const courseSubject = s.subject || '—';

    if (!t.courses.has(pKey)) {
      t.courses.set(pKey, {
        id: String(pRaw),
        title: pTitle,
        subject: courseSubject,
        classes: [],
      });
    }
    const c = t.courses.get(pKey);

    const name =
      s.type === 'demo'
        ? `Demo class-${typeof s.sequenceNumber === 'number' ? s.sequenceNumber : '?'}`
        : 'Class';

    c.classes.push({
      id: s._id,
      name,
      date: s.date,
      type: s.type,
      status: s.status,
      participantsCount:
        s.participantsCount || (Array.isArray(s.studentIds) ? s.studentIds.length : 1),
    });
  }

  const teachers = Array.from(byTeacher.values()).map((t) => ({
    id: t.id,
    name: t.name,
    avatar: t.avatar,
    courses: Array.from(t.courses.values()).map((c) => ({
      ...c,
      classes: c.classes.sort((a, b) => new Date(a.date) - new Date(b.date)),
    })),
  }));

  teachers.sort((a, b) => a.name.localeCompare(b.name));
  return teachers;
}

/** ---------- LEFT SIDEBAR (with navigation + active highlight) ---------- */
function StudentSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href) => pathname === href;
  const itemClass = (active) =>
    `rounded-lg px-3 py-2 text-sm text-left transition border ${
      active
        ? 'bg-slate-900 text-white border-slate-900'
        : 'text-slate-700 hover:bg-slate-50 border-transparent hover:border-slate-200'
    }`;

  const go = (href) => () => router.push(href);

  return (
    <aside className="w-[260px] bg-white/70 backdrop-blur-sm border-r border-slate-200 p-6 flex flex-col flex-shrink-0">
      <div className="text-center mb-6">
        <img
          src="https://i.pravatar.cc/100?img=12"
          alt="Student"
          className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-slate-200"
        />
        <h3 className="mt-2 text-base font-semibold text-slate-800">Rafi</h3>
      </div>

      <h4 className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Menu</h4>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={go('/dashboard/student/schedule')}
          className={itemClass(isActive('/dashboard/student/schedule'))}
        >
          <span className="mr-2">📅</span>My Schedule
        </button>

        <button
          type="button"
          onClick={go('/dashboard/student/schedule/routines')}
          className={itemClass(isActive('/dashboard/student/schedule/routines'))}
        >
          <span className="mr-2">🔁</span>Regular Routine
        </button>

        <button type="button" className={itemClass(false)}>
          <span className="mr-2">🔎</span>Find Teachers
        </button>
        <button type="button" className={itemClass(false)}>
          <span className="mr-2">✉️</span>Messages
        </button>
        <button type="button" className={itemClass(false)}>
          <span className="mr-2">⚙️</span>Settings
        </button>
      </div>
    </aside>
  );
}

/** ---------- ROUTINE LIST (student view) ---------- */
function RoutineList({ routines }) {
  if (!Array.isArray(routines) || routines.length === 0) return null;

  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fmtNext = (iso, tz = 'Asia/Dhaka') =>
    iso
      ? new Date(iso).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: tz,
        })
      : '';

  return (
    <section className="mb-6">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Regular Routine</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {routines.map((r) => (
          <div key={r._id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <img
                src={r.teacher?.profileImage || 'https://i.pravatar.cc/80'}
                alt=""
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900">
                  {r.teacher?.name || 'Teacher'} • {r.post?.title || 'Course'}
                </div>
                <div className="text-[12px] text-slate-500">
                  {(Array.isArray(r.post?.subjects)
                    ? r.post.subjects.join(' | ')
                    : r.post?.subjects) || '—'}
                </div>
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                {r.status}
              </span>
            </div>

            <ul className="mt-3 text-sm text-slate-700 space-y-1">
              {(r.slots || []).map((s, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>
                    {day[s.weekday]} • {s.timeHHMM}
                  </span>
                  <span className="text-xs text-slate-500">{s.durationMinutes} mins</span>
                </li>
              ))}
            </ul>

            {!!(r.slots || []).length && (
              <div className="mt-3 text-[12px] text-slate-500">
                Next{' '}
                {fmtNext(
                  (r.slots || [])
                    .map((s) => s.nextRunAt)
                    .filter(Boolean)
                    .sort((a, b) => new Date(a) - new Date(b))[0],
                  r.timezone || 'Asia/Dhaka'
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** ---------- MAIN: TEACHER-SECTIONS ---------- */
function TeacherSections({ teachers, onPay }) {
  const [openPayFor, setOpenPayFor] = useState(null); // teacherId | null
  const toggleMenu = (teacherId) =>
    setOpenPayFor((cur) => (cur === teacherId ? null : teacherId));

  return (
    <section className="space-y-6">
      {teachers.map((t) => {
        const completedDemos = t.courses.reduce(
          (acc, c) =>
            acc +
            c.classes.filter((cl) => cl.type === 'demo' && cl.status === 'completed').length,
          0
        );

        return (
          <div
            key={t.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Teacher header */}
            <div className="relative flex items-center gap-4 p-5 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-12 h-12 rounded-full ring-2 ring-slate-200 object-cover"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">{t.name}</h3>
                <p className="text-[11px] text-slate-500">Courses: {t.courses.length}</p>
              </div>

              {/* Pay control near teacher name */}
              <div className="ml-auto relative">
                <button
                  type="button"
                  onClick={() => toggleMenu(t.id)}
                  className="rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 text-sm shadow-sm"
                >
                  Pay ▾
                </button>

                {completedDemos >= 3 && (
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200">
                    3 demos used
                  </span>
                )}

                {openPayFor === t.id && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-md z-20">
                    <div className="px-3 py-2 text-[11px] text-slate-500 border-b">Choose plan</div>

                    {t.courses.length === 1 ? (
                      <div className="p-3 flex gap-2">
                        <button
                          onClick={() => {
                            setOpenPayFor(null);
                            onPay(t.id, t.courses[0].id, 'HALF');
                          }}
                          className="flex-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-sm"
                        >
                          Pay Half
                        </button>
                        <button
                          onClick={() => {
                            setOpenPayFor(null);
                            onPay(t.id, t.courses[0].id, 'FULL');
                          }}
                          className="flex-1 rounded-md bg-slate-900 hover:bg-black text-white px-3 py-2 text-sm"
                        >
                          Pay Full
                        </button>
                      </div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto">
                        {t.courses.map((c) => (
                          <li key={c.id} className="px-3 py-2 border-t first:border-t-0">
                            <div className="text-xs font-medium text-slate-700 truncate">
                              {c.title}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => {
                                  setOpenPayFor(null);
                                  onPay(t.id, c.id, 'HALF');
                                }}
                                className="flex-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-2 py-1.5 text-xs"
                              >
                                Half
                              </button>
                              <button
                                onClick={() => {
                                  setOpenPayFor(null);
                                  onPay(t.id, c.id, 'FULL');
                                }}
                                className="flex-1 rounded-md bg-slate-900 hover:bg-black text-white px-2 py-1.5 text-xs"
                              >
                                Full
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Courses grid */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {t.courses.map((course) => (
                <div
                  key={course.id}
                  className="border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition"
                >
                  <div className="mb-2">
                    <h4 className="text-sm font-semibold text-slate-900">{course.title}</h4>
                    <p className="text-[12px] text-slate-600">
                      Subject{' '}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-slate-800 bg-slate-100 ring-1 ring-slate-200 ml-1">
                        {course.subject}
                      </span>
                    </p>
                  </div>

                  <ul className="mt-3 divide-y divide-slate-100">
                    {course.classes.map((cls) => {
                      const cancelled = cls.status === 'cancelled';
                      const completed = cls.status === 'completed';
                      return (
                        <li
                          key={cls.id}
                          className={`flex items-center justify-between py-2.5 ${
                            cancelled ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[13px] ${
                                cancelled ? 'line-through text-slate-500' : 'text-slate-800'
                              }`}
                            >
                              {cls.name}
                            </span>
                            {cls.type === 'demo' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                                Demo
                              </span>
                            )}
                            {completed && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-emerald-200">
                                Completed
                              </span>
                            )}
                            {cancelled && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-rose-200">
                                Cancelled
                              </span>
                            )}
                          </div>
                          <span className="text-[12px] text-slate-500">
                            {formatDhaka(cls.date)}
                            {cls.participantsCount > 1 ? ` • Group (${cls.participantsCount})` : ''}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** ---------- RIGHT SIDEBAR ---------- */
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
    <aside className="w-[300px] bg-white/70 backdrop-blur-sm p-6 border-l border-slate-200 flex-shrink-0 min-h-screen hidden lg:block">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Announcements</h3>
        <div className="rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-700 shadow-sm">
          Your classes update live as teachers schedule or cancel.
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Today’s Schedule</h3>
        {todayItems.length === 0 ? (
          <div className="text-sm text-slate-500">No classes scheduled today.</div>
        ) : (
          <div className="space-y-3">
            {todayItems.map((it) => (
              <div key={it.id} className="p-3 rounded-xl bg-white shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">
                    {new Date(it.time).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'Asia/Dhaka',
                    })}{' '}
                    — {it.subject}
                  </div>
                  {it.status !== 'scheduled' && (
                    <span
                      className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ring-1 ${
                        it.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-rose-50 text-rose-700 ring-rose-200'
                      }`}
                    >
                      {it.status}
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-slate-500">{it.teacher}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

/** ---------- PAGE ---------- */
export default function StudentScheduleRoutinesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [routines, setRoutines] = useState([]);

  // current user id for socket hook
  const userId = useSelector((s) => s?.auth?.user?._id);

  // schedules for right sidebar
  const fetchSchedules = async () => {
    try {
      setError('');
      setLoading(true);

      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      const to = new Date(now);
      to.setDate(to.getDate() + 30);

      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      }).toString();

      const res = await API.get(`/schedules/student?${params}`);
      const list = Array.isArray(res.data) ? res.data : [];
      setTeachers(buildTeachers(list));
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.normalizedMessage || 'Failed to load schedules.'
      );
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // routines list
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live refresh (no agreements on this page)
  const refreshTimer = useRef(null);
  const scheduleTypes = useRef(
    new Set(['new_schedule', 'schedule_cancelled', 'schedule_updated', 'schedules_refresh', 'routine_created', 'routine_refresh'])
  );

  useSocket(
    userId,
    undefined, // onNewMessage
    undefined, // onRequestUpdate
    undefined, // onMessageAlert
    (notification) => {
      const t = notification?.type;
      if (scheduleTypes.current.has(t)) {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => {
          fetchSchedules();
          fetchRoutinesList();
        }, 150);
      }
    }
  );

  // dummy payment handler kept (used in TeacherSections)
  const onPay = async (teacherId, postId, plan /* 'HALF'|'FULL' */) => {
    try {
      const feeRaw = window.prompt('Enter monthly fee (BDT):', '3000');
      const monthlyFee = Number(feeRaw || 0);
      if (!monthlyFee) return;

      const fraction = plan === 'HALF' ? 0.5 : 1;
      const body = {
        teacherId,
        postId,
        monthlyFee,
        phase: 'FIRST',
        fraction,
        monthIndex: 1,
        returnUrl: window.location.href,
      };

      const r = await API.post('/payments/tuition/initiate', body);
      const url = r?.data?.url;
      if (url) window.location.href = url;
      else alert('Could not start payment. Try again.');
    } catch (e) {
      alert(e?.response?.data?.error || e?.normalizedMessage || 'Payment initiation failed');
    }
  };

  return (
    <div className="flex w-full h-screen bg-gradient-to-b from-white to-slate-50">
      <StudentSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Regular Routine section only (no agreements on this page) */}
          <RoutineList routines={routines} />

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Teachers & Courses</h2>
            <p className="text-sm text-slate-500">A clear view of your upcoming lessons.</p>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : error ? (
            <div className="text-sm text-rose-600">{error}</div>
          ) : teachers.length === 0 ? (
            <div className="text-sm text-slate-500">
              No classes yet. You’ll see them here when teachers schedule.
            </div>
          ) : (
            <TeacherSections teachers={teachers} onPay={onPay} />
          )}
        </div>
      </main>

      <RightSidebar teachers={teachers} />
    </div>
  );
}
