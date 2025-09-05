// src/app/dashboard/components/scheduleComponents/FixScheduleModal.jsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import API from '../../../../api/axios';
import { createSchedule, getApprovedStudentsForPost } from '../../../../api/schedules';
import { createRoutine } from '../../../../api/routines';
import { createPrivateCourse } from '../../../../api/privateCourses';

// 🔊 Bump this so you can confirm you’re running the latest code in the UI/console
const VERSION = 'FixScheduleModal_vFee_2025-09-05_01';

/* ----------------- LOCAL DEBUG HELPERS (so errors never print `{}`) ----------------- */
function _safeParse(v) {
  if (v == null) return null;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
}

function _logAxiosErrorLocal(prefix, err, extraMsg = '') {
  const isAxios = !!err?.isAxiosError;
  const method = err?.config?.method?.toUpperCase?.() || '(unknown)';
  const baseURL = err?.config?.baseURL || '';
  const urlPath = err?.config?.url || '';
  const url = `${baseURL}${urlPath}`;
  const status = err?.response?.status;
  const code = err?.code;
  const reqData = _safeParse(err?.config?.data);
  const resData = err?.response?.data;
  const normalized = err?.normalizedMessage;

  // We avoid logging whole error objects (which collapse to {}), and pick known-safe fields.
  const header = `${prefix} ${method} ${url} → ${status ?? code ?? 'ERR'}`;
  console.log('–––––––––––––––––––––––––––––––––––––––––––––––––––––');
  console.log(header);
  if (extraMsg) console.log('Message:', extraMsg);
  if (normalized) console.log('Normalized:', normalized);
  console.log('isAxiosError:', isAxios, 'code:', code);
  console.log('Request:', { method, baseURL, url: urlPath, headers: err?.config?.headers, data: reqData });
  console.log('Response:', { status, statusText: err?.response?.statusText, headers: err?.response?.headers, data: resData });
  if (!isAxios) console.log('Raw error message:', err?.message);
  if (err?.stack) console.log('Stack:', err.stack);
  console.log('–––––––––––––––––––––––––––––––––––––––––––––––––––––');
}
/* ---------------------------------------------------------------------- */

const WEEKDAYS = [
  { i: 0, label: 'Sunday' },
  { i: 1, label: 'Monday' },
  { i: 2, label: 'Tuesday' },
  { i: 3, label: 'Wednesday' },
  { i: 4, label: 'Thursday' },
  { i: 5, label: 'Friday' },
  { i: 6, label: 'Saturday' },
];

