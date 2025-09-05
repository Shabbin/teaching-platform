// src/api/changeRequests.js
import API from './axios';

// Toggle this when your /change-requests backend routes are live.
const ENABLE_CHANGE_REQUESTS = false;

// body: { targetType:'schedule'|'routine', targetId, slotIndex?, studentIds:[], proposedDate, durationMinutes?, note? }
export async function createChangeRequest(body) {
  if (!ENABLE_CHANGE_REQUESTS) throw new Error('change-requests API disabled (backend not enabled)');
  const { data } = await API.post('/change-requests', body);
  return data;
}

// body: { action: 'accept' | 'reject' }
export async function respondChangeRequest(id, action) {
  if (!ENABLE_CHANGE_REQUESTS) throw new Error('change-requests API disabled (backend not enabled)');
  const { data } = await API.post(`/change-requests/${id}/respond`, { action });
  return data;
}

export async function cancelChangeRequest(id) {
  if (!ENABLE_CHANGE_REQUESTS) throw new Error('change-requests API disabled (backend not enabled)');
  const { data } = await API.post(`/change-requests/${id}/cancel`);
  return data;
}

export async function listTeacherChangeRequests() {
  if (!ENABLE_CHANGE_REQUESTS) return [];
  const { data } = await API.get('/change-requests/teacher');
  return data || [];
}

export async function listStudentChangeRequests() {
  if (!ENABLE_CHANGE_REQUESTS) return [];
  const { data } = await API.get('/change-requests/student');
  return data || [];
}
