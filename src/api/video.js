import API from "./axios";

// Always send no-store to avoid stale caches during the join window
const noStore = { headers: { "Cache-Control": "no-store" }, withCredentials: true };

/** GET /video/schedules/:id/can-join */
export async function canJoin(scheduleId) {
  if (!scheduleId) throw new Error("Missing scheduleId");
  const url = `/video/schedules/${encodeURIComponent(scheduleId)}/can-join`;
  console.log("[video.canJoin] GET", `${API.defaults.baseURL}${url}`);
  const { data } = await API.get(url, noStore);
  return data;
}

/** POST /video/schedules/:id/token */
export async function issueJoinToken(scheduleId) {
  if (!scheduleId) throw new Error("Missing scheduleId");
  const url = `/video/schedules/${encodeURIComponent(scheduleId)}/token`;
  console.log("[video.issueJoinToken] POST", `${API.defaults.baseURL}${url}`);
  const { data } = await API.post(url, {}, { withCredentials: true });
  // 👇 Add this one-time log to confirm shapes from backend
  console.log("[video.issueJoinToken] response", {
    provider: data?.provider,
    roomName: data?.roomName,
    hasToken: typeof data?.token === "string",
    tokenType: typeof data?.token,
    tokenPreview: typeof data?.token === "string" ? data?.token.slice(0, 10) + "…" : data?.token,
    joinUrl: data?.joinUrl || "(none)",
  });
  return data; // { provider, roomName, token?, joinUrl?, ... }
}
