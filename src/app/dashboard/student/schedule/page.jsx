// src/app/dashboard/student/schedule/page.jsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import API from '../../../../api/axios';
import useSocket from '../../../hooks/useSocket';

// ✅ routines APIs
import {
  getStudentRoutines,
  getStudentPendingRoutines,
  respondRoutineSafe,
} from '../../../../api/routines';

// ✅ one-off schedule proposal APIs (including demo invites)
import {
  getStudentPendingSchedules,
  respondScheduleSafe,
} from '../../../../api/schedules';

import { listIncomingRoutineChanges, respondRoutineChange } from '../../../../api/routineChanges';

// ✅ Enrollment invites (NEW)
import {
  listIncomingEnrollmentInvites,
  declineEnrollmentInvite,
} from '../../../../api/enrollmentInvites';

// ✅ Real payment redirect
import { startInvitePayment, startTuition } from '../../../../api/payments';

/* ---------- HELPERS ---------- */
const brand = 'oklch(0.49 0.25 277)';

const getImageUrl = (img) => {
  if (!img) return '/default-avatar.png';
  const s = String(img);
  if (s.startsWith('http') || s.startsWith('data:')) return s;
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${s}`;
};

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

/* ---------- TRANSFORM: schedules → teachers[] ---------- */
function buildTeachers(list) {
  const byTeacher = new Map();
  for (const s of list || []) {
    const tRaw = s.teacherId?._id || 'unknown';
    const tKey = `t:${tRaw}`;
    const tName = s.teacherId?.name || 'Teacher';
    const tAvatar = s.teacherId?.profileImage || ''; // leave blank; normalize on render

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

/* ---------- LEFT SIDEBAR (now uses real student name + image) ---------- */
function StudentSidebar({ studentName, studentImage }) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (path) => () => router.push(path);
  const isActive = (path) =>
    pathname === path || (path !== '/' && pathname?.startsWith(path));

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
          src={getImageUrl(studentImage)}
          alt={studentName || 'Student'}
          className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-slate-200"
        />
        <h3 className="mt-2 text-base font-semibold text-slate-800 truncate" title={studentName || 'Student'}>
          {studentName || 'Student'}
        </h3>
      </div>

      <h4 className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Menu</h4>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={go('/dashboard/student/schedule')}
          className={itemClass(isActive('/dashboard/student/schedule'))}
        >
          <span className="mr-2">🗓️</span>My Schedule
        </button>

        <button
          type="button"
          onClick={go('/dashboard/student/schedule/routines')}
          className={itemClass(isActive('/dashboard/student/schedule/routines'))}
        >
          <span className="mr-2">🔁</span>Regular Routine
        </button>

        <button
          type="button"
          onClick={go('/dashboard/student/courses')}
          className={itemClass(isActive('/dashboard/student/courses'))}
        >
          <span className="mr-2">📚</span>My Courses
        </button>

        <button
          type="button"
          onClick={go('/dashboard/student/find-teachers')}
          className={itemClass(isActive('/dashboard/student/find-teachers'))}
        >
          <span className="mr-2">🔎</span>Find Teachers
        </button>

        <button
          type="button"
          onClick={go('/dashboard/student/messages')}
          className={itemClass(isActive('/dashboard/student/messages'))}
        >
          <span className="mr-2">✉️</span>Messages
        </button>

        <button
          type="button"
          onClick={go('/dashboard/student/settings')}
          className={itemClass(isActive('/dashboard/student/settings'))}
        >
          <span className="mr-2">⚙️</span>Settings
        </button>
      </div>
    </aside>
  );
}

/* ---------- AGREEMENTS (unchanged UI; uses real teacher names from API) ---------- */
function Agreements({
  pendingSchedules,
  pendingRoutines,
  onAcceptSchedule,
  onRejectSchedule,
  onAcceptRoutine,
  onRejectRoutine,
  busyScheduleIds,
  busyRoutineIds,
  conflictMsg,
}) {
  const hasAny = (pendingSchedules?.length || 0) + (pendingRoutines?.length || 0) > 0;
  if (!hasAny) return null;

  return (
    <section className="mb-6">
      <h3 className="text-base font-semibold text-slate-900 mb-3">
        Requests (Need your agreement)
      </h3>

      {conflictMsg ? (
        <div className="mb-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {conflictMsg}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {(pendingSchedules || []).map((s) => {
          const busy = busyScheduleIds?.has?.(s._id);
          return (
            <div key={s._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-medium text-slate-900">
                Proposed {s.type === 'demo' ? 'demo' : 'class'} — {s.subject}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {formatDhaka(s.date)} • {s.durationMinutes} mins
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Teacher: {s.teacherId?.name || 'Teacher'}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => !busy && onRejectSchedule(s._id)}
                  className="px-3 py-1.5 rounded-lg border disabled:opacity-60"
                  disabled={!!busy}
                >
                  {busy ? 'Working…' : 'Reject'}
                </button>
                <button
                  onClick={() => !busy && onAcceptSchedule(s._id)}
                  className="px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
                  style={{ backgroundColor: brand }}
                  disabled={!!busy}
                >
                  {busy ? 'Working…' : 'Accept'}
                </button>
              </div>
            </div>
          );
        })}

        {(pendingRoutines || []).map((r) => {
          const busy = busyRoutineIds?.has?.(r._id);
          return (
            <div key={r._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-medium text-slate-900">
                Routine invite — {r.post?.title || 'Course'}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Timezone: {r.timezone || 'Asia/Dhaka'}
              </div>
              <ul className="mt-2 text-sm text-slate-700 space-y-1">
                {(r.slots || []).map((s, i) => {
                  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.weekday];
                  return (
                    <li key={`${r._id}-${i}`} className="flex items-center justify-between">
                      <span>{day} • {s.timeHHMM}</span>
                      <span className="text-xs text-slate-500">{s.durationMinutes} mins</span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => !busy && onRejectRoutine(r._id)}
                  className="px-3 py-1.5 rounded-lg border disabled:opacity-60"
                  disabled={!!busy}
                >
                  {busy ? 'Working…' : 'Reject'}
                </button>
                <button
                  onClick={() => !busy && onAcceptRoutine(r._id)}
                  className="px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
                  style={{ backgroundColor: brand }}
                  disabled={!!busy}
                >
                  {busy ? 'Working…' : 'Accept'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Enrollment Invites (unchanged UI) ---------- */
function EnrollmentInvites({ invites, actingId, onPayInvite, onDecline }) {
  if (!Array.isArray(invites) || invites.length === 0) return null;

  const moneyBDT = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;
  const remainingDue = (inv) => Math.max(0, Number(inv.upfrontDueTk || inv.advanceTk || 0) - Number(inv.paidTk || 0));

  return (
    <section className="mb-6">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Course Invites</h3>
      <div className="space-y-3">
        {invites.map((inv) => {
          const due = remainingDue(inv);
          const disabled = actingId === inv._id || inv.status !== 'pending' || due <= 0;
          return (
            <div key={inv._id} className="border rounded-xl p-4 bg-white">
              <div className="flex items-start gap-3">
                <div className="grow">
                  <div className="text-sm font-semibold">
                    {inv.courseTitle || inv?.postId?.title || 'Course'}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Fee: {moneyBDT(inv.courseFeeTk)} {' • '}
                    {inv.advanceTk
                      ? <>Advance required: {moneyBDT(inv.advanceTk)}</>
                      : <>Upfront due (15%): {moneyBDT(inv.upfrontDueTk)}</>}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Paid: {moneyBDT(inv.paidTk)} • Status: {inv.paymentStatus || 'unpaid'}
                  </div>
                  {inv.note && <div className="text-xs text-slate-600 mt-1">Note: {inv.note}</div>}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full ring-1 bg-amber-50 text-amber-700 ring-amber-200">
                  {inv.status}
                </span>
              </div>

              {inv.status === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={disabled}
                    onClick={() => onPayInvite(inv)}
                    className={`px-3 py-1.5 rounded-lg text-white ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: brand }}
                    title={due <= 0 ? 'No amount due' : undefined}
                  >
                    {due > 0 ? `Pay ${moneyBDT(due)} now` : 'Paid'}
                  </button>
                  <button
                    disabled={actingId === inv._id}
                    onClick={() => onDecline(inv._id)}
                    className="px-3 py-1.5 rounded-lg border"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Requests Inbox (unchanged UI) ---------- */
