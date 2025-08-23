// src/api/axios.js
import axios from "axios";

const ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const PREFIX_RAW = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api";
const PREFIX = PREFIX_RAW ? (PREFIX_RAW.startsWith("/") ? PREFIX_RAW : `/${PREFIX_RAW}`) : "";

// If your backend already serves at http://host:port/api/*, keep PREFIX="/api".
// If your backend already *includes* /api in ORIGIN, set NEXT_PUBLIC_API_PREFIX="".
export const API_BASE = ORIGIN;
export const API_BASE_WITH_PREFIX = ORIGIN + PREFIX;

const API = axios.create({
  baseURL: API_BASE_WITH_PREFIX,
  withCredentials: true,
});

// Don’t force Content-Type; let FormData set its own boundary.
API.interceptors.request.use((config) => {
  const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    if (config.headers) delete config.headers["Content-Type"];
  } else if (config.headers && ["post", "put", "patch"].includes((config.method || "").toLowerCase())) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// Optional: normalize Axios errors a bit (nice for toasts)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    err.normalizedMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Request failed";
    return Promise.reject(err);
  }
);

// Helper to build absolute URLs for files coming from the backend
export const absUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

// If you want a helper specifically for /videos/:filename:
export const videoUrlFromStoredPath = (storedPath) => {
  // storedPath e.g. "/uploads/videos/<hash>"
  const filename = (storedPath || "").split("/").pop();
  return filename ? `${API_BASE}/videos/${filename}` : "";
};

// 👉 add this for quick sanity logging from components
export const API_BASE_URL_LOG = API.defaults.baseURL;

export default API;
