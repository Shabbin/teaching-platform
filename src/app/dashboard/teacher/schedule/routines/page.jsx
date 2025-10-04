// src/app/dashboard/teacher/schedule/routines/page.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
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

// React Query (for TodayScheduleList)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Reuse the “today + join” widget you added in step 6
import TodayScheduleList from '../../../components/scheduleComponents/TodayScheduleList';

// (optional tiny debug helper)
import { API_BASE_URL_LOG } from '../../../../../api/axios';

const brand = 'oklch(0.49 0.25 277)';

/* -------------------------------- UI helpers ------------------------------- */

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 ring-1 ring-slate-200">
      {children}
    </span>
  );
}
function StudentChip({ u, tiny = false, tone = 'default' }) {
  const name = u?.name || String(u?._id ?? u).slice(0, 8);
  const img  = u?.profileImage || 'https://i.pravatar.cc/24';
  const toneCls =
    tone === 'accepted' ? 'border-emerald-300 bg-emerald-50' :
    tone === 'rejected' ? 'border-rose-300 bg-rose-50' :
    tone === 'pending'  ? 'border-amber-300 bg-amber-50' :
                          'border-slate-200 bg-white';
  return (
    <span className={`inline-flex items-center gap-2 ${tiny ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'} rounded-full border ${toneCls}`}>
      <img src={img} alt="" className={`${tiny ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded-full object-cover`} />
      {name}
    </span>
  );
}

/* ------------------------------- data utils -------------------------------- */

