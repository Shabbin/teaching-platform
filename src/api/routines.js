// src/api/routines.js
import API from './axios';

// Re-export routine-change APIs from a single source of truth to avoid duplication:
export {
  createRoutineChange as proposeRoutineChange,
  listOutgoingRoutineChanges,
  listIncomingRoutineChanges,
  respondRoutineChange,
} from './routineChanges';

// ---- ROUTINES (weekly) ----

/**
 * payload: {
 *   postId,
 *   studentIds[],
 *   timezone?: string,
 *   startDate?: ISO string,
 *   endDate?: ISO string,
 *   slots: [{ weekday, timeHHMM, durationMinutes }],
 *   requiresAcceptance?: boolean   // legacy front-end key
 *   requireAgreement?: boolean     // server controller key
 * }
 */
export async function createRoutine(payload) {
  // Force invitations for ALL routines (students must accept).
  // Also send BOTH keys to be compatible with any controller variant.
  const body = {
    ...payload,
    requiresAcceptance: true, // front-end legacy key
    requireAgreement: true,   // server controller key
  };

  const { data } = await API.post('/routines', body);
  return data;
}

export async function getMyRoutines(params = {}) {
  // optional server-side paging: { page, limit, status }
  const query = new URLSearchParams(params).toString();
  const { data } = await API.get(`/routines/mine${query ? `?${query}` : ''}`);
  return data || { items: [], page: 1, limit: 20, total: 0 };
}

// Student: list routines they belong to (used in student pages)
export async function getStudentRoutines() {
  const { data } = await API.get('/routines/student');
  return data || [];
}

export async function setRoutineStatus(id, status) {
  const { data } = await API.patch(`/routines/${id}/status`, { status });
  return data;
}

export async function deleteRoutine(id) {
  const { data } = await API.delete(`/routines/${id}`);
  return data;
}

export async function previewRoutine(payload) {
  const { data } = await API.post('/routines/preview', payload);
  return data;
}

// ---- AGREEMENT (routine-level) ----

// Student: list routines awaiting their acceptance
export async function getStudentPendingRoutines() {
  const { data } = await API.get('/routines/student/pending');
  return data || [];
}

// Unified student response for a routine
export async function respondRoutine(id, action) {
  const { data } = await API.put(`/routines/${id}/respond`, { action }); // action: 'accept' | 'reject'
  return data;
}

// Conflict-aware helper (mirrors schedules API shape)
export async function respondRoutineSafe(id, action) {
  try {
    const { data } = await API.put(`/routines/${id}/respond`, { action });
    return { ok: true, data, conflict: false };
  } catch (err) {
    if (err?.response?.status === 409) {
      return { ok: false, data: err.response.data, conflict: true };
    }
    throw err;
  }
}

// Legacy helpers to keep older imports working
export async function acceptRoutine(id) {
  return respondRoutine(id, 'accept');
}

export async function rejectRoutine(id) {
  return respondRoutine(id, 'reject');
}
