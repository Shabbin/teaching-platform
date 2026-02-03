// src/api/payments.js
import axios from "axios";
import API, { absUrl } from "./axios"; // absUrl builds ORIGIN + path (no /api)

// --- Topic Pack: ৳400 => +10 credits ---
export async function startTopicPack({ studentId, orderId, returnUrl }) {
  const url = absUrl("/pay/initiate"); // -> http://localhost:5000/pay/initiate
  const { data } = await axios.post(
    url,
    {
      type: "TOPIC_PACK_10",
      studentId,
      orderId,
      // 👇 tell backend where to send the user back after success/fail/cancel
      returnUrl,
    },
    { withCredentials: true }
  );
  return data; // { url, tran_id }
}

// --- Tuition: FIRST (half/full) or RECURRING ---
export async function startTuition({ requestId, monthlyFee, phase, fraction, monthIndex, returnUrl }) {
  const url = absUrl("/pay/tuition/initiate"); // -> http://localhost:5000/pay/tuition/initiate
  const { data } = await axios.post(
    url,
    {
      requestId,
      monthlyFee,
      phase,        // "FIRST" | "RECURRING"
      fraction,     // 0.5 or 1 (only for FIRST)
      monthIndex,   // 1 for first month, 2+ for recurring
      // 👇 bounce back to the page that initiated the payment
      returnUrl,
    },
    { withCredentials: true }
  );
  return data; // { url, tran_id }
}

// ✅ NEW — Enrollment Invite upfront payment (redirect to SSLCommerz)
export async function startInvitePayment({ inviteId, returnUrl }) {
  const url = absUrl("/pay/invite/initiate"); // -> http://localhost:5000/pay/invite/initiate
  const { data } = await axios.post(
    url,
    {
      inviteId,
      // 👇 where to return after success/fail/cancel
      returnUrl,
    },
    { withCredentials: true }
  );
  return data; // { url, tran_id }
}

// --- Credits badge (uses your /api prefix axios instance) ---
export async function getTopicCredits(studentId) {
  const { data } = await API.get(`/students/${studentId}/credits`);
  return data; // { studentId, topicCredits }
}

// --- (Optional) Deduct 1 credit when a question is solved ---
export async function settleSolve({ questionId, studentId, teacherId }) {
  const { data } = await API.post(`/settlement/questions/settle`, {
    questionId, studentId, teacherId
  });
  return data; // { ok, creditsLeft, gross, platformFee, teacherNet }
}

export async function getTeacherSummary() {
  const url = absUrl('/payments/teacher/summary'); // ✅ use the same builder as other calls
  const res = await axios.get(url, { withCredentials: true });
  return res.data; // { payments: [...], summary: {...} }
}