const WD_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WD_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

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
    union.sort((a,b) => (a.weekday - b.weekday) || (timeToMinutes(a.timeHHMM) - timeToMinutes(b.timeHHMM)));

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

  groups.sort((a,b) => (a.post?.title || '').localeCompare(b.post?.title || ''));
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
  const fmt = iso => new Date(iso).toLocaleString('en-GB', { hour12:false });
  const chipTone = (id, r) => {
    const sid = String(id);
    if ((r.acceptedBy || []).map(String).includes(sid)) return 'accepted';
    if ((r.rejectedBy || []).map(String).includes(sid)) return 'rejected';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/30">
      <div className="h-full w-full max-w-2xl bg-white shadow-2xl border-l overflow-y-auto">
        <div className="px-5 py-4 border-b flex items-center">
          <h3 className="font-semibold">Pending changes</h3>
          <div className="ml-auto flex gap-2">
            <button onClick={fetch} className="text-xs rounded-md border px-2.5 py-1">Refresh</button>
            <button onClick={onClose} className="text-xs text-slate-600">Close</button>
          </div>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-slate-500">No requests yet.</div>
          ) : (
            <div className="space-y-4">
              {items.map(r => {
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
                const acc  = (r.acceptedBy || []).length;
                const rej  = (r.rejectedBy || []).length;

                return (
                  <div key={String(r._id)} className="border rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{header}</div>
                      <Pill>{r.status}</Pill>
                      <div className="ml-auto text=[11px] text-slate-500">{fmt(r.createdAt)}</div>
                    </div>
                    {r.note ? <div className="mt-1 text-xs text-slate-600">Note: {r.note}</div> : null}
                    <div className="mt-2 text-xs text-slate-600">{acc} accepted • {pend} pending • {rej} rejected (of {total})</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(r.studentIds || []).map(sid => (
                        <StudentChip
                          key={String(sid)}
                          u={studentIndex.get(String(sid)) || { _id: String(sid) }}
                          tiny
                          tone={chipTone(sid, r)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
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
        .sort((a,b) => (a.weekday - b.weekday) || (timeToMinutes(a.timeHHMM) - timeToMinutes(b.timeHHMM)))
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

  const toggle = (id) => setSel(cur => cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id]);
  const selectAll = () => setSel(candidates.map(s=>s._id));
  const clearAll  = () => setSel([]);

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 text-white"
          style={{ background: `linear-gradient(90deg, ${brand}, color-mix(in oklch, ${brand} 70%, white 30%))` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/20 grid place-items-center">📩</div>
            <div className="min-w-0">
              <div className="text-base font-semibold">Invite students to this course</div>
              <div className="text-xs/5 opacity-90">
                {group?.post?.title || 'Course'} • {(Array.isArray(group?.post?.subjects) ? group.post.subjects.join(' | ') : group?.post?.subjects) || '—'}
              </div>
            </div>
            <button className="ml-auto bg-white/15 hover:bg-white/25 rounded-md px-3 py-1.5 text-xs" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Target routine selector */}
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block md:col-span-3">
              <span className="text-[11px] text-slate-500">Target routine in this course</span>
              <select
                value={routineId}
                onChange={(e)=>setRoutineId(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                {routineOptions.length === 0 && <option value="">No routines found</option>}
                {routineOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label || 'Routine'} {typeof opt.count === 'number' ? ` • ${opt.count} students` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Search + candidates list */}
          <div>
            <div className="flex items-center gap-2">
              <input
                placeholder="Search students by name…"
                value={q}
                onChange={e=>setQ(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
              <button className="px-3 py-1.5 rounded-lg border" onClick={selectAll}>Select all</button>
              <button className="px-3 py-1.5 rounded-lg border" onClick={clearAll}>Clear</button>
            </div>
            <div className="mt-3 max-h-64 overflow-auto rounded-xl border p-3">
              {candidates.length === 0 ? (
                <div className="text-sm text-slate-500">No eligible students found from your other courses.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {candidates.map(s => {
                    const checked = sel.includes(s._id);
                    return (
                      <label key={s._id} className={`flex items-center gap-2 px-2 py-1 rounded-full border ${checked ? 'bg-white' : 'bg-white/70'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={()=>toggle(s._id)}
                          className="h-4 w-4 rounded border-slate-300"
                          style={{ accentColor: brand }}
                        />
                        <StudentChip u={s} />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* BDT fields + note */}
          <div className="grid md:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[11px] text-slate-500">Course fee (BDT) {defaultFeeTk ? '(pre-filled)' : '(required)'}</span>
              <input
                type="number"
                min={1}
                step="1"
                value={courseFeeTk}
                onChange={e=>setCourseFeeTk(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                placeholder={defaultFeeTk ? String(defaultFeeTk) : 'e.g., 3000'}
              />
            </label>
            <label className="block">
              <span className="text:[11px] text-slate-500">Advance (BDT, optional)</span>
              <input
                type="number"
                min={0}
                step="1"
                value={advanceTk}
                onChange={e=>setAdvanceTk(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                placeholder="Leave empty to require 15%"
              />
            </label>
            <label className="block">
              <span className="text:[11px] text-slate-500">Expires at (optional)</span>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e=>setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>

            <div className="md:col-span-3">
              <div className="text-[12px] text-slate-600">
                Upfront due per student: <span className="font-semibold">{upfrontDueTk || 0} BDT</span> {Number(advanceTk) ? '(advance)' : '(15% of course fee)'}
                {conflictCount > 0 && (
                  <span className="ml-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    {conflictCount} may have timing conflicts
                  </span>
                )}
              </div>
            </div>

            <label className="block md:col-span-3">
              <span className="text-[11px] text-slate-500">Note (optional)</span>
              <textarea
                value={note}
                onChange={e=>setNote(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                placeholder="Add a short welcome message or instructions."
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Selected students will receive an invite. They must pay the advance (or 15%) to be enrolled automatically.
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 bg-white">Cancel</button>
            <button
              disabled={!canSend}
              onClick={send}
              className="px-4 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ backgroundColor: brand }}
              title={!routineId ? 'Pick a routine to invite to' : undefined}
            >
              {sending ? 'Sending…' : 'Send invites'}
            </button>
          </div>
        </div>
      </div>
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
    const days = Array.from(byDay.keys()).sort((a,b)=>a-b);
    for (const w of days) byDay.get(w).sort((a,b) => timeToMinutes(a.timeHHMM) - timeToMinutes(b.timeHHMM));

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
    setSelIds(cur => cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id]);
  };
  const selectAll = () => {
    if (!selectedSlot) return;
    setSelIds(selectedSlot.students.map(s => s._id));
  };
  const clearAll  = () => {
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
  const timeButtons = selectedDay==null ? [] : (dayTime.map.get(selectedDay) || [])
    .map(s => ({ key: s.key, label: `${s.timeHHMM} • ${s.durationMinutes}m`, count: s.students.length }));

  const slotHuman = selectedSlot
    ? `${WD_FULL[selectedSlot.weekday]} • ${selectedSlot.timeHHMM} • ${selectedSlot.durationMinutes}m`
    : '—';

  const selectedCount = selIds.length;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 text-white"
          style={{ background: `linear-gradient(90deg, ${brand}, color-mix(in oklch, ${brand} 70%, white 30%))` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/20 grid place-items-center">🗓️</div>
            <div className="min-w-0">
              <div className="text-base font-semibold">Propose change</div>
              <div className="text-xs/5 opacity-90">
                {group?.post?.title || 'Course'} • {(Array.isArray(group?.post?.subjects) ? group.post.subjects.join(' | ') : group?.post?.subjects) || '—'}
              </div>
            </div>
            <button className="ml-auto bg-white/15 hover:bg-white/25 rounded-md px-3 py-1.5 text-xs" onClick={onClose}>Close</button>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex gap-2">
            {[{k:'oneoff',label:'One-off change'},{k:'weekly',label:'Edit weekly slot'}].map(t=>(
              <button
                key={t.k}
                onClick={()=>setTab(t.k)}
                className={`px-3 py-1.5 rounded-md text-sm border transition ${tab===t.k ? 'text-white' : 'bg-white/10 border-white/25'}`}
                style={tab===t.k ? { backgroundColor:'transparent', borderColor:'transparent' } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Day → Time picker */}
        <div className="px-6 py-4 border-b bg-white">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-slate-500">Choose day</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {dayButtons.length === 0 ? (
                  <span className="text-xs text-slate-400">No weekly slots yet.</span>
                ) : dayButtons.map(d => (
                  <button
                    key={d.value}
                    onClick={() => {
                      setSelectedDay(d.value);
                      const first = (dayTime.map.get(d.value) || [])[0];
                      setSelectedSlotKey(first?.key || '');
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${selectedDay===d.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">Choose time (for selected day)</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {timeButtons.length === 0 ? (
                  <span className="text-xs text-slate-400">Pick a day first.</span>
                ) : timeButtons.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setSelectedSlotKey(t.key)}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${selectedSlotKey===t.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50'}`}
                    title={`${t.count} ${t.count===1?'student':'students'}`}
                  >
                    {t.label} <span className="ml-1 text-[11px] opacity-80">({t.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Slot summary + student selection */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">{slotHuman}</div>
            {selectedSlot && <Pill>{selectedSlot.students.length} {selectedSlot.students.length===1?'student':'students'}</Pill>}
            <div className="ml-auto flex gap-2">
              <button onClick={selectAll} className="text-[11px] rounded-md border px-2 py-0.5" disabled={removalMode}>Select all</button>
              <button onClick={clearAll} className="text-[11px] rounded-md border px-2 py-0.5" disabled={removalMode}>Clear</button>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 p-3">
            {!selectedSlot ? (
              <div className="text-sm text-slate-500">Pick a day and time to see students.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSlot.students.map(s => {
                  const checked = selIds.includes(s._id);
                  return (
                    <label key={s._id} className={`flex items-center gap-2 px-2 py-1 rounded-full border ${checked ? 'bg-white' : 'bg-white/70'} ${removalMode ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      {!removalMode && (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={()=>toggleStudent(s._id)}
                          className="h-4 w-4 rounded border-slate-300"
                          style={{ accentColor: brand }}
                        />
                      )}
                      <StudentChip u={s} />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* REMOVE banner */}
          {removalMode && selectedSlot && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Removing a weekly slot will notify all students currently in this slot.
              It applies only for students who accept (others remain on the original routine).
            </div>
          )}
        </div>

        {/* Editors */}
        <div className="px-6 pb-2">
          {tab === 'oneoff' ? (
            <div className="rounded-xl border border-slate-200 p-4 grid md:grid-cols-3 gap-3">
              <label className="block md:col-span-2">
                <span className="text-[11px] text-slate-500">Date & Time</span>
                <input
                  type="datetime-local"
                  value={oneoff.proposedDate}
                  onChange={(e)=>setOneoff(o => ({ ...o, proposedDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
                {oneoffConflicts.conflict && (
                  <div className="mt-1 text-[11px] text-rose-600">
                    This time conflicts with {oneoffConflicts.with.join(', ')}. Pick a different time.
                  </div>
                )}
              </label>
              <label className="block">
                <span className="text-[11px] text-slate-500">Duration (minutes)</span>
                <input
                  type="number"
                  min={1}
                  value={oneoff.durationMinutes}
                  onChange={(e)=>setOneoff(o => ({ ...o, durationMinutes: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
              <label className="block md:col-span-3">
                <span className="text-[11px] text-slate-500">Note (optional)</span>
                <textarea
                  value={oneoff.note}
                  onChange={(e)=>setOneoff(o => ({ ...o, note: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="radio" name="op" checked={weekly.op === 'update'} onChange={()=>setWeekly(w => ({ ...w, op: 'update' }))} /> Update selected slot
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="radio" name="op" checked={weekly.op === 'remove'} onChange={()=>setWeekly(w => ({ ...w, op: 'remove' }))} /> Remove selected slot
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="radio" name="op" checked={weekly.op === 'add'} onChange={()=>setWeekly(w => ({ ...w, op: 'add' }))} /> Add a new slot
                </label>
              </div>

              {(weekly.op === 'update' || weekly.op === 'remove') && (
                <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                  <div className="text-[11px] text-slate-500 mb-1">Target slot</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{selectedSlot ? `${WD_FULL[selectedSlot.weekday]} • ${selectedSlot.timeHHMM} • ${selectedSlot.durationMinutes}m` : '—'}</div>
                    <Pill>{selectedCount} selected</Pill>
                  </div>
                  {weekly.op === 'remove' && (
                    <div className="mt-1 text-xs text-slate-600">
                      Removal will notify everyone in this slot. It applies only for students who accept; others keep their current routine.
                    </div>
                  )}
                </div>
              )}

              {weekly.op === 'update' && (
                <div className="grid md:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-[11px] text-slate-500">New weekday</span>
                    <select
                      value={weekly.weekday}
                      onChange={(e)=>setWeekly(w => ({ ...w, weekday: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    >
                      {WD_SHORT.map((d,i)=>(<option key={i} value={i}>{d}</option>))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-slate-500">New time (HH:mm)</span>
                    <input
                      value={weekly.timeHHMM}
                      onChange={(e)=>setWeekly(w => ({ ...w, timeHHMM: e.target.value }))}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-slate-500">New duration (mins)</span>
                    <input
                      type="number"
                      min={1}
                      value={weekly.durationMinutes}
                      onChange={(e)=>setWeekly(w => ({ ...w, durationMinutes: e.target.value }))}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                  {weeklyConflicts.conflict && (
                    <div className="md:col-span-3 text-[11px] text-rose-600">
                      This weekly time conflicts with {weeklyConflicts.with.join(', ')}.
                    </div>
                  )}
                </div>
              )}

              {weekly.op === 'add' && (
                <div className="grid md:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-[11px] text-slate-500">Weekday</span>
                    <select
                      value={weekly.weekday}
                      onChange={(e)=>setWeekly(w => ({ ...w, weekday: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    >
                      {WD_SHORT.map((d,i)=>(<option key={i} value={i}>{d}</option>))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-slate-500">Time (HH:mm)</span>
                    <input
                      value={weekly.timeHHMM}
                      onChange={(e)=>setWeekly(w => ({ ...w, timeHHMM: e.target.value }))}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-slate-500">Duration (mins)</span>
                    <input
                      type="number"
                      min={1}
                      value={weekly.durationMinutes}
                      onChange={(e)=>setWeekly(w => ({ ...w, durationMinutes: e.target.value }))}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                  {weeklyConflicts.conflict && (
                    <div className="md:col-span-3 text-[11px] text-rose-600">
                      This weekly time conflicts with {weeklyConflicts.with.join(', ')}.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedCount} selected — changes apply only after students accept.
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 bg-white">Cancel</button>
            {tab === 'oneoff' ? (
              <button
                disabled={!oneoffValid}
                onClick={submitOneoff}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-60"
                style={{ backgroundColor: brand }}
                title={oneoffConflicts.conflict ? `Conflicts with ${oneoffConflicts.with.join(', ')}` : ''}
              >
                Send request
              </button>
            ) : (
              <button
                disabled={!weeklyValid}
                onClick={submitWeekly}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-60"
                style={{ backgroundColor: brand }}
                title={weeklyConflicts.conflict ? `Conflicts with ${weeklyConflicts.with.join(', ')}` : ''}
              >
                Propose weekly change
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- the page --------------------------------- */

export default function TeacherRoutinesPage() {
  const userId = useSelector((s) => s?.auth?.user?._id);

  const [client] = useState(() => new QueryClient()); // 👈 local QueryClient for TodayScheduleList

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
  useEffect(() => { (async () => { try { outgoingRef.current = await listOutgoingRoutineChanges(); } catch {} })(); }, []);

  const onToggleGroupStatus = async (g, next) => {
    try {
      await Promise.all(g.routineIds.map(rid => setRoutineStatus(rid, next)));
      fetchRoutines();
    } catch { alert('Failed to update status'); }
  };

  return (
    <QueryClientProvider client={client}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">My Weekly Routines</h2>
          <p className="text-sm text-slate-600">Grouped by course. Manage time/day changes with student agreements.</p>
        </div>

        {/* Quick join for anything happening today */}
        <div className="mb-6">
          <TodayScheduleList />
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-slate-500">No routines yet.</div>
        ) : (
          <div className="grid gap-4">
            {groups.map(g => {
              const title = g.post?.title || 'Course';
              const subjects = Array.isArray(g.post?.subjects) ? g.post.subjects.join(' | ') : (g.post?.subjects || '');
              const studentCount = g.students.length;
              const slotCount = g.slotUnion.length;

              return (
                <div key={g.key} className="bg-white border rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{title}</div>
                      <div className="text-[12px] text-slate-600">{subjects}</div>
                    </div>
                    <Pill>{studentCount} {studentCount === 1 ? 'student' : 'students'}</Pill>
                    <Pill>{slotCount} {slotCount === 1 ? 'slot' : 'slots'}</Pill>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ring-1 ${
                      g.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : g.status === 'paused'
                        ? 'bg-amber-50 text-amber-700 ring-amber-200'
                        : 'bg-slate-100 text-slate-700 ring-slate-200'
                    }`}>{g.status}</span>
                  </div>

                  <div className="mt-4 flex gap-2 flex-wrap">
                    {g.status !== 'active' ? (
                      <button onClick={()=>onToggleGroupStatus(g, 'active')} className="px-3 py-1.5 rounded-lg border">Resume</button>
                    ) : (
                      <button onClick={()=>onToggleGroupStatus(g, 'paused')} className="px-3 py-1.5 rounded-lg border">Pause</button>
                    )}
                    <button
                      onClick={()=>setModalGroup(g)}
                      className="px-3 py-1.5 rounded-lg text-white"
                      style={{ backgroundColor: brand }}
                    >
                      Propose change
                    </button>
                    <button
                      onClick={()=>setDrawerGroup(g)}
                      className="px-3 py-1.5 rounded-lg border"
                    >
                      Pending changes
                    </button>
                    {/* Invite to this course */}
                    <button
                      onClick={()=>setInviteGroup(g)}
                      className="px-3 py-1.5 rounded-lg border"
                    >
                      Invite to course
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ChangeModal
          open={!!modalGroup}
          group={modalGroup}
          onClose={()=>setModalGroup(null)}
          onSent={fetchRoutines}
          otherCourseSlots={allWeeklySlots}
        />
        <RequestsDrawer open={!!drawerGroup} group={drawerGroup} onClose={()=>setDrawerGroup(null)} />

        {/* Invite UI */}
        <InviteModal open={!!inviteGroup} group={inviteGroup} onClose={()=>setInviteGroup(null)} allGroups={groups} />
      </div>
    </QueryClientProvider>
  );
}
