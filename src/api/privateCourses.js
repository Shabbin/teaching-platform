// src/api/privateCourses.js
import API from './axios';

// ---- robust error logging helpers ----
function _safeParse(v) {
  if (v == null) return null;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
}

// Convert unknown/axios error into a JSON-friendly object for console logging.
function _toPlainError(err) {
  if (!err || typeof err !== 'object') return { kind: typeof err, value: err };
  const out = {
    name: err.name,
    message: err.message,
    code: err.code,
    isAxiosError: !!err.isAxiosError,
  };
  // Axios parts (non-enumerable on some builds)
  const cfg = err.config || {};
  const res = err.response || {};
  out.config = {
    method: cfg.method,
    baseURL: cfg.baseURL,
    url: cfg.url,
    headers: cfg.headers,
    data: _safeParse(cfg.data),
  };
  out.response = {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    data: res.data,
  };
  out.stack = err.stack;
  return out;
}

function _logAxiosError(prefix, err, msg) {
  const p = _toPlainError(err);
  const method = (p.config?.method || 'POST').toUpperCase();
  const baseURL = p.config?.baseURL || '';
  const urlPath = p.config?.url || '';
  const status = p.response?.status;
  const code = p.code;
  const url = `${baseURL || ''}${urlPath || ''}`;
  const title = `${prefix} ${method} ${url} → ${status ?? code ?? 'ERR'} — ${msg}`;

  // collapsed for tidiness
  console.groupCollapsed(`%c${title}`, 'color:#b91c1c;font-weight:600');
  console.log('Message:', msg);
  console.log('isAxiosError:', p.isAxiosError, 'code:', code);
  console.log('Request:', p.config);
  console.log('Response:', p.response);
  if (p.stack) console.log('Stack:', p.stack);
  console.groupEnd();
}

export async function createPrivateCourse(payload) {
  try {
    const res = await API.post('/private-courses', payload);
    return res.data;
  } catch (err) {
    const data = err?.response?.data;
    let msg =
      err?.normalizedMessage ||
      data?.message ||
      data?.error ||
      err?.message ||
      'Request failed';

    // Our controller returns { error:'validation', details:{...}, step?:'insertMany' }
    if (data?.error === 'validation' && data?.details) {
      const parts = Object.values(data.details)
        .map((d) => d?.message || d?.properties?.message)
        .filter(Boolean);
      if (parts.length) msg = parts.join(' • ');
      if (data?.step) msg = `[${data.step}] ${msg}`;
    }

    // bubble a friendly message to UIs
    err.normalizedMessage = msg;

    // 🔥 always give a readable console dump
    _logAxiosError('[private-courses]', err, msg);
    throw err;
  }
}

// Teacher lists private courses they created
export async function listTeacherPrivateCourses() {
  const { data } = await API.get('/private-courses/teacher');
  return data;
}

// Student lists invites sent to them
export async function listStudentPrivateCourseInvites() {
  const { data } = await API.get('/private-courses/student');
  return data;
}

// Teacher can invite more students later
export async function inviteStudentsToPrivateCourse(courseId, studentIds) {
  const { data } = await API.post(`/private-courses/${courseId}/invite`, { studentIds });
  return data;
}

// Student responds to an invite: 'accept' | 'decline'
export async function respondPrivateCourseInvite(courseId, action) {
  const { data } = await API.post(`/private-courses/${courseId}/respond`, { action });
  return data;
}
