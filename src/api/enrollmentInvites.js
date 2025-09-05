// src/api/enrollmentInvites.js
import API from './axios';

/**
 * Teacher creates an invite for a student to join a course (BDT flow).
 * payload:
 * {
 *   routineId: string,
 *   studentId: string,
 *   courseTitle: string,
 *   courseFeeTk: number,      // required (integer)
 *   advanceTk?: number,       // optional (integer) — if omitted, 15% of courseFeeTk is due upfront
 *   note?: string,
 *   expiresAt?: string|Date
 * }
 */
export async function createEnrollmentInvite(payload) {
  const { data } = await API.post('/enrollment-invites', payload);
  return data;
}

/** Student lists invites sent to them (pending + completed) */
export async function listIncomingEnrollmentInvites() {
  const { data } = await API.get('/enrollment-invites/incoming');
  return data;
}

/** Teacher lists invites they sent */
export async function listOutgoingEnrollmentInvites() {
  const { data } = await API.get('/enrollment-invites/outgoing');
  return data;
}

/**
 * Student starts payment for an invite.
 * Backend returns { ok, url, paymentId }. Redirect the user to `url`.
 */
export async function initiateInvitePayment(inviteId) {
  const { data } = await API.post(`/enrollment-invites/${inviteId}/initiate`);
  return data;
}

/**
 * Test/simulation (admin|teacher only): mark an invite as paid by amount in BDT.
 * In production, your payment webhook should call this.
 */
export async function markInvitePaid(inviteId, amountTk) {
  const { data } = await API.post(`/enrollment-invites/${inviteId}/mark-paid`, { amountTk });
  return data;
}

/** Teacher cancels an invite they created */
export async function cancelEnrollmentInvite(inviteId) {
  const { data } = await API.post(`/enrollment-invites/${inviteId}/cancel`);
  return data;
}

/** Student declines an invite */
export async function declineEnrollmentInvite(inviteId) {
  const { data } = await API.post(`/enrollment-invites/${inviteId}/decline`);
  return data;
}

/* ---- Deprecated (old flow) ----------------------------------------------
 * The old USD / half/full selector no longer exists on the backend.
 * Keep this export only to surface a clear runtime error if something still imports it.
 */
export function chooseInvitePayment() {
  throw new Error('chooseInvitePayment() was removed in the BDT invite flow. Use initiateInvitePayment(inviteId) instead.');
}
