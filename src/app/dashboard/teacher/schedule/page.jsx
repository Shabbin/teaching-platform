'use client';
import React, { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FixScheduleModal from '../../components/scheduleComponents/fixScheduleModal'; // ⬅️ your path
import { useTeacherSchedules } from '../../../hooks/useSchedules'; // ⬅️ new hook

// --- Your original static bits (unchanged) ---
const SUBJECTS = [
  { name: 'Physics', studentsCount: 3 },
  { name: 'Chemistry', studentsCount: 4 },
  { name: 'Mathematics', studentsCount: 2 },
];
const STUDENTS = [
  { name: 'Fatima', img: 'https://i.pravatar.cc/60?img=1' },
  { name: 'Rafi', img: 'https://i.pravatar.cc/60?img=2' },
  { name: 'Rina', img: 'https://i.pravatar.cc/60?img=3' },
  { name: 'Tanvir', img: 'https://i.pravatar.cc/60?img=4' },
];
const ANNOUNCEMENTS = ['Physics class moved to Friday', 'New video uploaded: Motion'];

const Sidebar = ({ onOpen }) => (
  <aside className="w-[250px] bg-gradient-to-b from-indigo-600 to-indigo-700 text-white p-5 flex flex-col flex-shrink-0">
    <div className="text-center mb-8">
      <img
        src="https://i.pravatar.cc/100"
        alt="Profile"
        className="w-20 h-20 rounded-full border-2 border-white object-cover mx-auto ring-2 ring-white/30"
      />
      <h3 className="mt-2 text-lg font-medium">Mr. Ahmed</h3>
    </div>
    <nav className="flex flex-col gap-2 mt-5">
      <button
        onClick={onOpen}
        className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-sm text-slate-200 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        Fix Schedule
      </button>
      {['Students', 'Exam Scheduler', 'Classroom Settings'].map((item) => (
        <a
          key={item}
          href="#"
          className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-sm text-slate-200 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {item}
        </a>
      ))}
    </nav>
  </aside>
);

const ClassOverview = ({ subjects }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Overview</h2>
    <div className="flex flex-wrap gap-5">
      {subjects.map(({ name, studentsCount }) => (
        <div
          key={name}
          className="bg-white p-5 rounded-xl shadow-sm w-48 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition"
        >
          <h3 className="text-base font-semibold text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-slate-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100">
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
      {students.map(({ name, img }) => (
        <div key={name} className="flex flex-col items-center flex-shrink-0">
          <img
            src={img}
            alt={name}
            className="w-[60px] h-[60px] rounded-full object-cover ring-2 ring-indigo-300"
          />
          <p className="text-xs mt-1 text-gray-700">{name}</p>
        </div>
      ))}
    </div>
  </section>
);

// Right sidebar now fetches teacher schedules and shows TODAY
function RightSidebarDynamic({ announcements }) {
  const schedulesQ = useTeacherSchedules();

  const todayItems = useMemo(() => {
    const all = schedulesQ.data || [];
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date();   end.setHours(23,59,59,999);
    return all.filter(s => {
      const d = new Date(s.date);
      return s.status === 'scheduled' && d >= start && d <= end;
    });
  }, [schedulesQ.data]);

  return (
    <aside className="w-[300px] bg-gradient-to-b from-indigo-50 to-white p-6 border-l border-indigo-100 flex-shrink-0 min-h-screen hidden md:block">
      {/* Announcements */}
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

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center mb-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 mr-2">📅</span>
          <h3 className="text-base font-semibold text-gray-900">Today’s Schedule</h3>
        </div>

        {schedulesQ.isLoading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : (
          <div className="space-y-3">
            {todayItems.length === 0 ? (
              <div className="text-sm text-slate-500">No classes scheduled today.</div>
            ) : (
              todayItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border border-indigo-100 hover:shadow-md transition">
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {item.subject}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// --- Mount a local QueryClient just for this page ---
export default function TeacherClassroom() {
  const [open, setOpen] = useState(false);
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <div className="flex w-full h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Sidebar onOpen={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <ClassOverview subjects={SUBJECTS} />
            <StudentList students={STUDENTS} />
          </div>
        </main>
        <RightSidebarDynamic announcements={ANNOUNCEMENTS} />

        <FixScheduleModal open={open} onClose={() => setOpen(false)} />
      </div>
    </QueryClientProvider>
  );
}