function RequestsInbox({ requests, onRespond }) {
  if (!Array.isArray(requests) || requests.length === 0) return null;
  return (
    <section className="mb-6">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Requests</h3>
      <div className="grid gap-3">
        {requests.map((r) => (
          <div key={r._id} className="bg-white border rounded-xl p-4">
            <div className="text-sm font-medium">Proposed one-off change</div>
            <div className="text-xs text-slate-600">
              {new Date(r.proposedDate).toLocaleString('en-GB', { hour12: false })} • {r.durationMinutes} mins
            </div>
            {r.note ? <div className="text-xs text-slate-500 mt-1">“{r.note}”</div> : null}
            <div className="mt-3 flex gap-2">
              <button onClick={() => onRespond(r._id, 'reject')} className="px-3 py-1.5 rounded-lg border">
                Reject
              </button>
              <button onClick={() => onRespond(r._id, 'accept')} className="px-3 py-1.5 rounded-lg text-white bg-slate-900 hover:bg-black">
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- ROUTINE LIST (student view) ---------- */
function RoutineList({ routines, meId, onConsent }) {
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
        {routines.map((r) => {
          const pendingSet = new Set((r.pendingBy || []).map(String));
          const mePending = meId && pendingSet.has(String(meId));
          const allAccepted =
            (r.requiresAcceptance && (r.pendingBy || []).length === 0) || !r.requiresAcceptance;

          return (
            <div key={r._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <img
                  src={getImageUrl(r.teacher?.profileImage)}
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
                <span
                  className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ring-1 ${
                    r.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : r.status === 'paused'
                      ? 'bg-amber-50 text-amber-700 ring-amber-200'
                      : 'bg-slate-100 text-slate-700 ring-slate-200'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <ul className="mt-3 text-sm text-slate-700 space-y-1">
                {(r.slots || []).map((s, i) => (
                  <li key={`${r._id}-slot-${i}`} className="flex items-center justify-between">
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

              {r.requiresAcceptance && (
                <div className="mt-3">
                  {mePending ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onConsent(r._id, 'accept')}
                        className="px-3 py-1.5 rounded-lg text-white"
                        style={{ backgroundColor: brand }}
                      >
                        Accept routine
                      </button>
                      <button
                        onClick={() => onConsent(r._id, 'reject')}
                        className="px-3 py-1.5 rounded-lg border"
                      >
                        Reject
                      </button>
                      <span className="text-[11px] text-slate-500">Waiting for your agreement</span>
                    </div>
                  ) : allAccepted ? (
                    <div className="text-[11px] text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded">
                      All students agreed
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-2 py-0.5 rounded">
                      Waiting for others to agree
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- MAIN: TEACHER-SECTIONS (normalize teacher avatars) ---------- */
function TeacherSections({ teachers, onPay }) {
  const [openPayFor, setOpenPayFor] = useState(null);
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
                src={getImageUrl(t.avatar)}
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
                          className={`flex items-center justify-between py-2.5 ${cancelled ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-[13px] ${cancelled ? 'line-through text-slate-500' : 'text-slate-800'}`}>
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

/* ---------- RIGHT SIDEBAR (unchanged; derives from teachers[]) ---------- */
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

/* ---------- PAGE ---------- */
export default function StudentSchedulePage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);

  // weekly routines + incoming change requests
  const [routines, setRoutines] = useState([]);
  const [incoming, setIncoming] = useState([]);

  // agreements (pending schedules + pending routines)
  const [pendingSchedules, setPendingSchedules] = useState([]);
  const [pendingRoutines, setPendingRoutines] = useState([]);

  // ✅ Enrollment invites
  const [enrollmentInvites, setEnrollmentInvites] = useState([]);
  const [actingInviteId, setActingInviteId] = useState(null);

  // prevent multi-click spam on Accept/Reject
  const [busyScheduleIds, setBusyScheduleIds] = useState(new Set());
  const [busyRoutineIds, setBusyRoutineIds] = useState(new Set());
  const addBusy = (setter, id) => setter((prev) => new Set(prev).add(id));
  const removeBusy = (setter, id) =>
    setter((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });

  const [conflictMsg, setConflictMsg] = useState('');

  // Prefer user slice for identity (userInfo or studentDashboard.student)
  const { userInfo, studentDashboard } = useSelector((s) => s.user || {});
  const me = studentDashboard?.student || userInfo || {};
  const studentName = me?.name || 'Student';
  const studentImage = me?.profileImage || '';

  // Some other parts may rely on a separate auth slice — keep these if you used them elsewhere
  const userId = useSelector((s) => s?.auth?.user?._id) || me?._id || me?.id;
  // const userRole = useSelector((s) => s?.auth?.user?.role); // not used here

  // schedules — NO page-level loader after first render
  const fetchSchedules = async ({ silent = false } = {}) => {
    try {
      setError('');
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
      if (initialLoading) setInitialLoading(false);
    }
  };

  // routines + incoming requests
  const fetchRoutines = async () => {
    try {
      const data = await getStudentRoutines();
      setRoutines(Array.isArray(data) ? data : []);
    } catch {
      setRoutines([]);
    }
  };
  const fetchIncoming = async () => {
    try {
      const reqs = await listIncomingRoutineChanges();
      setIncoming(Array.isArray(reqs) ? reqs.filter((r) => r.status === 'pending') : []);
    } catch {
      setIncoming([]);
    }
  };

  // agreements (pending schedules + pending routines)
  const fetchAgreements = async () => {
    try {
      const [ps, pr] = await Promise.all([
        getStudentPendingSchedules(),
        getStudentPendingRoutines(),
      ]);
      setPendingSchedules(Array.isArray(ps) ? ps : []);
      setPendingRoutines(Array.isArray(pr) ? pr : []);
    } catch {
      setPendingSchedules([]);
      setPendingRoutines([]);
    }
  };

  // ✅ Enrollment invites fetch
  const fetchEnrollmentInvites = async () => {
    try {
      const list = await listIncomingEnrollmentInvites();
      setEnrollmentInvites(Array.isArray(list) ? list : []);
    } catch {
      setEnrollmentInvites([]);
    }
  };

  useEffect(() => {
    fetchSchedules({ silent: false });
    fetchRoutines();
    fetchIncoming();
    fetchAgreements();
    fetchEnrollmentInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If redirected back from SSLCommerz (success/fail/cancel), refresh invites
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('paid') || sp.has('status')) {
        fetchEnrollmentInvites();
        fetchSchedules({ silent: true });
        fetchRoutines();
      }
    } catch {}
  }, []); // run once on mount

  // Single socket connection; refresh on notifications
  const refreshTimer = useRef(null);
  const scheduleTypes = useRef(
    new Set([
      'new_schedule',
      'schedule_cancelled',
      'schedule_updated',
      'schedules_refresh',
      'routine_partial',
      'routine_conflict',
      'routine_created',
      'routine_refresh',
      'schedule_proposed',
      'schedule_proposal_update',
      'schedule_response',
      'routine_proposed',
      'routine_accepted',
      'routine_rejected',
      'routine_response',
      'new_notification', // important: invite created uses new_notification
      // optional: if server ever emits these directly:
      'enrollment_invite_created',
      'enrollment_invite_updated',
      'enrollment_invite_paid',
    ])
  );

  useSocket(
    userId,
    undefined,
    undefined,
    undefined,
    (notification) => {
      const t = notification?.type;
      if (scheduleTypes.current.has(t)) {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => {
          fetchSchedules({ silent: true });
          fetchRoutines();
          fetchIncoming();
          fetchAgreements();
          fetchEnrollmentInvites();
        }, 150);
      }
    }
  );

  // Accept/Reject for routines created with requiresAcceptance
  const onConsent = async (routineId, action /* 'accept' | 'reject' */) => {
    try {
      setConflictMsg('');
      const res = await respondRoutineSafe(routineId, action);
      if (!res.ok && res.conflict) {
        setConflictMsg(res.data?.message || 'Time conflict detected. Please wait for a new proposal.');
      } else {
        await Promise.all([fetchRoutines(), fetchSchedules({ silent: true })]);
      }
    } catch (e) {
      alert(e?.response?.data?.message || e?.normalizedMessage || 'Failed to submit response');
    }
  };

  // Accept/Reject one-off change request
  const onRespondChange = async (requestId, action /* 'accept' | 'reject' */) => {
    try {
      await respondRoutineChange(requestId, action);
      await Promise.all([fetchIncoming(), fetchSchedules({ silent: true })]);
    } catch (e) {
      alert(e?.response?.data?.message || e?.normalizedMessage || 'Failed to respond');
    }
  };

  // Accept/Reject pending schedule proposals
  const onAcceptSchedule = async (id) => {
    if (busyScheduleIds.has(id)) return;
    addBusy(setBusyScheduleIds, id);
    try {
      setConflictMsg('');
      const res = await respondScheduleSafe(id, 'accept');
      if (res.ok) {
        setPendingSchedules((prev) => prev.filter((x) => x._id !== id));
        await fetchAgreements();
        await fetchSchedules({ silent: true });
      } else if (res.conflict) {
        setConflictMsg(res.data?.message || 'Time conflict detected. Teacher will propose a new time.');
        await fetchAgreements();
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to accept');
    } finally {
      removeBusy(setBusyScheduleIds, id);
    }
  };
  const onRejectSchedule = async (id) => {
    if (busyScheduleIds.has(id)) return;
    addBusy(setBusyScheduleIds, id);
    try {
      setConflictMsg('');
      const res = await respondScheduleSafe(id, 'reject');
      if (res.ok) {
        setPendingSchedules((prev) => prev.filter((x) => x._id !== id));
        await fetchAgreements();
      } else if (res.conflict) {
        setConflictMsg(res.data?.message || 'Could not process your response right now.');
        await fetchAgreements();
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to reject');
    } finally {
      removeBusy(setBusyScheduleIds, id);
    }
  };

  // Accept/Reject routine invitations
  const onAcceptRoutine = async (id) => {
    if (busyRoutineIds.has(id)) return;
    addBusy(setBusyRoutineIds, id);
    try {
      setConflictMsg('');
      const res = await respondRoutineSafe(id, 'accept');
      if (res.ok) {
        setPendingRoutines((prev) => prev.filter((x) => x._id !== id));
        await fetchAgreements();
        await fetchSchedules({ silent: true });
      } else if (res.conflict) {
        setConflictMsg(res.data?.message || 'Time conflict detected. Teacher will adjust the routine.');
        await fetchAgreements();
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to accept');
    } finally {
      removeBusy(setBusyRoutineIds, id);
    }
  };
  const onRejectRoutine = async (id) => {
    if (busyRoutineIds.has(id)) return;
    addBusy(setBusyRoutineIds, id);
    try {
      setConflictMsg('');
      const res = await respondRoutineSafe(id, 'reject');
      if (res.ok) {
        setPendingRoutines((prev) => prev.filter((x) => x._id !== id));
        await fetchAgreements();
      } else if (res.conflict) {
        setConflictMsg(res.data?.message || 'Could not process your response right now.');
        await fetchAgreements();
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to reject');
    } finally {
      removeBusy(setBusyRoutineIds, id);
    }
  };

  // ✅ Invite → real payment redirect (via /pay/invite/initiate)
  const onPayInvite = async (inv) => {
    try {
      setActingInviteId(inv._id);
      const { url } = await startInvitePayment({
        inviteId: inv._id,
        returnUrl: window.location.href,
      });
      if (url) {
        window.location.href = url;
      } else {
        alert('Could not start payment. Try again.');
      }
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Payment initiation failed');
    } finally {
      setActingInviteId(null);
    }
  };

  const onDeclineInvite = async (inviteId) => {
    try {
      setActingInviteId(inviteId);
      await declineEnrollmentInvite(inviteId);
      await fetchEnrollmentInvites();
    } catch (e) {
      alert(e?.response?.data?.message || e?.normalizedMessage || 'Failed to decline invite');
    } finally {
      setActingInviteId(null);
    }
  };

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
      <StudentSidebar studentName={studentName} studentImage={studentImage} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">

          {/* Accept/Reject inbox (class proposals + routine invitations incl. demos) */}
          <Agreements
            pendingSchedules={pendingSchedules}
            pendingRoutines={pendingRoutines}
            onAcceptSchedule={onAcceptSchedule}
            onRejectSchedule={onRejectSchedule}
            onAcceptRoutine={onAcceptRoutine}
            onRejectRoutine={onRejectRoutine}
            busyScheduleIds={busyScheduleIds}
            busyRoutineIds={busyRoutineIds}
            conflictMsg={conflictMsg}
          />

          {/* ✅ Course Invites inside Schedule (BDT + SSLCommerz redirect) */}
          <EnrollmentInvites
            invites={enrollmentInvites}
            actingId={actingInviteId}
            onPayInvite={onPayInvite}
            onDecline={onDeclineInvite}
          />

          {/* Requests (one-off change requests) */}
          <RequestsInbox requests={incoming} onRespond={onRespondChange} />

          {/* Regular Routine */}
          <RoutineList routines={routines} meId={userId} onConsent={onConsent} />

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Teachers & Courses</h2>
            <p className="text-sm text-slate-500">A clear view of your upcoming lessons.</p>
          </div>

          {initialLoading ? (
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
