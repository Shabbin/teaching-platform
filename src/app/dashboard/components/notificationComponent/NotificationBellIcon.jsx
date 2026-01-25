// src/app/dashboard/components/notificationComponent/NotificationBellIcon.jsx
'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  fetchNotifications,
  markNotificationsRead,
  markNotificationsReadOptimistic,
  addNotification,
  revertNotificationsRead,
} from '../../../redux/notificationSlice';

/* ---------------- date utils (robust parsing) ---------------- */
function parseAnyDate(raw) {
  if (!raw) return null;

  // Date object
  if (raw instanceof Date) return isNaN(raw) ? null : raw;

  // Number (epoch ms or seconds)
  if (typeof raw === 'number') {
    // Heuristic: seconds vs ms
    const ms = raw < 10_000_000_000 ? raw * 1000 : raw;
    const d = new Date(ms);
    return isNaN(d) ? null : d;
  }

  // String
  if (typeof raw === 'string') {
    // Try native first (ISO handles fine)
    let d = new Date(raw);
    if (!isNaN(d)) return d;

    // Common non-ISO formats like "YYYY-MM-DD HH:mm" (space instead of 'T')
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(raw)) {
      d = new Date(raw.replace(' ', 'T'));
      if (!isNaN(d)) return d;
      // try as UTC
      d = new Date(raw.replace(' ', 'T') + 'Z');
      if (!isNaN(d)) return d;
    }

    // Date-only "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      d = new Date(raw + 'T00:00:00');
      if (!isNaN(d)) return d;
    }
  }

  return null;
}

function pickWhen(n) {
  // Accept a bunch of potential fields from various backends
  return (
    n?.createdAt ??
    n?.created_at ??
    n?.date ??
    n?.timestamp ??
    n?.time ??
    n?.ts ??
    null
  );
}

function formatWhen(n) {
  const d = parseAnyDate(pickWhen(n));
  if (!d) return ''; // fallback to empty instead of "Invalid Date"
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* ---------------- normalize incoming notifications ---------------- */
function normalizeNotification(raw) {
  const id =
    raw?._id ||
    raw?.id ||
    raw?.notificationId ||
    `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const when = parseAnyDate(pickWhen(raw)) || new Date();

  return {
    // keep everything, but fix a few fields
    ...raw,
    _id: id,
    read: raw?.read ?? false,
    createdAt: when.toISOString(),
    senderName: raw?.senderName || raw?.data?.senderName || 'Someone',
    profileImage: raw?.profileImage || raw?.data?.profileImage || '/default-avatar.png',
    message: raw?.message || raw?.text || raw?.title || 'Notification',
  };
}

export default function NotificationBell() {
  const dispatch = useDispatch();
  const notifications = useSelector((s) => s.notifications.notifications || []);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Memoize unread notifications
  const unreadIds = useMemo(
    () => notifications.filter((n) => !n.read).map((n) => n._id || n.id),
    [notifications]
  );
  const unreadCount = unreadIds.length;

  // Fetch notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Stable handler for the socket listener
  const handleNewNotification = useCallback(
    (notif) => {
      dispatch(addNotification(normalizeNotification(notif)));
    },
    [dispatch]
  );

  // Socket listener for real-time notifications (guarded + captured socket ref)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = window.socket; // capture current socket

    if (s?.on) {
      s.on('new_notification', handleNewNotification);
    }

    return () => {
      if (s?.off) {
        s.off('new_notification', handleNewNotification);
      }
    };
  }, [handleNewNotification]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Optimistic read with rollback
  const markAsReadOptimistic = (ids) => {
    if (!ids.length) return;
    dispatch(markNotificationsReadOptimistic(ids));
    dispatch(markNotificationsRead(ids))
      .unwrap()
      .catch(() => {
        dispatch(revertNotificationsRead(ids));
        console.error('Failed to update notifications on server, rollback applied');
      });
  };

  // Mark as read when dropdown opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      markAsReadOptimistic(unreadIds);
    }
  }, [open, unreadCount, unreadIds]);

  const handleClearAll = () => {
    markAsReadOptimistic(unreadIds);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle notifications"
        className="
          relative h-10 w-10 flex items-center justify-center
          rounded-full text-gray-600 hover:text-indigo-600
          focus:outline-none transition-colors duration-200
          hover:bg-indigo-100
        "
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span
            className="
              absolute top-1 right-0.5 inline-flex items-center justify-center
              px-2 py-1 text-[11px] font-bold leading-none
              text-white bg-red-600 rounded-full shadow-sm
              transform translate-x-1/4 -translate-y-[1px]
            "
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* desktop dropdown remains unchanged */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="
                hidden md:block
                absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto
                bg-white border border-gray-200 rounded-xl shadow-lg z-50
              "
            >
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700">
                Notifications
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No notifications</div>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li
                      key={n._id || n.id}
                      className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                        !n.read ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={n.profileImage || '/default-avatar.png'}
                          alt={n.senderName || 'User'}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap break-words leading-5">
                            {n.senderName ? `${n.senderName} ${n.message}` : n.message}
                          </p>
                          <span className="text-xs text-gray-500">{formatWhen(n)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="text-center p-2">
                <button onClick={handleClearAll} className="text-indigo-600 hover:underline text-sm">
                  Clear All
                </button>
              </div>
            </motion.div>

            {/* mobile full-screen modal */}
            <motion.div
              className="md:hidden fixed inset-0 z-40 flex flex-col bg-white overflow-y-auto"
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 font-semibold text-gray-700">
                Notifications
                <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-gray-500 hover:text-indigo-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No notifications</div>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li
                      key={n._id || n.id}
                      className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                        !n.read ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={n.profileImage || '/default-avatar.png'}
                          alt={n.senderName || 'User'}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap break-words leading-5">
                            {n.senderName ? `${n.senderName} ${n.message}` : n.message}
                          </p>
                          <span className="text-xs text-gray-500">{formatWhen(n)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="text-center p-2">
                <button onClick={handleClearAll} className="text-indigo-600 hover:underline text-sm">
                  Clear All
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
