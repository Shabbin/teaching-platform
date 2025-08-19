// src/components/scheduleComponents/FixScheduleModal.jsx
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import API from '../../../api/axios';
import {
  createSchedule,
  getApprovedStudentsForPost,
} from '../../../api/schedules';

export default function FixScheduleModal({ open, onClose }) {
  // ---- theme (your requested color) ----
  const brand = 'oklch(0.49 0.25 277)';

  // ---- state ----
  const [posts, setPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    postId: '',
    subject: '',
    studentIds: [],
    type: 'regular', // 'regular' | 'demo'
    date: '',
    durationMinutes: '',
  });

  // ---- load teacher posts on open ----
  useEffect(() => {
    if (!open) return;
    setLoadingPosts(true);
    API.get('/posts/mine')
      .then((res) => setPosts(res.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, [open]);

  // ---- load approved students for selected post ----
  useEffect(() => {
    let active = true;
    (async () => {
      if (!form.postId) {
        setStudents([]);
        return;
      }
      setLoadingStudents(true);
      try {
        const list = await getApprovedStudentsForPost(form.postId);
        if (active) setStudents(Array.isArray(list) ? list : []);
      } finally {
        if (active) setLoadingStudents(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [form.postId]);

  // ---- default subject from post ----
  useEffect(() => {
    const p = posts.find((x) => x._id === form.postId);
    setForm((f) => ({
      ...f,
      subject: p?.subjects?.[0] || '',
      studentIds: [], // reset selection when post changes
    }));
  }, [form.postId, posts]);

  // ---- debounce search ----
  useEffect(() => {
    const t = setTimeout(
      () => setSearch(searchRaw.trim().toLowerCase()),
      160
    );
    return () => clearTimeout(t);
  }, [searchRaw]);

  // ---- derived lists ----
  const subjects = useMemo(() => {
    const p = posts.find((x) => x._id === form.postId);
    return Array.isArray(p?.subjects) ? p.subjects : [];
  }, [posts, form.postId]);

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    return students.filter((s) =>
      (s?.studentId?.name || '').toLowerCase().includes(search)
    );
  }, [students, search]);

  // ---- helpers ----
  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleStudent = (id) =>
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id)
        ? f.studentIds.filter((x) => x !== id)
        : [...f.studentIds, id],
    }));

  const selectAllFiltered = () =>
    setForm((f) => ({
      ...f,
      studentIds: Array.from(
        new Set([...f.studentIds, ...filteredStudents.map((s) => s.studentId._id)])
      ),
    }));

  const clearSelected = () =>
    setForm((f) => ({ ...f, studentIds: [] }));

  const removeChip = (id) =>
    setForm((f) => ({ ...f, studentIds: f.studentIds.filter((x) => x !== id) }));

  const canCreate =
    form.postId &&
    form.subject &&
    form.date &&
    Number(form.durationMinutes) > 0 &&
    form.studentIds.length > 0;

  const submit = async () => {
    setErrorMsg('');
    if (!canCreate) {
      setErrorMsg('Please complete all required fields.');
      return;
    }
    try {
      setIsSubmitting(true);
      await createSchedule({
        postId: form.postId,
        studentIds: form.studentIds,
        subject: form.subject,
        date: form.date,
        durationMinutes: Number(form.durationMinutes),
        type: form.type,
      });
      onClose();
      alert('✅ Schedule created!');
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || 'Failed to create schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
      {/* CONTAINER: fixed height, column, sticky footer */}
      <div className="w-full max-w-[940px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* HEADER (non-scrolling) */}
        <div
          className="px-6 py-5 text-white"
          style={{
            background: `linear-gradient(90deg, ${brand}, color-mix(in oklch, ${brand} 70%, white 30%))`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/20 grid place-items-center">
              📅
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Create a Class</h2>
              <p className="text-xs/5 opacity-90">
                Pick post, students, time — done.
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto rounded-md bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* BODY (scrolls) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Class details */}
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Class Details
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {/* Post */}
                <label className="block">
                  <span className="text-[11px] text-slate-500">Post</span>
                  <select
                    name="postId"
                    value={form.postId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, postId: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': brand }}
                  >
                    <option value="">
                      {loadingPosts ? 'Loading…' : '— Select a post —'}
                    </option>
                    {posts.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title || 'Untitled Post'}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Subject */}
                <label className="block">
                  <span className="text-[11px] text-slate-500">Subject</span>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={updateField}
                    disabled={!subjects.length}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 disabled:bg-slate-50"
                    style={{ '--tw-ring-color': brand }}
                  >
                    {subjects.length === 0 ? (
                      <option value="">—</option>
                    ) : (
                      subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                {/* Type */}
                <div className="block">
                  <span className="text-[11px] text-slate-500">Type</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {['regular', 'demo'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${
                          form.type === t
                            ? 'text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                        style={
                          form.type === t
                            ? { backgroundColor: brand, borderColor: brand }
                            : {}
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Students */}
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Students (approved)
                </h3>
                {loadingStudents && (
                  <span className="text-xs text-slate-500">Loading…</span>
                )}
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    🔎
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllFiltered}
                    disabled={!filteredStudents.length}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    Select all (filtered)
                  </button>
                  <button
                    onClick={clearSelected}
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
                    const s = students.find((x) => x.studentId?._id === id);
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
                          onClick={() => removeChip(id)}
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

              {/* list (scrolls) */}
              <div className="rounded-lg border border-slate-200 max-h-72 overflow-y-auto">
                {(!students.length && !loadingStudents) ? (
                  <div className="px-3 py-4 text-xs text-slate-500">
                    No approved students for this post.
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
                              onChange={() => toggleStudent(id)}
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
                                Approved
                              </div>
                            </div>
                            {selected && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: brand }}
                              >
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

          {/* schedule */}
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Schedule
              </h3>
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
        </div>

        {/* FOOTER (sticky, never scrolls out) */}
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={isSubmitting || !canCreate}
              className="rounded-lg px-4 py-2 text-white shadow disabled:opacity-60"
              style={{ backgroundColor: brand }}
            >
              {isSubmitting ? 'Creating…' : 'Create class'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
