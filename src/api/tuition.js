// src/api/tuition.js
import API from "./axios";

// GET /api/tuition/status?studentId=&teacherId=&requestId=optional
export async function getTuitionStatus({ studentId, teacherId, requestId }) {
  const { data } = await API.get("/tuition/status", {
    params: { studentId, teacherId, requestId },
  });
  return data; // { ok, connected, paid, demosUsed, canSchedule, canInvite, canTopicHelpWithThisTeacher, maxDemos, requestId }
}

// POST /api/tuition/demo/use { requestId }
export async function useDemo({ requestId }) {
  const { data } = await API.post("/tuition/demo/use", { requestId });
  return data; // { ok, demosUsed, remaining }
}

// GET /api/tuition/can-topic-help?studentId=&teacherId=&requestId=
export async function canTopicHelp({ studentId, teacherId, requestId }) {
  const { data } = await API.get("/tuition/can-topic-help", {
    params: { studentId, teacherId, requestId },
  });
  return data; // { allow, reason? }
}
