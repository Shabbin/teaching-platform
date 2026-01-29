// src/app/dashboard/teacher/schedule/routines/page.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, MessageSquare, Clock,
  Calendar, CheckCircle2, AlertCircle,
  ChevronRight, ArrowRight, UserPlus,
  Settings, Trash2, X, RefreshCw,
  Sparkles, Megaphone, BookOpen, Crown
} from 'lucide-react';
import useSocket from '../../../../hooks/useSocket';

import { getMyRoutines, setRoutineStatus } from '../../../../../api/routines';
import {
  createRoutineChange,
  listOutgoingRoutineChanges,
} from '../../../../../api/routineChanges';

// 👇 enrollment invite API (BDT flow)
import {
  createEnrollmentInvite,
} from '../../../../../api/enrollmentInvites';

// React Query
import { useQueryClient } from '@tanstack/react-query';
// Reuse the “today + join” widget you added in step 6
import TodayScheduleList from "../../../components/scheduleComponents/todayScheduleList";


// (optional tiny debug helper)
import { API_BASE_URL_LOG } from '../../../../../api/axios';

const brand = 'oklch(0.49 0.25 277)';

/* -------------------------------- UI helpers ------------------------------- */

function Pill({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-slate-100 text-slate-500 ring-slate-200',
    active: 'bg-indigo-50 text-indigo-600 ring-indigo-200 shadow-sm shadow-indigo-100/50',
    paused: 'bg-amber-50 text-amber-600 ring-amber-200',
    success: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    danger: 'bg-rose-50 text-rose-500 ring-rose-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ${tones[tone] || tones.default}`}>
      {children}
    </span>
  );
}
function StudentChip({ u, tiny = false, tone = 'default' }) {
  const name = u?.name || String(u?._id ?? u).slice(0, 8);
  const img = u?.profileImage || 'https://i.pravatar.cc/24';
  const toneCls =
    tone === 'accepted' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100' :
      tone === 'rejected' ? 'border-rose-200 bg-rose-50 text-rose-600 shadow-sm shadow-rose-100' :
        tone === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm shadow-amber-100' :
          'border-white/50 bg-white shadow-sm shadow-slate-200/50';
  return (
    <span className={`inline-flex items-center gap-2 ${tiny ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-full border font-black uppercase tracking-tight ${toneCls} transition-all hover:scale-105`}>
      <img src={img} alt="" className={`${tiny ? 'w-4 h-4' : 'w-5 h-5'} rounded-full object-cover ring-1 ring-white shadow-sm`} />
      {name}
    </span>
  );
}

/* ------------------------------- data utils -------------------------------- */

const WD_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WD_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const normalizeId = (v) => String(v?._id ?? v);
const dedupeByKey = (arr, getKey) => {
  const seen = new Set(); const out = [];
  for (const it of arr) { const k = getKey(it); if (!seen.has(k)) { seen.add(k); out.push(it); } }
  return out;
};
const timeToMinutes = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return Number.POSITIVE_INFINITY;
  return Number(m[1]) * 60 + Number(m[2]);
};

/**
 * Group routines by postId and build:
 * - students (unique per course)
 * - membership (studentId → routineId)
 * - routinesMap (routineId → {slots, students})
 * - slotUnion (unique slots across routines for the course)
 */
function groupByPost(routines) {
  const byPost = new Map();

  for (const r of routines || []) {
    const postKey = normalizeId(r.postId) || 'unknown';
    if (!byPost.has(postKey)) {
      byPost.set(postKey, {
        key: postKey,
        post: r.postId ? { _id: normalizeId(r.postId), title: r.postId.title, subjects: r.postId.subjects } : null,
        routineIds: [],
        statusSet: new Set(),
        students: [],
        membership: {},
        routinesMap: new Map(),
        slotUnion: [],
      });
    }
    const g = byPost.get(postKey);
    const rid = normalizeId(r._id);
    g.routineIds.push(rid);
    if (r.status) g.statusSet.add(r.status);

    const stuForRoutine = [];
    for (const u of (r.studentIds || [])) {
      const uid = normalizeId(u);
      const packed = { _id: uid, name: u?.name, profileImage: u?.profileImage };
      g.membership[uid] = rid;
      g.students.push(packed);
      stuForRoutine.push(packed);
    }

    const slotsForRoutine = (r.slots || []).map(s => ({
      weekday: Number(s.weekday),
      timeHHMM: String(s.timeHHMM),
      durationMinutes: Number(s.durationMinutes),
    }));
    g.routinesMap.set(rid, { slots: slotsForRoutine, students: stuForRoutine });
  }

  const groups = [];
  for (const g of byPost.values()) {
    const students = dedupeByKey(g.students, u => u._id);

    const union = [];
    const seen = new Set();
    for (const { slots } of g.routinesMap.values()) {
      for (const s of slots) {
        const key = `${s.weekday}|${s.timeHHMM}|${s.durationMinutes}`;
        if (!seen.has(key)) { seen.add(key); union.push({ ...s, key }); }
      }
    }
    union.sort((a, b) => (a.weekday - b.weekday) || (timeToMinutes(a.timeHHMM) - timeToMinutes(b.timeHHMM)));

    let status = 'active';
    if (g.statusSet.size) {
      if (g.statusSet.has('active')) status = 'active';
      else if (g.statusSet.has('paused')) status = 'paused';
      else status = Array.from(g.statusSet)[0];
    }

    groups.push({
      key: g.key,
      post: g.post || { _id: g.key, title: 'Course', subjects: '' },
      routineIds: g.routineIds,
      status,
      students,
      membership: g.membership,
      routinesMap: g.routinesMap,
      slotUnion: union,
    });
  }

  groups.sort((a, b) => (a.post?.title || '').localeCompare(b.post?.title || ''));
  return groups;
}

