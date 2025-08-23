'use client';
import React, { useMemo } from 'react';

/** ---------- HELPERS ---------- */
const formatDhaka = (iso) => {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d)) return 'TBD';
  const datePart = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Dhaka',
  }); // "23 Aug"
  const timePart = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Dhaka',
  }); // "16:30"
  return `${datePart}, ${timePart}`;
};

// Key like "2025-08-23" in Asia/Dhaka for day-equality
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

/** ---------- DATA (teacher → many courses → classes) ---------- */
const TEACHERS = [
  {
    id: 't1',
    name: "Teacher's name",
    avatar: 'https://i.pravatar.cc/100?img=32',
    courses: [
      {
        id: 't1-phy',
        title: 'Physics for everyone',
        subject: 'Physics',
        classes: [
          { id: 'p1', name: 'Class-1', date: '2025-08-23T16:30:00+06:00' }, // 23 Aug, 16:30
          { id: 'p2', name: 'Class-2', date: '2025-08-28T16:30:00+06:00' }, // 28 Aug, 16:30
          { id: 'p3', name: 'Class-3', date: null }, // not scheduled yet
        ],
      },
      {
        id: 't1-chem',
        title: 'Chemistry for everyone',
        subject: 'Chemistry',
        classes: [
          { id: 'c1', name: 'Class-1', date: '2025-08-23T18:00:00+06:00' }, // 23 Aug, 18:00
          { id: 'c2', name: 'Class-2', date: '2025-08-29T18:00:00+06:00' }, // 29 Aug, 18:00
        ],
      },
      {
        id: 't1-math',
        title: 'Mathematics for everyone',
        subject: 'Mathematics',
        classes: [
          { id: 'm1', name: 'Class-1', date: '2025-08-27T17:00:00+06:00' }, // 27 Aug, 17:00
          { id: 'm2', name: 'Class-2', date: null }, // not scheduled yet
        ],
      },
    ],
  },

  /* -------- NEW TEACHERS -------- */

  {
    id: 't2',
    name: 'Farhana Akter',
    avatar: 'https://i.pravatar.cc/100?img=45',
    courses: [
      {
        id: 't2-bio',
        title: 'Biology Basics',
        subject: 'Biology',
        classes: [
          { id: 'b1', name: 'Class-1', date: '2025-08-24T15:00:00+06:00' }, // today 15:00
          { id: 'b2', name: 'Class-2', date: '2025-08-30T15:00:00+06:00' },
        ],
      },
      {
        id: 't2-sci',
        title: 'Science Lab Skills',
        subject: 'Science',
        classes: [
          { id: 's1', name: 'Class-1', date: '2025-08-26T11:00:00+06:00' },
          { id: 's2', name: 'Class-2', date: null },
        ],
      },
    ],
  },

  {
    id: 't3',
    name: 'Neel Khan',
    avatar: 'https://i.pravatar.cc/100?img=5',
    courses: [
      {
        id: 't3-cs1',
        title: 'Programming 101',
        subject: 'Computer Science',
        classes: [
          { id: 'cs1', name: 'Class-1', date: '2025-08-24T20:00:00+06:00' }, // today 20:00
          { id: 'cs2', name: 'Class-2', date: '2025-08-31T20:00:00+06:00' },
        ],
      },
      {
        id: 't3-algo',
        title: 'Algorithms Made Easy',
        subject: 'Computer Science',
        classes: [{ id: 'a1', name: 'Class-1', date: '2025-09-02T19:00:00+06:00' }],
      },
    ],
  },

  {
    id: 't4',
    name: 'Arif Chowdhury',
    avatar: 'https://i.pravatar.cc/100?img=14',
    courses: [
      {
        id: 't4-bn',
        title: 'Bangla Literature Classics',
        subject: 'Bangla',
        classes: [
          { id: 'bn1', name: 'Class-1', date: '2025-08-25T17:30:00+06:00' },
          { id: 'bn2', name: 'Class-2', date: '2025-08-28T17:30:00+06:00' },
        ],
      },
      {
        id: 't4-eng',
        title: 'English Grammar Essentials',
        subject: 'English',
        classes: [
          { id: 'e1', name: 'Class-1', date: '2025-08-27T18:30:00+06:00' },
          { id: 'e2', name: 'Class-2', date: null },
        ],
      },
    ],
  },
];

