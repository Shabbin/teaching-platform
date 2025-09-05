// src/api/schedules.js
import API from './axios';

/** =========================
 *  READ
 *  ========================= */

//
// Teacher: list schedules
// NOTE: your backend teacher route doesn't support ?from/&to= yet.
// We keep the same signature to avoid breaking call sites, but ignore params.
//
export async function getTeacherSchedules(/* params = {} */) {
  const { data } = await API.get('/schedules/teacher');
  return data || [];
}

//
// Student: list schedules (optionally windowed with ?from=&to=)
// params: { from?: string, to?: string } (ISO strings)
//
export async function getStudentSchedules(params = {}) {
  const { data } = await API.get('/schedules/student', { params });
  return data || [];
}

//
// Student: list schedules awaiting their acceptance (agreement inbox)
//
export async function getStudentPendingSchedules() {
  const { data } = await API.get('/schedules/student/pending');
  return data || [];
}

/** =========================
 *  CREATE
 *  ========================= */
export async function createSchedule(payload) {
  // payload: {
  //   postId, studentIds[], subject|subjects,
  //   type: 'demo' | 'regular',
  //   date, durationMinutes,
  //   requireAgreement?: boolean  // 👈 we will default this to true (ALL schedules are invites)
  // }
  const body = {
    ...payload,
    requireAgreement: true, // force invites for demo + regular, one-off alike
  };
  const { data } = await API.post('/schedules', body);
  return data;
}

/** =========================
 *  UPDATE / ACTIONS
 *  ========================= */

//
// Teacher cancels a schedule
//
export async function cancelSchedule(id) {
  const { data } = await API.put(`/schedules/${id}/cancel`);
  return data;
}

//
// Student leaves/cancels their participation (or cancels if lone)
//
export async function cancelScheduleByStudent(id) {
  const { data } = await API.put(`/schedules/${id}/cancel-by-student`);
  return data;
}

//
// Teacher marks a (demo) schedule as completed
//
export async function completeSchedule(id) {
  const { data } = await API.patch(`/schedules/${id}/complete`);
  return data;
}

/** =========================
 *  AGREEMENT FLOW (ALL one-offs)
 *  ========================= */

//
// Unified responder for student action on a proposed schedule
// action: 'accept' | 'reject'
// NOTE: Keeps legacy shape (returns raw `data`) so existing calls don't break.
//
export async function respondSchedule(id, action) {
  const { data } = await API.put(`/schedules/${id}/respond`, { action });
  return data;
}

//
// NEW: Conflict-aware variant (recommended for new UI)
// Returns { ok, data, conflict } where `conflict===true` maps to HTTP 409 from backend.
//
export async function respondScheduleSafe(id, action) {
  try {
    const { data } = await API.put(`/schedules/${id}/respond`, { action });
    return { ok: true, data, conflict: false };
  } catch (err) {
    if (err?.response?.status === 409) {
      return { ok: false, data: err.response.data, conflict: true };
    }
    throw err;
  }
}

//
// Legacy helpers (kept to avoid breaking existing imports)
// Prefer using `respondScheduleSafe` in new code so you can branch on conflicts.
//
export async function acceptProposedSchedule(id) {
  return respondSchedule(id, 'accept');
}

export async function rejectProposedSchedule(id) {
  return respondSchedule(id, 'reject');
}

/** =========================
 *  UTILITIES
 *  ========================= */

//
// Teacher: fetch eligible (approved & paid) students for a post, filtered by type
//
export async function getApprovedStudentsForPost(postId, type) {
  const { data } = await API.get('/schedules/eligible-students', {
    params: { postId, type }, // 'demo' | 'regular'
  });
  return data || [];
}

// Keep your existing alias
export const getApprovedStudents = getApprovedStudentsForPost;
