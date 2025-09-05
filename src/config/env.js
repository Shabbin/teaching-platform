// src/config/env.js
export const API_ORIGIN =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

const RAW_PREFIX = (process.env.NEXT_PUBLIC_API_PREFIX ?? '/api').trim();
const API_PREFIX = RAW_PREFIX ? (RAW_PREFIX.startsWith('/') ? RAW_PREFIX : `/${RAW_PREFIX}`) : '';

export const API_BASE = API_ORIGIN + API_PREFIX;

export const absUrl = (path = '') =>
  API_ORIGIN + '/' + String(path).replace(/^\/+/, '');

export const videoUrlFromStoredPath = (storedPath) => {
  if (!storedPath) return '';
  const file = String(storedPath).split('/').pop();
  return `${API_ORIGIN}/videos/${file}`;
};
