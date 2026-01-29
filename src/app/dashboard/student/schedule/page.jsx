// src/app/dashboard/student/schedule/page.jsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, Calendar, Bell, Settings, LogOut,
  ChevronRight, Search, Plus, Filter,
  BookOpen, Clock, AlertCircle, Sparkles,
  Layout, Grid, List, CheckCircle2,
  CalendarDays, Megaphone, User, GraduationCap,
  ShieldCheck, RefreshCw, Mail, ArrowRight,
  MoreHorizontal, CreditCard
} from 'lucide-react';

import API from '../../../../api/axios';
import useSocket from '../../../hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';

// ✅ Component imports
import StudentScheduleList from '../components/studentScheduleList';

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
  if (!img || String(img).trim() === '') return null;
  const s = String(img);
  if (s.startsWith('http')) return s;
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${s.startsWith('/') ? s.slice(1) : s}`;
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
    const tAvatar = s.teacherId?.profileImage || '';

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

/* ---------- LEFT SIDEBAR ---------- */
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
    { label: 'Find Teachers', path: '/dashboard/student/find-teachers', icon: <Search size={18} /> },
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

/* ---------- AGREEMENTS ---------- */
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
    <section className="animate-in fade-in duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shadow-sm border border-amber-100">
          <Bell size={18} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Agreements Required</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Please review proposal details</p>
        </div>
      </div>

      {conflictMsg && (
        <div className="mb-6 p-4 rounded-[1.5rem] bg-rose-50/50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-tight flex items-center gap-3">
          <AlertCircle size={14} />
          {conflictMsg}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {(pendingSchedules || []).map((s) => {
          const busy = busyScheduleIds?.has?.(s._id);
          return (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/60 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/30 group hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                    Proposed {s.type === 'demo' ? 'demo' : 'class'}
                  </div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">{s.subject}</h4>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Calendar size={18} />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Clock size={14} className="text-indigo-400" />
                  {formatDhaka(s.date)} • {s.durationMinutes} mins
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <User size={14} className="text-indigo-400" />
                  Educator: {s.teacherId?.name || 'Teacher'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => !busy && onRejectSchedule(s._id)}
                  className="py-3.5 rounded-2xl border border-slate-100 bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95 disabled:opacity-50"
                  disabled={!!busy}
                >
                  {busy ? 'Syncing...' : 'Reject'}
                </button>
                <button
                  onClick={() => !busy && onAcceptSchedule(s._id)}
                  className="py-3.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50"
                  disabled={!!busy}
                >
                  {busy ? 'Syncing...' : 'Accept'}
                </button>
              </div>
            </motion.div>
          );
        })}

        {(pendingRoutines || []).map((r) => {
          const busy = busyRoutineIds?.has?.(r._id);
          return (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/60 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/30 group hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-500"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">
                    Routine Invite
                  </div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">{r.post?.title || 'Course'}</h4>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <RefreshCw size={18} />
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-2xl p-4 mb-6">
                <ul className="space-y-2">
                  {(r.slots || []).map((s, i) => {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    return (
                      <li key={`${r._id}-${i}`} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{days[s.weekday]} • {s.timeHHMM}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.durationMinutes} mins</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => !busy && onRejectRoutine(r._id)}
                  className="py-3.5 rounded-2xl border border-slate-100 bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95 disabled:opacity-50"
                  disabled={!!busy}
                >
                  {busy ? 'Syncing...' : 'Reject'}
                </button>
                <button
                  onClick={() => !busy && onAcceptRoutine(r._id)}
                  className="py-3.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50"
                  disabled={!!busy}
                >
                  {busy ? 'Syncing...' : 'Accept'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Enrollment Invites ---------- */
function EnrollmentInvites({ invites, actingId, onPayInvite, onDecline }) {
  if (!Array.isArray(invites) || invites.length === 0) return null;

  const moneyBDT = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;
  const remainingDue = (inv) => Math.max(0, Number(inv.upfrontDueTk || inv.advanceTk || 0) - Number(inv.paidTk || 0));

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Enrollment Offers</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Complete payment to start learning</p>
        </div>
      </div>

      <div className="space-y-4">
        {invites.map((inv) => {
          const due = remainingDue(inv);
          const disabled = actingId === inv._id || inv.status !== 'pending' || due <= 0;
          return (
            <motion.div
              key={inv._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl shadow-indigo-100/20 relative overflow-hidden group"
            >
              <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <GraduationCap size={180} className="text-indigo-600" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest">
                      {inv.status}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Payment: {inv.paymentStatus || 'pending'}
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                    {inv.courseTitle || inv?.postId?.title || 'Academic Course'}
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      Total Fee: <span className="text-slate-900">{moneyBDT(inv.courseFeeTk)}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {inv.advanceTk ? 'Advance' : 'Upfront'}: <span className="text-emerald-600">{moneyBDT(inv.upfrontDueTk || inv.advanceTk)}</span>
                    </div>
                  </div>
                  {inv.note && (
                    <p className="text-xs italic text-slate-400 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 mt-2">
                      " {inv.note} "
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    disabled={actingId === inv._id}
                    onClick={() => onDecline(inv._id)}
                    className="px-8 py-4 rounded-2xl border border-slate-100 bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 shadow-lg shadow-slate-100"
                  >
                    Decline
                  </button>
                  <button
                    disabled={disabled}
                    onClick={() => onPayInvite(inv)}
                    className="px-10 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-2xl shadow-slate-200 disabled:opacity-50"
                  >
                    {due > 0 ? `Pay ${moneyBDT(due)} Now` : 'Verified'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Requests Inbox ---------- */
function RequestsInbox({ requests, onRespond }) {
  if (!Array.isArray(requests) || requests.length === 0) return null;
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100">
          <Mail size={18} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">One-off Adjustments</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Incoming schedule change proposals</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {requests.map((r) => (
          <motion.div
            key={r._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group p-6 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-500"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <RefreshCw size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Proposed Change</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {new Date(r.proposedDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                <span>Duration</span>
                <span className="text-slate-900">{r.durationMinutes} mins</span>
              </div>
              {r.note && (
                <p className="text-xs italic text-slate-400 mt-2 border-t border-slate-100 pt-2">
                  " {r.note} "
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onRespond(r._id, 'reject')}
                className="py-3.5 rounded-2xl border border-slate-100 bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
              >
                Reject
              </button>
              <button
                onClick={() => onRespond(r._id, 'accept')}
                className="py-3.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                Accept
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- ROUTINE LIST ---------- */
function RoutineList({ routines, meId, onConsent }) {
  if (!Array.isArray(routines) || routines.length === 0) return null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
          <RefreshCw size={18} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Regular Routines</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Your recurring learning schedule</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {routines.map((r) => {
          const pendingSet = new Set((r.pendingBy || []).map(String));
          const mePending = meId && pendingSet.has(String(meId));
          const allAccepted =
            (r.requiresAcceptance && (r.pendingBy || []).length === 0) || !r.requiresAcceptance;

          return (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500"
            >
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  <img
                    src={getImageUrl(r.teacher?.profileImage)}
                    alt=""
                    className="w-16 h-16 rounded-[1.5rem] object-cover ring-4 ring-white shadow-xl shadow-slate-200"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-md ${r.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-black text-slate-900 truncate tracking-tight uppercase group-hover:text-indigo-600 transition-colors">
                    {r.teacher?.name || 'Educator'}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {r.post?.title || 'Academic Course'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-[2rem] p-6 mb-8 border border-slate-100/50">
                <ul className="space-y-3">
                  {(r.slots || []).map((s, i) => (
                    <li key={`${r._id}-slot-${i}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {dayNames[s.weekday]} • {s.timeHHMM}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 self-start">
                        {s.durationMinutes} MIN
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                {!!(r.slots || []).length && (
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} />
                    Next: {fmtNext(
                      (r.slots || [])
                        .map((s) => s.nextRunAt)
                        .filter(Boolean)
                        .sort((a, b) => new Date(a) - new Date(b))[0],
                      r.timezone || 'Asia/Dhaka'
                    )}
                  </div>
                )}

                {r.requiresAcceptance && (
                  <div className="ml-auto">
                    {mePending ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onConsent(r._id, 'accept')}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200"
                        >
                          Agree
                        </button>
                        <button
                          onClick={() => onConsent(r._id, 'reject')}
                          className="px-4 py-2 rounded-xl border border-slate-100 bg-white text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600"
                        >
                          Reject
                        </button>
                      </div>
                    ) : allAccepted ? (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                        Synced
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-2">
                        <RefreshCw size={10} className="animate-spin" /> Pending
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
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
              {/* Card Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[3.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

              <div className="relative bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/80 shadow-2xl shadow-slate-200/50 hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>

                <div className="p-8">
                  {/* Teacher Header */}
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

                  {/* Course Feed */}
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

                  {/* Action Belt */}
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

/* ---------- RIGHT SIDEBAR ---------- */
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
        {/* Announcements */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100">
              <Megaphone size={18} />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Announcements</h3>
          </div>
          <div className="space-y-4">
            <div className="p-5 rounded-[1.5rem] bg-white/60 backdrop-blur-xl border border-white shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-purple-100 transition-all cursor-default">
              <div className="flex gap-3 mb-2">
                <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tight">Your classes update live as teachers schedule or cancel.</p>
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="relative flex-1">
          <div className="flex items-center gap-3 mb-6 pt-8 border-t border-slate-100">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
              <CalendarDays size={18} />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Today</h3>
          </div>

          {todayItems.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-slate-50/50 border border-dashed border-slate-200">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quiet day today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayItems.map((it, idx) => (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group p-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-indigo-100 transition-all cursor-default"
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
                    {it.status !== 'scheduled' && (
                      <span
                        className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${it.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}
                      >
                        {it.status}
                      </span>
                    )}
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

/* ---------- PAGE ---------- */
export default function StudentSchedulePage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);

  // keep raw schedules for StudentScheduleList (even though it can fetch itself)
  const [schedules, setSchedules] = useState([]);

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

  // schedules — NO page-level loader after first render
  const fetchSchedules = async ({ silent = false } = {}) => {
    try {
      if (!silent) setError('');
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
      setSchedules(list);
      setTeachers(buildTeachers(list));
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.normalizedMessage || 'Failed to load schedules.'
      );
      setSchedules([]);
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
    } catch { }
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
      'new_notification',
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
    <div className="flex w-full h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Legendary Background (Light Edition) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-indigo-500/5 blur-[180px] rounded-full animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-purple-500/5 blur-[150px] rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply"></div>
      </div>

      <StudentSidebar studentName={studentName} studentImage={studentImage} />

      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">

          {/* Today's Schedule Feed */}
          <StudentScheduleList
            schedules={schedules}
            loading={initialLoading}
            error={error}
            onRefresh={() => fetchSchedules({ silent: true })}
          />

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

          <EnrollmentInvites
            invites={enrollmentInvites}
            actingId={actingInviteId}
            onPayInvite={onPayInvite}
            onDecline={onDeclineInvite}
          />

          <RequestsInbox
            requests={incoming}
            onRespond={onRespondChange}
          />

          <RoutineList
            routines={routines}
            meId={userId}
            onConsent={onConsent}
          />

          {/* Connected Teachers Grid */}
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

            {initialLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-white/40 h-64 rounded-[2rem] border border-white" />
                ))}
              </div>
            ) : error ? (
              <div className="bg-rose-50/50 p-8 rounded-[2rem] border border-rose-100 text-rose-600 font-black uppercase tracking-tight text-xs">
                {error}
              </div>
            ) : teachers.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] p-16 border border-white text-center shadow-2xl shadow-slate-200/50">
                <div className="w-16 h-16 rounded-full bg-slate-50 grid place-items-center mx-auto mb-6">
                  <BookOpen size={24} className="text-slate-200" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">No classes yet. You’ll see them here when teachers schedule.</p>
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
