'use client';
import React, { useEffect, useMemo, useState } from 'react';
import API from '../../../api/axios';

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
    const tId = s.teacherId?._id || 'unknown';
    const tName = s.teacherId?.name || 'Teacher';
    const tAvatar = s.teacherId?.profileImage || 'https://i.pravatar.cc/100?img=12';

    if (!byTeacher.has(tId)) {
      byTeacher.set(tId, {
        id: tId,
        name: tName,
        avatar: tAvatar,
        courses: new Map(),
      });
    }
    const t = byTeacher.get(tId);

    const pId = s.postId?._id || 'unknown-post';
    const pTitle = s.postId?.title || 'Untitled Course';
    const courseSubject = s.subject || '—';

    if (!t.courses.has(pId)) {
      t.courses.set(pId, {
        id: pId,
        title: pTitle,
        subject: courseSubject,
        classes: [],
      });
    }
    const c = t.courses.get(pId);

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
      participantsCount: s.participantsCount || 1,
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

/** ---------- LEFT SIDEBAR (no teacher selector) ---------- */
function StudentSidebar() {
  return (
    <aside className="w-[260px] bg-gradient-to-b from-indigo-600 to-indigo-700 text-white p-5 flex flex-col flex-shrink-0">
      <div className="text-center mb-6">
        <img
          src="https://i.pravatar.cc/100?img=12"
          alt="Student"
          className="w-20 h-20 rounded-full border-2 border-white object-cover mx-auto ring-2 ring-white/30"
        />
        <h3 className="mt-2 text-lg font-medium">Rafi</h3>
      </div>

      <h4 className="text-sm uppercase tracking-wide text-white/80 mb-2">Menu</h4>
      <div className="flex flex-col gap-2">
        {[
          { label: 'My Courses', icon: '📚' },
          { label: 'Find Teachers', icon: '🔎' },
          { label: 'Messages', icon: '✉️' },
          { label: 'Settings', icon: '⚙️' },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            className="rounded-lg px-3 py-2 text-sm transition-colors text-left bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <span className="mr-2">{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

/** ---------- MAIN: TEACHER-SECTIONS ---------- */
function TeacherSections({ teachers, onPay }) {
  const [openPayFor, setOpenPayFor] = useState(null); // teacherId | null

  const toggleMenu = (teacherId) =>
    setOpenPayFor((cur) => (cur === teacherId ? null : teacherId));

  return (
    <section className="space-y-8">
      {teachers.map((t) => {
        const completedDemos = t.courses.reduce(
          (acc, c) => acc + c.classes.filter((cl) => cl.type === 'demo' && cl.status === 'completed').length,
          0
        );

        return (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Teacher header */}
            <div className="relative flex items-center gap-4 p-5 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-12 h-12 rounded-full ring-2 ring-indigo-200 object-cover"
              />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">{t.name}</h3>
                <p className="text-xs text-slate-600">Courses: {t.courses.length}</p>
              </div>

              {/* Pay control near teacher name */}
              <div className="ml-auto relative">
                <button
                  type="button"
                  onClick={() => toggleMenu(t.id)}
                  className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-sm shadow"
                >
                  Pay ▾
                </button>

                {/* Small hint chip if gate reached */}
                {completedDemos >= 3 && (
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200">
                    3 demos used
                  </span>
                )}

                {openPayFor === t.id && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 bg-white shadow-lg z-20">
                    <div className="px-3 py-2 text-[11px] text-slate-500 border-b">Choose plan</div>

                    {/* If one course → simple options; else list per course */}
                    {t.courses.length === 1 ? (
                      <div className="p-3 flex gap-2">
                        <button
                          onClick={() => { setOpenPayFor(null); onPay(t.id, t.courses[0].id, 'HALF'); }}
                          className="flex-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-sm"
                        >
                          Pay Half
                        </button>
                        <button
                          onClick={() => { setOpenPayFor(null); onPay(t.id, t.courses[0].id, 'FULL'); }}
                          className="flex-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm"
                        >
                          Pay Full
                        </button>
                      </div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto">
                        {t.courses.map((c) => (
                          <li key={c.id} className="px-3 py-2 border-t first:border-t-0">
                            <div className="text-xs font-medium text-slate-700 truncate">{c.title}</div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => { setOpenPayFor(null); onPay(t.id, c.id, 'HALF'); }}
                                className="flex-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-2 py-1.5 text-xs"
                              >
                                Half
                              </button>
                              <button
                                onClick={() => { setOpenPayFor(null); onPay(t.id, c.id, 'FULL'); }}
                                className="flex-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1.5 text-xs"
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
                  className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition"
                >
                  <div className="mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">{course.title}</h4>
                    <p className="text-xs text-slate-600">
                      Subject{' '}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 ml-1">
                        {course.subject}
                      </span>
                    </p>
                  </div>

                  <ul className="mt-2 divide-y divide-slate-100">
                    {course.classes.map((cls) => {
                      const cancelled = cls.status === 'cancelled';
                      const completed = cls.status === 'completed';
                      return (
                        <li key={cls.id} className={`flex items-center justify-between py-2 ${cancelled ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${cancelled ? 'line-through text-slate-500' : 'text-gray-800'}`}>
                              {cls.name}
                            </span>
                            {cls.type === 'demo' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                                Demo
                              </span>
                            )}
                            {completed && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                Completed
                              </span>
                            )}
                            {cancelled && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-100">
                                Cancelled
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
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
            });
          }
        })
      )
    );
    return all.sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [teachers]);

  return (
    <aside className="w-[320px] bg-gradient-to-b from-indigo-50 to-white p-6 border-l border-indigo-100 flex-shrink-0 min-h-screen hidden lg:block">
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 mr-2">📢</span>
          <h3 className="text-base font-semibold text-gray-900">Announcements</h3>
        </div>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-white shadow-sm border border-indigo-100 hover:shadow-md transition">
            <p className="text-sm text-slate-700">
              Your classes update live as teachers schedule or cancel.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 mr-2">📅</span>
          <h3 className="text-base font-semibold text-gray-900">Today’s Schedule</h3>
        </div>
        {todayItems.length === 0 ? (
          <div className="text-sm text-slate-500">No classes scheduled today.</div>
        ) : (
          <div className="space-y-3">
            {todayItems.map((it) => (
              <div key={it.id} className="p-3 rounded-lg bg-white shadow-sm border border-indigo-100">
                <div className="text-sm font-medium text-gray-800">
                  {new Date(it.time).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'Asia/Dhaka',
                  })}{' '}
                  — {it.subject}
                </div>
                <div className="text-xs text-slate-500">{it.teacher}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

/** ---------- PAGE ---------- */
export default function StudentSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);

  const fetchSchedules = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await API.get('/schedules/student');
      const list = Array.isArray(res.data) ? res.data : [];
      setTeachers(buildTeachers(list));
    } catch (e) {
      setError(e?.response?.data?.message || e?.normalizedMessage || 'Failed to load schedules.');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let socket;
    (async () => {
      try {
        const { io } = await import('socket.io-client');
        const url = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
        socket = io(url, { withCredentials: true });

        const handler = (payload) => {
          const t = payload?.type;
          if (t === 'new_schedule' || t === 'schedule_cancelled') {
            fetchSchedules();
          }
        };
        socket.on('new_notification', handler);
      } catch {}
    })();
    return () => { if (socket) socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPay = async (teacherId, postId, plan /* 'HALF'|'FULL' */) => {
    try {
      const feeRaw = window.prompt('Enter monthly fee (BDT):', '3000');
      const monthlyFee = Number(feeRaw || 0);
      if (!monthlyFee) return;

      const fraction = plan === 'HALF' ? 0.5 : 1;
      const body = {
        teacherId,
        postId,               // if null and multiple requests exist, backend should prefer requestId flow later
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
    <div className="flex w-full h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <StudentSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Teachers & Courses</h2>

          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : error ? (
            <div className="text-sm text-rose-600">{error}</div>
          ) : teachers.length === 0 ? (
            <div className="text-sm text-slate-500">No classes yet. You’ll see them here when teachers schedule.</div>
          ) : (
            <TeacherSections teachers={teachers} onPay={onPay} />
          )}
        </div>
      </main>

      <RightSidebar teachers={teachers} />
    </div>
  );
}
