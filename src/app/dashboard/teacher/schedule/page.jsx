'use client';
import React from 'react';

// Sample data
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

const ANNOUNCEMENTS = [
  'Physics class moved to Friday',
  'New video uploaded: Motion',
];

const SCHEDULE = ['9:00 AM – Physics', '11:00 AM – Chemistry'];

// Left Sidebar
// Left Sidebar
const Sidebar = () => (
  <aside className="w-[250px] bg-[oklch(0.55_0.28_296.83)] text-white p-5 flex flex-col flex-shrink-0">
    <div className="text-center mb-8">
      <img
        src="https://i.pravatar.cc/100"
        alt="Profile"
        className="w-20 h-20 rounded-full border-2 border-white object-cover mx-auto"
      />
      <h3 className="mt-2 text-lg font-medium">Mr. Ahmed</h3>
    </div>

    <nav className="flex flex-col gap-2 mt-5">
      {['Students', 'Fix Schedule', 'Exam Scheduler', 'Classroom Settings'].map((item) => (
        <a
          key={item}
          href="#"
          className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
        >
          {item}
        </a>
      ))}
    </nav>
  </aside>
);


// Class Overview Cards
const ClassOverview = ({ subjects }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold mb-4">Class Overview</h2>
    <div className="flex flex-wrap gap-5">
      {subjects.map(({ name, studentsCount }) => (
        <div key={name} className="bg-white p-5 rounded-xl shadow-sm w-48">
          <h3 className="text-base font-semibold mb-1">{name}</h3>
          <p className="text-sm text-slate-600">Students: {studentsCount}</p>
        </div>
      ))}
    </div>
  </section>
);

// Student Avatars
const StudentList = ({ students }) => (
  <section>
    <h2 className="text-lg font-semibold mb-4">Your Students</h2>
    <div className="flex flex-wrap gap-4">
      {students.map(({ name, img }) => (
        <div key={name} className="flex flex-col items-center flex-shrink-0">
          <img
            src={img}
            alt={name}
            className="w-[60px] h-[60px] rounded-full object-cover"
          />
          <p className="text-xs mt-1">{name}</p>
        </div>
      ))}
    </div>
  </section>
);

// Right Sidebar
const RightSidebar = ({ announcements, schedule }) => (
  <aside className="w-[280px] bg-[#f8fafc] p-5 border-l border-slate-300 flex-shrink-0 min-h-screen hidden md:block">
    <div className="mb-8">
      <h3 className="text-base font-semibold mb-3">📢 Announcements</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {announcements.map((item, i) => (
          <li key={i} className="text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
    <div>
      <h3 className="text-base font-semibold mb-3">📅 Today’s Schedule</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {schedule.map((item, i) => (
          <li key={i} className="text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

// Main Page
export default function TeacherClassroom() {
  return (
    <div className="flex w-full h-screen ">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
       
          <ClassOverview subjects={SUBJECTS} />
          <StudentList students={STUDENTS} />
        </div>
      </main>
      <RightSidebar announcements={ANNOUNCEMENTS} schedule={SCHEDULE} />
    </div>
  );
}