const ANNOUNCEMENTS = [
  'Physics class moved to Friday',
  'New video uploaded: Motion',
];

/** ---------- LEFT SIDEBAR ---------- */
function StudentSidebar({ teachers, selectedTeacherId, onSelect }) {
  return (
    <aside className="w-[260px] bg-gradient-to-b from-indigo-600 to-indigo-700 text-white p-5 flex flex-col flex-shrink-0">
      {/* Student mini-profile */}
      <div className="text-center mb-6">
        <img
          src="https://i.pravatar.cc/100?img=12"
          alt="Student"
          className="w-20 h-20 rounded-full border-2 border-white object-cover mx-auto ring-2 ring-white/30"
        />
        <h3 className="mt-2 text-lg font-medium">Rafi</h3>
      </div>

      {/* Teacher selector */}
      <h4 className="text-sm uppercase tracking-wide text-white/80 mb-2">Teachers</h4>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSelect('all')}
          className={`rounded-lg px-3 py-2 text-sm transition-colors text-left focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
            selectedTeacherId === 'all'
              ? 'bg-white/90 text-indigo-700'
              : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white'
          }`}
        >
          All teachers
        </button>

        {teachers.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`rounded-lg px-3 py-2 text-sm transition-colors text-left focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
              selectedTeacherId === t.id
                ? 'bg-white/90 text-indigo-700'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </aside>
  );
}

/** ---------- MAIN: TEACHER-SECTIONS ---------- */
function TeacherSections({ teachers }) {
  return (
    <section className="space-y-8">
      {teachers.map((t) => (
        <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Teacher header */}
          <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100">
            <img
              src={t.avatar}
              alt={t.name}
              className="w-12 h-12 rounded-full ring-2 ring-indigo-200 object-cover"
            />
            <div>
              <h3 className="text-base font-semibold text-gray-900">{t.name}</h3>
              <p className="text-xs text-slate-600">Courses: {t.courses.length}</p>
            </div>
          </div>

          {/* Courses grid (each with subject + classes) */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.courses.map((course) => (
              <div
                key={course.id}
                className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition"
              >
                <div className="mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">{course.title}</h4>
                  <p className="text-xs text-slate-600">
                    Subject:{' '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100">
                      {course.subject}
                    </span>
                  </p>
                </div>

                <ul className="mt-2 divide-y divide-slate-100">
                  {course.classes.map((cls) => (
                    <li key={cls.id} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-800">{cls.name}</span>
                      <span className="text-xs text-slate-500">{formatDhaka(cls.date)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/** ---------- RIGHT SIDEBAR (Announcements + Today) ---------- */
function RightSidebar({ announcements, teachers }) {
  const todayItems = useMemo(() => {
    const now = new Date();
    const all = [];
    teachers.forEach((t) =>
      t.courses.forEach((c) =>
        c.classes.forEach((cls) => {
          if (!cls.date) return;
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
          {announcements.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-white shadow-sm border border-indigo-100 hover:shadow-md transition">
              <p className="text-sm text-slate-700">{item}</p>
            </div>
          ))}
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
  const [selectedTeacherId, setSelectedTeacherId] = React.useState('all');

  const visibleTeachers = useMemo(() => {
    if (selectedTeacherId === 'all') return TEACHERS;
    return TEACHERS.filter((t) => t.id === selectedTeacherId);
  }, [selectedTeacherId]);

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <StudentSidebar
        teachers={TEACHERS}
        selectedTeacherId={selectedTeacherId}
        onSelect={setSelectedTeacherId}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Teachers & Courses</h2>
          <TeacherSections teachers={visibleTeachers} />
        </div>
      </main>
      <RightSidebar announcements={ANNOUNCEMENTS} teachers={visibleTeachers} />
    </div>
  );
}
