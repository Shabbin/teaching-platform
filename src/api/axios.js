import axios from "axios";
import { API_BASE } from "../config/env";   // 👈 use the shared env module

// Axios instance
const API = axios.create({
  baseURL: API_BASE,   // 👈 always correct (no localhost in prod)
  withCredentials: true,
});

// Don’t force Content-Type; let FormData set its own boundary.
API.interceptors.request.use((config) => {
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    if (config.headers) delete config.headers["Content-Type"];
  } else if (
    config.headers &&
    ["post", "put", "patch"].includes((config.method || "").toLowerCase())
  ) {
    config.headers["Content-Type"] = "application/json";
  }

  // 🔥 NEW: dev auth shim support
  // If localStorage has devUserId, send it so backend shim picks it up
  if (typeof window !== "undefined") {
    const devUserId = localStorage.getItem("devUserId");
    if (devUserId) {
      config.headers["X-Dev-User-Id"] = devUserId;
    }
  }

  return config;
});

// Optional: normalize Axios errors (nice for toast notifications, etc.)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    err.normalizedMessage =
      err?.response?.data?.message || err?.message || "Request failed";
    return Promise.reject(err);
  }
);

// Helpers

// Build absolute URLs for backend-served files
export const absUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

// Helper for /videos/:filename
export const videoUrlFromStoredPath = (storedPath) => {
  const filename = (storedPath || "").split("/").pop();
  return filename ? `${API_BASE}/videos/${filename}` : "";
};

// For sanity logging
export const API_BASE_URL_LOG = API.defaults.baseURL;

export default API;
