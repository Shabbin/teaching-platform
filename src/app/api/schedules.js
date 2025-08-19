// src/api/schedules.js
import API from "./axios";

// ✅ Get all schedules for the logged-in teacher
export async function getTeacherSchedules() {
  const { data } = await API.get("/schedules/teacher");
  return data;
}

// ✅ Create a new schedule
export async function createSchedule(payload) {
  const { data } = await API.post("/schedules", payload);
  return data;
}

// ✅ Cancel a schedule
export async function cancelSchedule(id) {
  const { data } = await API.put(`/schedules/${id}/cancel`);
  return data;
}

// ✅ Get approved students for a given post (teacher-only)
export async function getApprovedStudentsForPost(postId) {
  if (!postId) return [];
  const { data } = await API.get(
    `/teacher-requests/approved?postId=${encodeURIComponent(postId)}`
  ); // <-- dashed path
  return data;
}

// keep the alias if you’re using it elsewhere
export const getApprovedStudents = getApprovedStudentsForPost;