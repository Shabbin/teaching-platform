// src/api/routineChanges.js
import API from './axios';

// teacher → create a routine change proposal
// body = { routineId, studentIds, proposedDate, durationMinutes, slotIndex?, note? }
export async function createRoutineChange(body) {
  const { data } = await API.post('/routine-changes', body);
  return data; // the request doc
}

// teacher → list their outgoing proposals
export async function listOutgoingRoutineChanges() {
  const { data } = await API.get('/routine-changes/outgoing');
  return Array.isArray(data) ? data : [];
}

// student → list incoming proposals
export async function listIncomingRoutineChanges() {
  const { data } = await API.get('/routine-changes/incoming');
  return Array.isArray(data) ? data : [];
}

// student → respond to a proposal: action = 'accept' | 'reject'
export async function respondRoutineChange(id, action) {
  const { data } = await API.post(`/routine-changes/${id}/respond`, { action });
  return data; // { ok, status, scheduleId? }
}