/* --------------------------- Pending requests drawer ------------------------ */

function RequestsDrawer({ open, onClose, group }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const studentIndex = useMemo(() => {
    const m = new Map();
    for (const s of group?.students || []) m.set(s._id, s);
    return m;
  }, [group]);

  const fetch = async () => {
    try {
      setLoading(true);
      const all = await listOutgoingRoutineChanges();
      const byCourse = (all || []).filter(x => (group?.routineIds || []).includes(String(x.routineId)));
      setItems(byCourse);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) fetch(); }, [open]); // eslint-disable-line

  if (!open) return null;
  const fmt = iso => new Date(iso).toLocaleString('en-GB', { hour12: false });
  const chipTone = (id, r) => {
    const sid = String(id);
    if ((r.acceptedBy || []).map(String).includes(sid)) return 'accepted';
    if ((r.rejectedBy || []).map(String).includes(sid)) return 'rejected';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="relative h-full w-full max-w-2xl bg-white/80 backdrop-blur-md md:backdrop-blur-3xl shadow-2xl border-l border-white flex flex-col"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter">Pending Changes</h3>
            <p className="text-xs font-medium text-slate-400">Manage your course modifications.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetch}
              className="p-2.5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors text-slate-600"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading requests...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200">
              <Megaphone className="mx-auto text-slate-300 mb-4" size={32} />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No active requests found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((r, idx) => {
                const isWeekly = r.changeType === 'weekly';
                const header = isWeekly
                  ? (r.op === 'add'
                    ? `Add ${WD_SHORT[r.weekday]} ${r.timeHHMM}`
                    : r.op === 'update'
                      ? `Update ${WD_SHORT[r.targetWeekday]} ${r.targetTimeHHMM} → ${WD_SHORT[r.weekday]} ${r.timeHHMM}`
                      : `Remove ${WD_SHORT[r.targetWeekday]} ${r.targetTimeHHMM}`)
                  : `One-off: ${fmt(r.proposedDate)} • ${r.durationMinutes}m`;
                const total = (r.studentIds || []).length;
                const pend = (r.pendingBy || []).length;
                const acc = (r.acceptedBy || []).length;
                const rej = (r.rejectedBy || []).length;

                return (
                  <motion.div
                    key={String(r._id)}
                    initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : idx * 0.1 }}
                    className="group border border-white bg-white/60 backdrop-blur-md md:backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-lg font-black text-slate-900 tracking-tight">{header}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Pill tone={r.status === 'pending' ? 'paused' : 'active'}>{r.status}</Pill>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{fmt(r.createdAt)}</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-lg shadow-slate-200">
                        <span className="text-xs font-black">{total}</span>
                        <Users size={10} />
                      </div>
                    </div>
                    {r.note && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                        <p className="text-xs font-medium text-slate-600 line-clamp-2 italic">“{r.note}”</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {(r.studentIds || []).map(sid => (
                        <StudentChip
                          key={String(sid)}
                          u={studentIndex.get(String(sid)) || { _id: String(sid) }}
                          tiny
                          tone={chipTone(sid, r)}
                        />
                      ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-xs font-black text-emerald-600">{acc}</div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Accepted</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-black text-amber-600">{pend}</div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-black text-rose-500">{rej}</div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rejected</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------ Invite-to-course modal (BDT flow) ----------------- */

function InviteModal({ open, onClose, group, allGroups }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState([]);

  // BDT-based fields
  const [courseFeeTk, setCourseFeeTk] = useState('');         // required if Post has no fee (but we now always send)
  const [advanceTk, setAdvanceTk] = useState('');             // optional
  const [expiresAt, setExpiresAt] = useState('');             // optional
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [routineId, setRoutineId] = useState(''); // 👈 target routine
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Pull a default fee from Post if present (feeTk/monthlyFee/priceTk/priceBDT)
  const defaultFeeTk = useMemo(() => {
    const p = group?.post;
    const v = Number(p?.feeTk) || Number(p?.monthlyFee) || Number(p?.priceTk) || Number(p?.priceBDT) || 0;
    return Number.isFinite(v) ? v : 0;
  }, [group?.post]);

  // Build routine options for this course (by the weekly slot summary)
  const routineOptions = useMemo(() => {
    if (!group) return [];
    const opts = [];
    for (const rid of group.routineIds || []) {
      const r = group.routinesMap.get(String(rid));
      const label = (r?.slots || [])
        .sort((a, b) => (a.weekday - b.weekday) || (timeToMinutes(a.timeHHMM) - timeToMinutes(b.timeHHMM)))
        .map(s => `${WD_SHORT[s.weekday]} ${s.timeHHMM} · ${s.durationMinutes}m`)
        .join(' • ');
      opts.push({
        value: String(rid),
        label: label || 'No weekly slots',
        count: (r?.students || []).length,
      });
    }
    return opts;
  }, [group]);

  // Default routine selection on open
  useEffect(() => {
    if (!open || !group) return;
    setSel([]);
    setQ('');
    setNote('');
    setSending(false);
    setAdvanceTk('');
    setExpiresAt('');
    // set fee to default from Post if available; otherwise empty to force input
    setCourseFeeTk(defaultFeeTk ? String(defaultFeeTk) : '');
    // auto-pick the first routine
    const first = routineOptions[0]?.value || '';
    setRoutineId(first);
    // debug
    if (typeof window !== 'undefined') {
      console.log('[InviteModal] API base:', API_BASE_URL_LOG);
    }
  }, [open, group, routineOptions, defaultFeeTk]);

  // students already in THIS course
  const enrolledSet = useMemo(() => new Set((group?.students || []).map(s => s._id)), [group?.students]);

  // candidates from teacher’s OTHER courses (not already in this course)
  const candidates = useMemo(() => {
    const pool = [];
    for (const g of allGroups || []) {
      if (g.key === group?.key) continue; // only other courses
      for (const s of g.students || []) {
        if (!enrolledSet.has(s._id)) pool.push(s);
      }
    }
    const uniq = dedupeByKey(pool, s => s._id);
    const query = q.trim().toLowerCase();
    return query
      ? uniq.filter(s => (s.name || '').toLowerCase().includes(query) || s._id.toLowerCase().includes(query))
      : uniq;
  }, [allGroups, group?.key, group?.students, q, enrolledSet]);

  const toggle = (id) => setSel(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
  const selectAll = () => setSel(candidates.map(s => s._id));
  const clearAll = () => setSel([]);

  // Helper: quick weekly clash check (same weekday and time)
  const selectedRoutineSlots = useMemo(() => {
    if (!group || !routineId) return [];
    const r = group.routinesMap.get(String(routineId));
    return (r?.slots || []).map(s => `${s.weekday}|${s.timeHHMM}`); // simple equality check
  }, [group, routineId]);

  // Build a map of studentId -> set of `${weekday}|${timeHHMM}` from ALL other courses
  const studentWeeklyMap = useMemo(() => {
    const map = new Map();
    for (const g of allGroups || []) {
      for (const [, { slots, students }] of g.routinesMap?.entries?.() || []) {
        const keys = (slots || []).map(s => `${s.weekday}|${s.timeHHMM}`);
        for (const u of (students || [])) {
          const id = String(u._id);
          if (!map.has(id)) map.set(id, new Set());
          const bag = map.get(id);
          for (const k of keys) bag.add(k);
        }
      }
    }
    return map;
  }, [allGroups]);

  const conflictCount = useMemo(() => {
    if (!routineId) return 0;
    let n = 0;
    for (const sid of sel) {
      const bag = studentWeeklyMap.get(String(sid));
      if (!bag) continue;
      for (const k of selectedRoutineSlots) {
        if (bag.has(k)) { n++; break; } // count student once if any clash
      }
    }
    return n;
  }, [sel, studentWeeklyMap, selectedRoutineSlots, routineId]);

  // Upfront rule: if advanceTk provided and >0 use it; else 15% of courseFeeTk
  const upfrontDueTk = useMemo(() => {
    const adv = Math.floor(Number(advanceTk) || 0);
    const fee = Math.floor(Number(courseFeeTk) || Number(defaultFeeTk) || 0);
    if (adv > 0) return adv;
    if (fee > 0) return Math.ceil(fee * 0.15);
    return 0;
  }, [advanceTk, courseFeeTk, defaultFeeTk]);

  const numericFee = useMemo(() => {
    const fee = Math.floor(Number(courseFeeTk) || Number(defaultFeeTk) || 0);
    return Number.isFinite(fee) ? fee : 0;
  }, [courseFeeTk, defaultFeeTk]);

  const canSend =
    open && group && routineId && sel.length > 0 && numericFee > 0 && upfrontDueTk > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const results = [];
      const courseTitle = group?.post?.title || 'Course';

      for (const studentId of sel) {
        try {
          const payload = {
            routineId,                        // required
            studentId,                        // required
            courseTitle,                      // required by backend
            courseFeeTk: numericFee,          // required by backend (BDT)
            // advance is optional; omit if empty to trigger 15% rule on server
            ...(Number(advanceTk) > 0 ? { advanceTk: Math.floor(Number(advanceTk)) } : {}),
            note: note || undefined,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          };
          if (typeof window !== 'undefined') {
            console.log('[InviteModal] POST /enrollment-invites ->', payload);
          }
          const res = await createEnrollmentInvite(payload);
          if (typeof window !== 'undefined') {
            console.log('[InviteModal] response:', res);
          }
          results.push({ ok: true });
        } catch (err) {
          if (typeof window !== 'undefined') {
            console.log('[InviteModal] error:', err?.response?.status, err?.response?.data || err?.message);
          }
          results.push({ ok: false, err });
        }
      }

      const ok = results.filter(r => r.ok).length;
      const bad = results.length - ok;

      if (ok > 0 && bad === 0) {
        alert('Invites sent.');
      } else if (ok > 0 && bad > 0) {
        alert(`Sent ${ok} invite(s). ${bad} failed.`);
      } else {
        alert('Failed to send invites.');
      }

      onClose?.();
    } catch (e) {
      alert(e?.response?.data?.message || e?.normalizedMessage || 'Failed to send invites');
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  if (!open || !group) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm"
            />
            <motion.div
              initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-white/80 backdrop-blur-md md:backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-10 py-8 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-50"></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md md:backdrop-blur-xl grid place-items-center shadow-lg border border-white/10">
                    <UserPlus size={24} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black tracking-tighter">Invite Students</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {group?.post?.title || 'Course'} • {(Array.isArray(group?.post?.subjects) ? group.post.subjects.join(' | ') : group?.post?.subjects) || '—'}
                    </p>
                  </div>
                  <button
                    className="ml-auto p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
                    onClick={onClose}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {/* Target routine selector */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    <Grid size={12} />
                    Target Routine
                  </label>
                  <select
                    value={routineId}
                    onChange={(e) => setRoutineId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 px-6 text-slate-900 text-sm font-bold outline-none transition-all shadow-inner appearance-none"
                  >
                    {routineOptions.length === 0 && <option value="">No routines found</option>}
                    {routineOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label || 'Routine'} {typeof opt.count === 'number' ? ` (${opt.count} students)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search + candidates list */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    <Search size={12} />
                    Select Candidates
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        placeholder="Search students..."
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-3 pl-10 pr-4 text-xs font-bold outline-none transition-all shadow-inner"
                      />
                    </div>
                    <button
                      className="px-4 py-3 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                      onClick={selectAll}
                    >
                      All
                    </button>
                    <button
                      className="px-4 py-3 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                      onClick={clearAll}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-56 overflow-auto rounded-[2rem] bg-slate-50/50 border border-slate-100 p-6 custom-scrollbar">
                    {candidates.length === 0 ? (
                      <div className="py-12 text-center">
                        <Users className="mx-auto text-slate-200 mb-3" size={24} />
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No candidates available</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {candidates.map(s => {
                          const checked = sel.includes(s._id);
                          return (
                            <label key={s._id} className={`group flex items-center gap-3 px-4 py-2.5 rounded-2xl border cursor-pointer transition-all ${checked ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100 scale-105' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(s._id)}
                                className="hidden"
                              />
                              <img src={s.profileImage || 'https://i.pravatar.cc/40'} className="w-6 h-6 rounded-full border border-white" />
                              <span className={`text-xs font-black uppercase tracking-tight ${checked ? 'text-white' : 'text-slate-900'}`}>{s.name}</span>
                              {checked && <CheckCircle2 size={14} className="text-white" />}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* BDT fields + note */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fee (BDT)</label>
                    <input
                      type="number"
                      value={courseFeeTk}
                      onChange={e => setCourseFeeTk(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-3 px-5 text-sm font-bold outline-none transition-all shadow-inner"
                      placeholder={defaultFeeTk ? String(defaultFeeTk) : '3000'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Advance</label>
                    <input
                      type="number"
                      value={advanceTk}
                      onChange={e => setAdvanceTk(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-3 px-5 text-sm font-bold outline-none transition-all shadow-inner"
                      placeholder="Empty = 15%"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Expiry</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-3 px-5 text-[11px] font-bold outline-none transition-all shadow-inner"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-600" />
                        <span className="text-xs font-black uppercase tracking-tight text-indigo-900">Upfront Due:</span>
                        <span className="text-lg font-black text-indigo-600 tracking-tight">{upfrontDueTk || 0} BDT</span>
                      </div>
                      {conflictCount > 0 && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 animate-pulse">
                          <AlertCircle size={12} />
                          {conflictCount} Conflicts
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Welcome Note</label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-[2rem] py-4 px-6 text-sm font-bold outline-none transition-all shadow-inner resize-none"
                      placeholder="Instructions or welcome message..."
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                  Students must pay the advance to self-enroll.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    className="px-8 py-4 rounded-2xl border border-slate-200 bg-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!canSend}
                    onClick={send}
                    className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 transition-all overflow-hidden relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10">{sending ? 'Sending...' : 'Send Invites'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- change modal ------------------------------- */

function ChangeModal({ open, onClose, group, onSent, otherCourseSlots = [] }) {
  // Build Day → [{slot}] with student lists per slot
  const dayTime = useMemo(() => {
    if (!group) return { days: [], map: new Map() };

    const slotMap = new Map(); // fullKey -> slot{ students[] }
    for (const [, { slots, students }] of group.routinesMap.entries()) {
      for (const s of slots) {
        const fullKey = `${s.weekday}|${s.timeHHMM}|${s.durationMinutes}`;
        if (!slotMap.has(fullKey)) slotMap.set(fullKey, { ...s, key: fullKey, students: [] });
        for (const u of students) {
          if (!slotMap.get(fullKey).students.find(x => x._id === u._id)) {
            slotMap.get(fullKey).students.push(u);
          }
        }
      }
    }

    const byDay = new Map(); // weekday -> [slots]
    for (const slot of slotMap.values()) {
      if (!byDay.has(slot.weekday)) byDay.set(slot.weekday, []);
      byDay.get(slot.weekday).push(slot);
    }
    const days = Array.from(byDay.keys()).sort((a, b) => a - b);
    for (const w of days) byDay.get(w).sort((a, b) => timeToMinutes(a.timeHHMM) - timeToMinutes(b.timeHHMM));

    return { days, map: byDay };
  }, [group]);

  // slots from OTHER courses (for conflict warnings)
  const otherWeekly = useMemo(() => {
    const currentKey = group?.key;
    return (otherCourseSlots || []).filter(s => s.courseKey !== currentKey);
  }, [otherCourseSlots, group?.key]);

  const [tab, setTab] = useState('oneoff'); // 'oneoff' | 'weekly'
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlotKey, setSelectedSlotKey] = useState('');

  const selectedSlot = useMemo(() => {
    if (selectedDay == null || !selectedSlotKey) return null;
    const list = dayTime.map.get(selectedDay) || [];
    return list.find(s => s.key === selectedSlotKey) || null;
  }, [selectedDay, selectedSlotKey, dayTime]);

  // selected students in the visible slot
  const [selIds, setSelIds] = useState([]);

  // form states
  const [oneoff, setOneoff] = useState({ proposedDate: '', durationMinutes: 60, note: '' });
  const [weekly, setWeekly] = useState({
    op: 'update',                // 'add' | 'update' | 'remove'
    targetKey: '',               // `${weekday}|${timeHHMM}`
    weekday: 0,
    timeHHMM: '',
    durationMinutes: 60,
    note: '',
  });

  // initialize on open
  useEffect(() => {
    if (!open) return;

    if (dayTime.days.length === 0) {
      // no existing weekly slots yet
      setSelectedDay(null);
      setSelectedSlotKey('');
      setSelIds([]);
      setTab('weekly');
      setWeekly({ op: 'add', targetKey: '', weekday: 0, timeHHMM: '', durationMinutes: 60, note: '' });
    } else {
      const firstDay = dayTime.days[0];
      const firstSlot = dayTime.map.get(firstDay)?.[0];
      setSelectedDay(firstDay);
      setSelectedSlotKey(firstSlot?.key || '');
      setSelIds(firstSlot ? firstSlot.students.map(s => s._id) : []);
      setTab('oneoff');
      setWeekly({
        op: 'update',
        targetKey: firstSlot ? `${firstSlot.weekday}|${firstSlot.timeHHMM}` : '',
        weekday: firstSlot?.weekday ?? 0,
        timeHHMM: firstSlot?.timeHHMM ?? '',
        durationMinutes: firstSlot?.durationMinutes ?? 60,
        note: '',
      });
    }

    setOneoff({ proposedDate: '', durationMinutes: 60, note: '' });
  }, [open]); // eslint-disable-line

  // re-bind weekly target when time chip changes
  useEffect(() => {
    if (!open) return;
    const s = selectedSlot;
    if (!s) {
      setSelIds([]);
      setWeekly(w => ({ ...w, targetKey: '' }));
      return;
    }
    // Always select ALL students in the slot by default
    setSelIds(s.students.map(st => st._id));
    setWeekly(w => ({
      ...w,
      targetKey: `${s.weekday}|${s.timeHHMM}`,
      weekday: s.weekday,
      timeHHMM: s.timeHHMM,
      durationMinutes: s.durationMinutes,
    }));
  }, [selectedSlot?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const removalMode = tab === 'weekly' && weekly.op === 'remove';

  const toggleStudent = (id) => {
    if (removalMode) return; // locked in remove mode
    setSelIds(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
  };
  const selectAll = () => {
    if (!selectedSlot) return;
    setSelIds(selectedSlot.students.map(s => s._id));
  };
  const clearAll = () => {
    if (removalMode) return;
    setSelIds([]);
  };

  // ---------- conflict helpers ----------
  const weeklyConflicts = useMemo(() => {
    if (weekly.op === 'remove') return { conflict: false, with: [] };
    const w = Number(weekly.weekday);
    const t = String(weekly.timeHHMM || '');
    if (!t || Number.isNaN(w)) return { conflict: false, with: [] };
    const hits = otherWeekly.filter(s => s.weekday === w && s.timeHHMM === t).map(s => s.courseTitle || 'another course');
    return { conflict: hits.length > 0, with: hits };
  }, [weekly.op, weekly.weekday, weekly.timeHHMM, otherWeekly]);

  const oneoffConflicts = useMemo(() => {
    if (!oneoff.proposedDate) return { conflict: false, with: [] };
    const dt = new Date(oneoff.proposedDate);
    if (Number.isNaN(dt.getTime())) return { conflict: false, with: [] };
    const w = dt.getDay();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    const t = `${hh}:${mm}`;
    const hits = otherWeekly.filter(s => s.weekday === w && s.timeHHMM === t).map(s => s.courseTitle || 'another course');
    return { conflict: hits.length > 0, with: hits };
  }, [oneoff.proposedDate, otherWeekly]);

  const oneoffValid = open && group && (selIds.length > 0) && oneoff.proposedDate && Number(oneoff.durationMinutes) > 0 && !oneoffConflicts.conflict;

  const weeklyValid = useMemo(() => {
    if (!open || !group || selIds.length === 0) return false;
    if (weekly.op === 'update' || weekly.op === 'remove') {
      if (!weekly.targetKey) return false; // must pick a day+time
    }
    if (weekly.op === 'remove') {
      if (!selectedSlot) return false;
      if (selIds.length !== selectedSlot.students.length) return false; // locked to all-in-slot
      return true; // removal is allowed regardless of conflicts
    }
    if (!(weekly.timeHHMM && Number(weekly.durationMinutes) > 0)) return false;
    if (weeklyConflicts.conflict) return false;
    return true;
  }, [open, group, selIds.length, weekly, selectedSlot, weeklyConflicts.conflict]);

  // split students per routine
  const splitByRoutine = () => {
    const map = {};
    for (const sid of selIds) {
      const rid = group.membership[sid];
      if (!map[rid]) map[rid] = [];
      map[rid].push(sid);
    }
    return map;
  };

  const submitOneoff = async () => {
    if (!oneoffValid) return;
    const split = splitByRoutine();
    try {
      for (const [rid, studentIds] of Object.entries(split)) {
        await createRoutineChange({
          routineId: rid,
          studentIds,
          changeType: 'oneoff',
          proposedDate: new Date(oneoff.proposedDate).toISOString(),
          durationMinutes: Number(oneoff.durationMinutes),
          note: oneoff.note || undefined,
        });
      }
      onSent?.(); onClose?.(); alert('Request sent.');
    } catch (e) {
      alert(e?.response?.data?.message || e?.normalizedMessage || 'Failed to send request');
    }
  };

  // update/remove must send targetWeekday & targetTimeHHMM
  const submitWeekly = async () => {
    if (!weeklyValid) return;

    if (weekly.op === 'remove') {
      const ok = window.confirm('Removing this weekly slot will notify all students in this slot. Send removal proposal now?');
      if (!ok) return;
    }

    const split = splitByRoutine();
    const [tW, tT] = weekly.targetKey ? weekly.targetKey.split('|') : [null, null];

    try {
      for (const [rid, studentIds] of Object.entries(split)) {
        const payload = {
          routineId: rid,
          studentIds,
          changeType: 'weekly',
          op: weekly.op,
          note: weekly.note || undefined,
        };

        if (weekly.op === 'add') {
          Object.assign(payload, {
            weekday: Number(weekly.weekday),
            timeHHMM: weekly.timeHHMM,
            durationMinutes: Number(weekly.durationMinutes),
          });
        } else if (weekly.op === 'update') {
          Object.assign(payload, {
            targetWeekday: Number(tW),
            targetTimeHHMM: tT,
            weekday: Number(weekly.weekday),
            timeHHMM: weekly.timeHHMM,
            durationMinutes: Number(weekly.durationMinutes) || undefined,
          });
        } else if (weekly.op === 'remove') {
          Object.assign(payload, {
            targetWeekday: Number(tW),
            targetTimeHHMM: tT,
          });
        }

        await createRoutineChange(payload);
      }
      onSent?.(); onClose?.(); alert('Change proposal sent.');
    } catch (e) {
      alert(e?.response?.data?.message || e?.normalizedMessage || 'Failed to send request');
    }
  };

  if (!open || !group) return null;

  const dayButtons = dayTime.days.map(w => ({ value: w, label: WD_FULL[w] }));
  const timeButtons = selectedDay == null ? [] : (dayTime.map.get(selectedDay) || [])
    .map(s => ({ key: s.key, label: `${s.timeHHMM} • ${s.durationMinutes}m`, count: s.students.length }));

  const slotHuman = selectedSlot
    ? `${WD_FULL[selectedSlot.weekday]} • ${selectedSlot.timeHHMM} • ${selectedSlot.durationMinutes}m`
    : '—';

  const selectedCount = selIds.length;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl bg-white/70 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[95vh]"
            >
              {/* Header */}
              <div className="px-10 py-8 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-50"></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md md:backdrop-blur-xl grid place-items-center shadow-lg border border-white/10">
                    <RefreshCw size={24} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black tracking-tighter">Modify Routine</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {group.post?.title} • Weekly or One-off changes
                    </p>
                  </div>
                  <button
                    className="ml-auto p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
                    onClick={onClose}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex max-h-full overflow-hidden flex-1">
                {/* Left Panel: Tabs & Selection */}
                <div className="w-80 border-r border-slate-100 p-8 overflow-y-auto custom-scrollbar bg-slate-50/30">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Change Type</h4>
                  <div className="space-y-3 mb-10">
                    <button
                      onClick={() => setTab('oneoff')}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${tab === 'oneoff' ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100 stroke-[3px]' : 'bg-transparent border-slate-100 hover:border-slate-300'}`}
                    >
                      <div className={`p-2 rounded-xl ${tab === 'oneoff' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Sparkles size={16} />
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-black uppercase tracking-tight ${tab === 'oneoff' ? 'text-slate-900' : 'text-slate-400'}`}>One-off</div>
                        <div className="text-[9px] font-bold text-slate-400">Fixed date change</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setTab('weekly')}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${tab === 'weekly' ? 'bg-white border-purple-600 shadow-xl shadow-purple-100' : 'bg-transparent border-slate-100 hover:border-slate-300'}`}
                    >
                      <div className={`p-2 rounded-xl ${tab === 'weekly' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Calendar size={16} />
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-black uppercase tracking-tight ${tab === 'weekly' ? 'text-slate-900' : 'text-slate-400'}`}>Weekly</div>
                        <div className="text-[9px] font-bold text-slate-400">Permanent routine update</div>
                      </div>
                    </button>
                  </div>

                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Source Slot</h4>
                  <div className="space-y-4">
                    {dayTime.days.map(d => (
                      <div key={d} className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1">{WD_FULL[d]}</div>
                        <div className="grid grid-cols-1 gap-2">
                          {dayTime.map.get(d).map(s => {
                            const active = selectedSlotKey === s.key;
                            return (
                              <button
                                key={s.key}
                                onClick={() => {
                                  setSelectedDay(d);
                                  setSelectedSlotKey(s.key);
                                }}
                                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${active ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                              >
                                <span className="text-[11px] font-black">{s.timeHHMM}</span>
                                <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {s.students.length} <Users size={8} className="inline ml-0.5" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Panel: Content */}
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                  {!selectedSlot ? (
                    <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 grid place-items-center text-slate-300 mb-6 font-black uppercase tracking-widest">
                        ?
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2">Select a source slot</h4>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed">Choose which existing routine session you want to modify from the left sidebar.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Students selection */}
                      <div>
                        <label className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Affected Students</span>
                          <div className="flex gap-4">
                            <button onClick={selectAll} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline transition-all">All</button>
                            <button onClick={clearAll} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline transition-all">None</button>
                          </div>
                        </label>
                        <div className="p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 flex flex-wrap gap-3">
                          {selectedSlot.students.map(u => {
                            const checked = selIds.includes(u._id);
                            return (
                              <div
                                key={u._id}
                                onClick={() => toggleStudent(u._id)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all cursor-pointer ${checked ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}
                              >
                                <img src={u.profileImage || `https://i.pravatar.cc/24?u=${u._id}`} className="w-5 h-5 rounded-full ring-2 ring-white/20" />
                                <span className="text-[10px] font-black uppercase tracking-tight">{u.name}</span>
                              </div>
                            );
                          })}
                        </div>
                        {removalMode && (
                          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                            <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                            <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                              Removing this weekly slot will notify all {selectedSlot.students.length} students. They must agree to the change.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Form area */}
                      <div className="pt-8 border-t border-slate-100">
                        {tab === 'oneoff' ? (
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Proposed Date & Time</label>
                              <input
                                type="datetime-local"
                                value={oneoff.proposedDate}
                                onChange={e => setOneoff({ ...oneoff, proposedDate: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-4 px-6 text-xs font-black outline-none transition-all shadow-inner"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Duration (Min)</label>
                              <input
                                type="number"
                                value={oneoff.durationMinutes}
                                onChange={e => setOneoff({ ...oneoff, durationMinutes: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-4 px-6 text-sm font-black outline-none transition-all shadow-inner"
                              />
                            </div>
                            {oneoffConflicts.conflict && (
                              <div className="col-span-2 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                <AlertCircle size={14} />
                                Conflict with: {oneoffConflicts.with.join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="flex gap-2 p-2 rounded-2xl bg-slate-100 w-fit">
                              {['add', 'update', 'remove'].map(op => (
                                <button
                                  key={op}
                                  onClick={() => setWeekly({ ...weekly, op })}
                                  className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${weekly.op === op ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                  {op}
                                </button>
                              ))}
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                              <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Weekday</label>
                                <select
                                  disabled={removalMode}
                                  value={weekly.weekday}
                                  onChange={e => setWeekly({ ...weekly, weekday: Number(e.target.value) })}
                                  className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-4 px-6 text-xs font-black outline-none transition-all shadow-inner appearance-none disabled:opacity-50"
                                >
                                  {WD_FULL.map((label, i) => (<option key={i} value={i}>{label}</option>))}
                                </select>
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Time (HH:MM)</label>
                                <input
                                  disabled={removalMode}
                                  value={weekly.timeHHMM}
                                  onChange={e => setWeekly({ ...weekly, timeHHMM: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-4 px-6 text-sm font-black outline-none transition-all shadow-inner disabled:opacity-50"
                                  placeholder="e.g., 18:30"
                                />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Duration</label>
                                <input
                                  disabled={removalMode}
                                  value={weekly.durationMinutes}
                                  onChange={e => setWeekly({ ...weekly, durationMinutes: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-4 px-6 text-sm font-black outline-none transition-all shadow-inner disabled:opacity-50"
                                />
                              </div>
                            </div>
                            {weeklyConflicts.conflict && (
                              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                <AlertCircle size={14} />
                                Weekly Conflict with: {weeklyConflicts.with.join(', ')}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-8 space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Reason / Note</label>
                          <textarea
                            value={tab === 'oneoff' ? oneoff.note : weekly.note}
                            onChange={e => tab === 'oneoff' ? setOneoff({ ...oneoff, note: e.target.value }) : setWeekly({ ...weekly, note: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-[2rem] py-5 px-8 text-sm font-bold outline-none transition-all shadow-inner resize-none"
                            rows={3}
                            placeholder="Brief explaining for this change..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-6 overflow-visible shrink-0 items-center">
                <p className="mr-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} />
                  Changes apply only after student approval
                </p>
                <button
                  onClick={onClose}
                  className="px-10 py-4 rounded-2xl border border-slate-200 bg-white font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={tab === 'oneoff' ? submitOneoff : submitWeekly}
                  disabled={tab === 'oneoff' ? !oneoffValid : !weeklyValid}
                  className={`px-12 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-200 active:scale-95 disabled:opacity-50 transition-all overflow-hidden relative group`}
                  style={{ minWidth: '240px' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${tab === 'oneoff' ? 'from-indigo-600 to-purple-600' : 'from-purple-600 to-pink-600'} opacity-100 group-hover:scale-110 transition-transform`}></div>
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <RefreshCw size={16} />
                    {tab === 'oneoff' ? 'Apply One-off' : 'Propose Weekly'}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- the page --------------------------------- */

export default function TeacherRoutinesPage() {
  const userId = useSelector((s) => s?.auth?.user?._id);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalGroup, setModalGroup] = useState(null);
  const [drawerGroup, setDrawerGroup] = useState(null);
  const [inviteGroup, setInviteGroup] = useState(null); // 👈 Invite modal

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const res = await getMyRoutines();
      const list = Array.isArray(res) ? res : (res?.items || []);
      const uniq = dedupeByKey(list, r => normalizeId(r._id));
      setGroups(groupByPost(uniq));
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutines(); }, []); // eslint-disable-line

  useSocket(
    userId,
    undefined, undefined, undefined,
    (n) => {
      const t = n?.type;
      if ([
        'routine_change_request',
        'routine_change_decision',
        'routine_change_applied',
        'routine_created',
        'routine_refresh',
        'schedules_refresh',
        // 'enrollment_invite_created', // enable if your server emits it
      ].includes(t)) {
        fetchRoutines();
      }
    }
  );

  // Build a global list of weekly slots across ALL courses for local conflict warnings
  const allWeeklySlots = useMemo(() => {
    const out = [];
    for (const g of groups) {
      for (const s of g.slotUnion) {
        out.push({
          courseKey: g.key,
          courseTitle: g.post?.title || 'Course',
          weekday: s.weekday,
          timeHHMM: s.timeHHMM,
        });
      }
    }
    return out;
  }, [groups]);

  // Optional: outgoing cache (unused directly)
  const outgoingRef = useRef([]);
  useEffect(() => { (async () => { try { outgoingRef.current = await listOutgoingRoutineChanges(); } catch { } })(); }, []);

  const onToggleGroupStatus = async (g, next) => {
    try {
      await Promise.all(g.routineIds.map(rid => setRoutineStatus(rid, next)));
      fetchRoutines();
    } catch { alert('Failed to update status'); }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden isolate">
      {/* Legendary Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 45, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-200/30 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [45, 0, 45],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-200/30 blur-[120px] rounded-full"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-md md:backdrop-blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-8 lg:p-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto w-full mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 grid place-items-center shadow-2xl shadow-slate-200">
                  <Calendar className="text-white" size={24} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My Routines</h1>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Grouped by course • Sync with students</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Groups</div>
                <div className="text-2xl font-black text-slate-900">{groups.filter(g => g.status === 'active').length} / {groups.length}</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto w-full flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar Left: Today's Schedule */}
            <div className="lg:col-span-4 space-y-10">
              <div className="space-y-6">
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  <Sparkles size={14} className="text-indigo-600" />
                  Happening Today
                </h3>
                <TodayScheduleList />
              </div>
            </div>

            {/* Main Column: Course List */}
            <div className="lg:col-span-8">
              {loading ? (
                <div className="grid place-items-center py-40">
                  <div className="relative">
                    <RefreshCw className="animate-spin text-slate-200" size={48} />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    </div>
                  </div>
                </div>
              ) : groups.length === 0 ? (
                <div className="bg-white/40 backdrop-blur-md md:backdrop-blur-xl rounded-[3rem] p-20 border border-white text-center shadow-2xl shadow-slate-200/50">
                  <div className="w-20 h-20 rounded-full bg-slate-50 grid place-items-center mx-auto mb-8">
                    <BookOpen size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">No routines found</h3>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-sm mx-auto uppercase tracking-tighter">
                    Routines are created automatically when a post starts accepting enrollments.
                  </p>
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 0.1 } }
                  }}
                  className="grid gap-8"
                >
                  {groups.map(g => (
                    <motion.div
                      key={g.key}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                      }}
                      className="group relative bg-white/60 backdrop-blur-md md:backdrop-blur-2xl rounded-[3rem] p-8 border border-white shadow-lg md:shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 hover:translate-y-[-4px]"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">
                              {g.post?.title || 'Unknown Course'}
                            </h3>
                            <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ring-1 ${g.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 shadow-sm shadow-emerald-50'
                              : 'bg-amber-50 text-amber-700 ring-amber-100 shadow-sm shadow-amber-50'
                              }`}>
                              {g.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                              <BookOpen size={14} />
                            </div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-tight line-clamp-1">{Array.isArray(g.post?.subjects) ? g.post.subjects.join(' • ') : (g.post?.subjects || '')}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Pill tone="active"><Users size={12} className="inline mr-1" /> {g.students.length} Students</Pill>
                            <Pill><Clock size={12} className="inline mr-1" /> {g.slotUnion.length} Weekly Slots</Pill>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[180px]">
                          {g.status !== 'active' ? (
                            <button onClick={() => onToggleGroupStatus(g, 'active')} className="w-full bg-slate-900 text-white rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                              Resume Course
                            </button>
                          ) : (
                            <button onClick={() => onToggleGroupStatus(g, 'paused')} className="w-full bg-white border border-slate-100 text-slate-900 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                              Pause Activity
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Action Toolbar */}
                      <div className="pt-8 border-t border-slate-100/60 flex flex-wrap gap-4">
                        <button
                          onClick={() => setModalGroup(g)}
                          className="bg-indigo-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 group/btn"
                        >
                          <div className="p-1 rounded-lg bg-white/10 group-hover/btn:scale-110 transition-transform">
                            <RefreshCw size={14} />
                          </div>
                          Propose Changes
                        </button>
                        <button
                          onClick={() => setDrawerGroup(g)}
                          className="bg-white border border-slate-100 text-slate-900 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
                        >
                          <Settings size={14} className="text-slate-400" />
                          Pending changes
                        </button>
                        <button
                          onClick={() => setInviteGroup(g)}
                          className="bg-white border border-slate-100 text-indigo-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 hover:border-indigo-100 transition-all active:scale-95"
                        >
                          <UserPlus size={14} />
                          Invite Students
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Portals */}
      <AnimatePresence>
        {modalGroup && (
          <ChangeModal
            open={!!modalGroup}
            group={modalGroup}
            onClose={() => setModalGroup(null)}
            onSent={fetchRoutines}
            otherCourseSlots={allWeeklySlots}
          />
        )}
        {drawerGroup && (
          <RequestsDrawer
            open={!!drawerGroup}
            group={drawerGroup}
            onClose={() => setDrawerGroup(null)}
          />
        )}
        {inviteGroup && (
          <InviteModal
            open={!!inviteGroup}
            group={inviteGroup}
            onClose={() => setInviteGroup(null)}
            allGroups={groups}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