export default function FixScheduleModal({ open, onClose }) {
  const brand = 'oklch(0.49 0.25 277)';
  const queryClient = useQueryClient();

  // ---- DEBUG: prove file actually mounted ----
  useEffect(() => {
    console.log(`[${VERSION}] mounted. open=`, open);
    return () => console.log(`[${VERSION}] unmounted`);
  }, []);

  // ---------------- Lists & UI state ----------------
  const [posts, setPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');

  // 🚨 DEFAULT TO 'private' so the fee field is on screen immediately
  const [mode, setMode] = useState('private');
  useEffect(() => {
    console.log(`[${VERSION}] mode ->`, mode);
  }, [mode]);

  const [form, setForm] = useState({
    postId: '',
    subject: '',
    studentIds: [],
    type: 'demo',
    date: '',
    durationMinutes: '',
  });

  // ---------------- PRIVATE COURSE state ----------------
  const [privateForm, setPrivateForm] = useState({
    title: '',
    subject: '',
    description: '',
    payBy: '',
    feeTk: '', // ✅ REQUIRED: teacher fee (BDT)
  });
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [pSearchRaw, setPSearchRaw] = useState('');
  const [pSearch, setPSearch] = useState('');
  const [pSelected, setPSelected] = useState([]);

  useEffect(() => {
    console.log(`[${VERSION}] privateForm change:`, privateForm);
  }, [privateForm]);

  // Fee input ref to verify it exists & scroll to it
  const feeRef = useRef(null);
  useEffect(() => {
    if (!open || mode !== 'private') return;
    const el = document.getElementById('private-fee-field-input');
    console.log(`[${VERSION}] fee field present?`, !!el, el);
    try {
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus();
    } catch {}
  }, [open, mode]);

  // ---------------- Routine state ----------------
  const todayISO = new Date().toISOString().slice(0, 16);
  const [routine, setRoutine] = useState({
    timezone: 'Asia/Dhaka',
    startDate: todayISO,
    endDate: '',
    days: WEEKDAYS.map((d) => ({
      weekday: d.i,
      enabled: false,
      timeHHMM: '',
      durationMinutes: '',
    })),
  });

  // ---- load teacher posts on open ----
  useEffect(() => {
    if (!open) return;
    console.log(`[${VERSION}] fetching /posts/mine ...`);
    setLoadingPosts(true);
    API.get('/posts/mine')
      .then((res) => {
        console.log(`[${VERSION}] posts loaded:`, res.data?.length || 0);
        setPosts(res.data || []);
      })
      .catch((e) => {
        console.warn(`[${VERSION}] posts load failed`, e);
        setPosts([]);
      })
      .finally(() => setLoadingPosts(false));
  }, [open]);

  // ---- load eligible students for selected post + type ----
  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      if (!form.postId) {
        setStudents([]);
        return;
      }
      setLoadingStudents(true);
      try {
        const chosenType = mode === 'routine' ? 'regular' : form.type;
        console.log(`[${VERSION}] fetching approved students for post=${form.postId} type=${chosenType}`);
        const list = await getApprovedStudentsForPost(form.postId, chosenType);
        if (active) {
          console.log(`[${VERSION}] students loaded:`, Array.isArray(list) ? list.length : 0);
          setStudents(Array.isArray(list) ? list : []);
          setForm((f) => ({ ...f, studentIds: [] }));
        }
      } catch (e) {
        console.warn(`[${VERSION}] students load failed`, e);
      } finally {
        if (active) setLoadingStudents(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, form.postId, form.type, mode]);

  // ---- subjects for the selected post ----
  const subjects = useMemo(() => {
    const p = posts.find((x) => x._id === form.postId);
    return Array.isArray(p?.subjects) ? p.subjects : [];
  }, [posts, form.postId]);

  useEffect(() => {
    const combined = subjects.length ? subjects.join(' | ') : '';
    setForm((f) => ({
      ...f,
      subject: combined,
      studentIds: [],
    }));
  }, [subjects]);

  // ---- debounce searches ----
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchRaw.trim().toLowerCase()), 160);
    return () => clearTimeout(t);
  }, [searchRaw]);

  useEffect(() => {
    const t = setTimeout(() => setPSearch(pSearchRaw.trim().toLowerCase()), 160);
    return () => clearTimeout(t);
  }, [pSearchRaw]);

  // ---- aggregate roster across all posts (for PRIVATE mode) ----
  useEffect(() => {
    if (!open || mode !== 'private' || !posts.length) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingRoster(true);
        console.log(`[${VERSION}] building private roster from ${posts.length} posts...`);
        const results = await Promise.allSettled(
          posts.map((p) => getApprovedStudentsForPost(p._id, 'regular'))
        );

        const map = new Map();
        for (const r of results) {
          const list = r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [];
          for (const it of list) {
            const s = it?.studentId;
            if (!s?._id) continue;
            const key = String(s._id);
            if (!map.has(key)) {
              map.set(key, {
                _id: key,
                name: s.name,
                profileImage: s.profileImage,
              });
            }
          }
        }
        if (!cancelled) {
          const arr = Array.from(map.values());
          console.log(`[${VERSION}] roster size:`, arr.length);
          setRoster(arr);
          setPSelected([]);
        }
      } finally {
        if (!cancelled) setLoadingRoster(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, mode, posts]);

  // ---- filters ----
  const filteredStudents = useMemo(() => {
    if (!search) return students;
    return students.filter((s) => (s?.studentId?.name || '').toLowerCase().includes(search));
  }, [students, search]);

  const filteredRoster = useMemo(() => {
    if (!pSearch) return roster;
    return roster.filter((s) => (s.name || '').toLowerCase().includes(pSearch));
  }, [roster, pSearch]);

  // ---- helpers ----
  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // PRIVATE helpers
  const onPrivateField = (e) => setPrivateForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ---- guards ----
  const canCreateOneOff =
    form.postId && form.subject && form.date && Number(form.durationMinutes) > 0 && form.studentIds.length > 0;

  const selectedRoutineDays = routine.days.filter((d) => d.enabled && d.timeHHMM && Number(d.durationMinutes) > 0);
  const canCreateRoutine = form.postId && form.subject && form.studentIds.length > 0 && selectedRoutineDays.length > 0;

  const canCreatePrivate =
    privateForm.title.trim() && privateForm.subject.trim() && pSelected.length > 0 && Number(privateForm.feeTk) > 0;

  // 15% platform fee preview
  const feeNum = Number(privateForm.feeTk || 0);
  const upfrontPreview = feeNum > 0 ? Math.round(feeNum * 0.15) : 0;
  useEffect(() => {
    console.log(`[${VERSION}] feeTk=`, privateForm.feeTk, 'upfrontPreview=', upfrontPreview);
  }, [privateForm.feeTk, upfrontPreview]);

  // ---- submit handlers ----
  const submit = async () => {
    setErrorMsg('');
    try {
      setIsSubmitting(true);

      if (mode === 'private') {
        if (!canCreatePrivate) {
          console.warn(`[${VERSION}] submit blocked (private)`, { canCreatePrivate, privateForm, pSelected });
          setErrorMsg('Please fill Title, Subject, Monthly Fee (BDT) and select at least one student.');
          setIsSubmitting(false);
          return;
        }
        const payload = {
          title: privateForm.title.trim(),
          subject: privateForm.subject.trim(),
          description: privateForm.description?.trim() || undefined,
          payBy: privateForm.payBy ? new Date(privateForm.payBy).toISOString() : undefined,
          studentIds: pSelected,
          feeTk: Number(privateForm.feeTk),
          currency: 'BDT',
        };
        console.log(`[${VERSION}] createPrivateCourse payload:`, payload);
        await createPrivateCourse(payload);
        console.log(`[${VERSION}] createPrivateCourse success`);
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
        alert('✅ Private course created. Invites sent; students will be engaged when they accept.');
        setPrivateForm({ title: '', subject: '', description: '', payBy: '', feeTk: '' });
        setPSelected([]);
        onClose();
        return;
      }

      if (mode === 'oneoff') {
        if (!canCreateOneOff) {
          setErrorMsg('Please complete all required fields.');
          setIsSubmitting(false);
          return;
        }
        await createSchedule({
          postId: form.postId,
          studentIds: form.studentIds,
          subject: form.subject,
          date: form.date,
          durationMinutes: Number(form.durationMinutes),
          type: form.type,
          requireAgreement: true,
        });

        queryClient.invalidateQueries({ queryKey: ['schedules'] });
        onClose();
        alert('✅ Invitation sent. Students must accept.');
        return;
      }

      if (!canCreateRoutine) {
        setErrorMsg('Pick at least one weekday with a time & duration, and select students.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        postId: form.postId,
        studentIds: form.studentIds,
        timezone: routine.timezone || 'Asia/Dhaka',
        startDate: routine.startDate ? new Date(routine.startDate).toISOString() : undefined,
        endDate: routine.endDate ? new Date(routine.endDate).toISOString() : undefined,
        slots: selectedRoutineDays.map((d) => ({
          weekday: d.weekday,
          timeHHMM: d.timeHHMM,
          durationMinutes: Number(d.durationMinutes),
        })),
        requiresAcceptance: true,
      };

      console.log(`[${VERSION}] createRoutine payload:`, payload);
      await createRoutine(payload);
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      onClose();
      alert('✅ Routine proposed! Students must accept before it activates.');
    } catch (e) {
      // 🔥 Never logs `{}` anymore — shows request, response, status, and any normalized message
      _logAxiosErrorLocal(
        `[${VERSION}] submit`,
        e,
        e?.response?.data?.message || e?.normalizedMessage || e?.message || 'Request failed'
      );
      setErrorMsg(e?.response?.data?.message || e?.normalizedMessage || e?.message || 'Failed to create.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
      <div className="w-full max-w-[980px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* 🔊 DEBUG BANNER */}
        <div className="bg-amber-300 text-black text-center text-[11px] py-1">
          <b>{VERSION}</b> • mode={mode} • If you don’t see this banner, you’re not rendering this file.
        </div>

        {/* HEADER */}
        <div
          className="px-6 pt-5 pb-4 text-white"
          style={{
            background: `linear-gradient(90deg, ${brand}, color-mix(in oklch, ${brand} 70%, white 30%))`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/20 grid place-items-center">📅</div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold" data-testid="fsm-header">
                {mode === 'private' ? 'Create a Private Course — FEE FIELD ACTIVE' : 'Create a Class'}
              </h2>
              <p className="text-xs/5 opacity-90">
                {mode === 'private'
                  ? 'Invite selected students to a private course. They’ll be engaged when they accept.'
                  : 'One-off or weekly routine.'}
              </p>
              <div className="text-[10px] opacity-80 mt-1">DEBUG: {VERSION} • mode={mode}</div>
            </div>

            <button
              onClick={onClose}
              className="ml-auto rounded-md bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs transition"
            >
              Close
            </button>
          </div>

          {/* TABS (includes Private) */}
          <div className="mt-3 flex items-center gap-2">
            {[{ k: 'oneoff', label: 'One-off' }, { k: 'routine', label: 'Routine (weekly)' }, { k: 'private', label: 'Private Course' }].map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => setMode(t.k)}
                className={`px-3 py-1.5 rounded-md text-sm border transition ${
                  mode === t.k ? 'bg-white text-slate-900 border-white' : 'bg-white/10 border-white/25 text-white'
                }`}
                title={t.label}
                data-testid={`tab-${t.k}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* -------- PRIVATE COURSE BODY -------- */}
          {mode === 'private' ? (
            <>
              <div className="text-[11px] text-emerald-700">DEBUG: Rendering PRIVATE section (fee field below)</div>

              <section className="rounded-xl border border-slate-200 bg-white" data-testid="private-section">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Course Details</h3>

                  {/* Fee field FIRST so it's always visible */}
                  <div className="grid gap-3 md:grid-cols-2">
                    {/* ✅ Monthly Fee (BDT) — REQUIRED */}
                    <label className="block" id="private-fee-field" data-testid="private-fee-field">
                      <span className="text-[11px] text-slate-500">Monthly Fee (BDT) *</span>
                      <input
                        ref={feeRef}
                        id="private-fee-field-input"
                        type="number"
                        min={1}
                        step="1"
                        name="feeTk"
                        value={privateForm.feeTk}
                        onChange={onPrivateField}
                        className="mt-1 w-full rounded-lg border px-3 py-2 ring-4 ring-rose-300 focus:ring-indigo-300"
                        placeholder="e.g., 5000"
                      />
                      <div className="text-[11px] text-slate-500 mt-1">
                        Platform fee is <b>15%</b>. Upfront due: <b>৳{(Number(privateForm.feeTk || 0) * 0.15).toFixed(0)}</b>.
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-1">
                        DEBUG: feeTk={String(privateForm.feeTk || '')}
                      </div>
                    </label>

                    {/* Title */}
                    <label className="block">
                      <span className="text-[11px] text-slate-500">Title *</span>
                      <input
                        name="title"
                        value={privateForm.title}
                        onChange={onPrivateField}
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        placeholder="e.g., Mathematics — Algebra Basics"
                      />
                    </label>

                    {/* Subject */}
                    <label className="block">
                      <span className="text-[11px] text-slate-500">Subject *</span>
                      <input
                        name="subject"
                        value={privateForm.subject}
                        onChange={onPrivateField}
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        placeholder="e.g., Mathematics"
                      />
                    </label>

                    {/* Pay-by deadline */}
                    <label className="block">
                      <span className="text-[11px] text-slate-500">Pay by (deadline)</span>
                      <input
                        type="datetime-local"
                        name="payBy"
                        value={privateForm.payBy}
                        onChange={onPrivateField}
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                      />
                      <div className="text-[11px] text-slate-500 mt-1">Students should complete payment by this time.</div>
                    </label>

                    {/* Description */}
                    <label className="block md:col-span-2">
                      <span className="text-[11px] text-slate-500">Description (optional)</span>
                      <textarea
                        name="description"
                        value={privateForm.description}
                        onChange={onPrivateField}
                        rows={3}
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        placeholder="Short summary, goals, or materials..."
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* Students selection */}
              <section className="rounded-xl border border-slate-200 bg-white">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">Students</h3>
                    {loadingRoster && <span className="text-xs text-slate-500">Loading roster…</span>}
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
                    <div className="relative flex-1">
                      <input
                        value={pSearchRaw}
                        onChange={(e) => setPSearchRaw(e.target.value)}
                        placeholder="Search students…"
                        className="w-full rounded-lg border border-slate-300 px-10 py-2 outline-none focus:ring-2"
                        style={{ '--tw-ring-color': brand }}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPSelected(filteredRoster.map((s) => s._id))}
                        disabled={!filteredRoster.length}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        Select all (filtered)
                      </button>
                      <button
                        onClick={() => setPSelected([])}
                        disabled={!pSelected.length}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {pSelected.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {pSelected.map((id) => {
                        const s = roster.find((x) => x._id === id);
                        if (!s) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                            style={{
                              backgroundColor: `color-mix(in oklch, white 85%, ${brand} 15%)`,
                              borderColor: brand,
                              color: 'oklch(0.37 0.15 277)',
                            }}
                          >
                            <img
                              src={s.profileImage || 'https://i.pravatar.cc/32'}
                              alt={s.name}
                              className="h-4 w-4 rounded-full object-cover"
                            />
                            {s.name || s._id.slice(0, 8)}
                            <button
                              onClick={() => setPSelected((cur) => cur.filter((x) => x !== id))}
                              className="ml-1 rounded-full px-1 leading-none hover:bg-black/5"
                              title="Remove"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="rounded-lg border border-slate-200 max-h-72 overflow-y-auto">
                    {(!roster.length && !loadingRoster) ? (
                      <div className="px-3 py-4 text-xs text-slate-500">No students found in your roster yet.</div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {filteredRoster.map((s) => {
                          const id = s._id;
                          const selected = pSelected.includes(id);
                          return (
                            <li key={id}>
                              <label className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    setPSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
                                  }
                                  className="h-4 w-4 rounded border-slate-300"
                                  style={{ accentColor: brand }}
                                />
                                <img
                                  src={s.profileImage || 'https://i.pravatar.cc/64'}
                                  alt={s.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-slate-800 truncate">
                                    {s.name || s._id.slice(0, 8)}
                                  </div>
                                  <div className="text-[11px] text-slate-500">Approved • paid (eligible)</div>
                                </div>
                                {selected && (
                                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: brand }}>
                                    Selected
                                  </span>
                                )}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </section>

              {errorMsg && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">{errorMsg}</p>
              )}
            </>
          ) : null}

          {/* -------- ONE-OFF / ROUTINE -------- */}
          {mode !== 'private' && (
            <>
              {/* Class details */}
              <section className="rounded-xl border border-slate-200 bg-white">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Class Details</h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    {/* Post */}
                    <label className="block">
                      <span className="text-[11px] text-slate-500">Post</span>
                      <select
                        name="postId"
                        value={form.postId}
                        onChange={(e) => setForm((f) => ({ ...f, postId: e.target.value }))} 
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2"
                        style={{ '--tw-ring-color': brand }}
                      >
                        <option value="">{loadingPosts ? 'Loading…' : '— Select a post —'}</option>
                        {posts.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.title || 'Untitled Post'}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Subject (combined, read-only) */}
                    <label className="block">
                      <span className="text-[11px] text-slate-500">Subject</span>
                      <input
                        name="subject"
                        value={form.subject}
                        readOnly
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        title="Combined subjects"
                      />
                    </label>

                    {/* Type (ONE-OFF only) */}
                    {mode === 'oneoff' ? (
                      <div className="block">
                        <span className="text-[11px] text-slate-500">Type</span>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          {['regular', 'demo'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, type: t }))}
                              className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${
                                form.type === t ? 'text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                              style={form.type === t ? { backgroundColor: brand, borderColor: brand } : {}}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="block">
                        <span className="text-[11px] text-slate-500">Type</span>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm border bg-slate-50 text-slate-700">
                            Regular (routine)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Students */}
              <section className="rounded-xl border border-slate-200 bg-white">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {mode === 'oneoff'
                        ? form.type === 'demo'
                          ? 'Students (approved & unpaid)'
                          : 'Students (paid)'
                        : 'Students (paid)'}
                    </h3>
                    {loadingStudents && <span className="text-xs text-slate-500">Loading…</span>}
                  </div>

                  {/* search + bulk actions */}
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
                    <div className="relative flex-1">
                      <input
                        value={searchRaw}
                        onChange={(e) => setSearchRaw(e.target.value)}
                        placeholder="Search students…"
                        className="w-full rounded-lg border border-slate-300 px-10 py-2 outline-none focus:ring-2"
                        style={{ '--tw-ring-color': brand }}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            studentIds: Array.from(
                              new Set([...f.studentIds, ...filteredStudents.map((s) => s.studentId._id)])
                            ),
                          }))
                        }
                        disabled={!filteredStudents.length}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        Select all (filtered)
                      </button>
                      <button
                        onClick={() => setForm((f) => ({ ...f, studentIds: [] }))}
                        disabled={!form.studentIds.length}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* selected chips */}
                  {form.studentIds.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {form.studentIds.map((id) => {
                        const s = students.find((x) => x?.studentId?._id === id);
                        if (!s) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                            style={{
                              backgroundColor: `color-mix(in oklch, white 85%, ${brand} 15%)`,
                              borderColor: brand,
                              color: 'oklch(0.37 0.15 277)',
                            }}
                          >
                            <img
                              src={s.studentId.profileImage || 'https://i.pravatar.cc/32'}
                              alt={s.studentId.name}
                              className="h-4 w-4 rounded-full object-cover"
                            />
                            {s.studentId.name}
                            <button
                              onClick={() =>
                                setForm((f) => ({ ...f, studentIds: f.studentIds.filter((x) => x !== id) }))
                              }
                              className="ml-1 rounded-full px-1 leading-none hover:bg-black/5"
                              title="Remove"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* list */}
                  <div className="rounded-lg border border-slate-200 max-h-72 overflow-y-auto">
                    {(!students.length && !loadingStudents) ? (
                      <div className="px-3 py-4 text-xs text-slate-500">
                        {mode === 'oneoff'
                          ? form.type === 'demo'
                            ? 'No approved unpaid students for this post.'
                            : 'No paid students for this post.'
                          : 'No paid students for this post.'}
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {filteredStudents.map((s) => {
                          const id = s.studentId._id;
                          const selected = form.studentIds.includes(id);
                          return (
                            <li key={id}>
                              <label className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    setForm((f) => ({
                                      ...f,
                                      studentIds: f.studentIds.includes(id)
                                        ? f.studentIds.filter((x) => x !== id)
                                        : [...f.studentIds, id],
                                    }))
                                  }
                                  className="h-4 w-4 rounded border-slate-300"
                                  style={{ accentColor: brand }}
                                />
                                <img
                                  src={s.studentId.profileImage || 'https://i.pravatar.cc/64'}
                                  alt={s.studentId.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-slate-800 truncate">
                                    {s.studentId.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {mode === 'oneoff'
                                      ? form.type === 'demo'
                                        ? 'Approved • unpaid'
                                        : 'Approved • paid'
                                      : 'Approved • paid'}
                                  </div>
                                </div>
                                {selected && (
                                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: brand }}>
                                    Selected
                                  </span>
                                )}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </section>

              {/* Schedule block: one-off OR routine */}
              {mode === 'oneoff' ? (
                <section className="rounded-xl border border-slate-200 bg-white">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Schedule</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="block md:col-span-2">
                        <span className="text-[11px] text-slate-500">Date & Time</span>
                        <input
                          type="datetime-local"
                          name="date"
                          value={form.date}
                          onChange={updateField}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2"
                          style={{ '--tw-ring-color': brand }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] text-slate-500">Duration (minutes)</span>
                        <input
                          type="number"
                          min={1}
                          name="durationMinutes"
                          value={form.durationMinutes}
                          onChange={updateField}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2"
                          style={{ '--tw-ring-color': brand }}
                        />
                      </label>
                    </div>

                    {errorMsg && (
                      <p className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
                        {errorMsg}
                      </p>
                    )}
                  </div>
                </section>
              ) : (
                <section className="rounded-xl border border-slate-200 bg-white">
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800">Routine (weekly)</h3>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="block">
                        <span className="text-[11px] text-slate-500">Timezone</span>
                        <input
                          value={routine.timezone}
                          onChange={(e) => setRoutine((r) => ({ ...r, timezone: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2"
                          style={{ '--tw-ring-color': brand }}
                          placeholder="Asia/Dhaka"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] text-slate-500">Start From</span>
                        <input
                          type="datetime-local"
                          value={routine.startDate}
                          onChange={(e) => setRoutine((r) => ({ ...r, startDate: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2"
                          style={{ '--tw-ring-color': brand }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] text-slate-500">End Date (optional)</span>
                        <input
                          type="datetime-local"
                          value={routine.endDate}
                          onChange={(e) => setRoutine((r) => ({ ...r, endDate: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2"
                          style={{ '--tw-ring-color': brand }}
                        />
                      </label>
                    </div>

                    <div className="rounded-lg border border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        {routine.days.map((d) => (
                          <div
                            key={d.weekday}
                            className="flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r last:border-b-0 md:last:border-r-0"
                          >
                            <label className="flex items-center gap-2 min-w-[110px]">
                              <input
                                type="checkbox"
                                checked={d.enabled}
                                onChange={(e) =>
                                  setRoutine((r) => ({
                                    ...r,
                                    days: r.days.map((x) => (x.weekday === d.weekday ? { ...x, enabled: e.target.checked } : x)),
                                  }))
                                }
                                className="h-4 w-4 rounded border-slate-300"
                                style={{ accentColor: brand }}
                              />
                              <span className="text-sm text-slate-800">{WEEKDAYS[d.weekday].label}</span>
                            </label>

                            <input
                              type="time"
                              value={d.timeHHMM}
                              onChange={(e) =>
                                setRoutine((r) => ({
                                  ...r,
                                  days: r.days.map((x) => (x.weekday === d.weekday ? { ...x, timeHHMM: e.target.value } : x)),
                                }))
                              }
                              disabled={!d.enabled}
                              className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none disabled:bg-slate-50"
                            />

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500">mins</span>
                              <input
                                type="number"
                                min={1}
                                value={d.durationMinutes}
                                onChange={(e) =>
                                  setRoutine((r) => ({
                                    ...r,
                                    days: r.days.map((x) =>
                                      x.weekday === d.weekday ? { ...x, durationMinutes: e.target.value } : x
                                    ),
                                  }))
                                }
                                disabled={!d.enabled}
                                className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none disabled:bg-slate-50"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
                        {errorMsg}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {mode === 'private'
                ? 'Students will receive a private course invite. They’re engaged when they accept.'
                : mode === 'routine'
                ? 'Routine creates weekly classes after students accept.'
                : 'All one-off classes (demo or regular) are invitations; students must accept.'}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={
                  isSubmitting ||
                  (mode === 'private' ? !canCreatePrivate : mode === 'oneoff' ? !canCreateOneOff : !canCreateRoutine)
                }
                className="rounded-lg px-4 py-2 text-white shadow disabled:opacity-60"
                style={{ backgroundColor: brand }}
                data-testid="submit-btn"
              >
                {isSubmitting
                  ? 'Creating…'
                  : mode === 'private'
                  ? 'Create & Invite'
                  : mode === 'oneoff'
                  ? 'Send invitation'
                  : 'Propose routine'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
