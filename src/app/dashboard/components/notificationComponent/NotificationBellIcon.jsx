'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  fetchNotifications,
  markNotificationsRead,
  markNotificationsReadOptimistic,
  addNotification,
  revertNotificationsRead,
} from '../../../redux/notificationSlice';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.notifications || []);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Memoize unread notifications for performance
  const unreadIds = useMemo(
    () => notifications.filter((n) => !n.read).map((n) => n._id || n.id),
    [notifications]
  );
  const unreadCount = unreadIds.length;

  // Fetch notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Socket listener for real-time notifications
  useEffect(() => {
    if (!window.socket) return;

    const handleNewNotification = (notif) => {
      const formattedNotif = {
        ...notif,
        senderName: notif.senderName || notif.data?.senderName || 'Someone',
        profileImage: notif.profileImage || notif.data?.profileImage || 'default-avatar.png', // ✅ replaced default-avatar
      };
      dispatch(addNotification(formattedNotif));
    };

    window.socket.on('new_notification', handleNewNotification);
    return () => {
      window.socket.off('new_notification', handleNewNotification);
    };
  }, [dispatch]);

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

  // Centralized optimistic update with rollback
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

  // Mark notifications read when dropdown opens
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
          <span className="
              absolute top-1 right-0.5 inline-flex items-center justify-center
              px-2 py-1 text-[11px] font-bold leading-none
              text-white bg-red-600 rounded-full shadow-sm
              transform translate-x-1/4 -translate-y-[1px]
            ">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="
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
                        src={n.profileImage || 'default-avatar.png'} // ✅ replaced default-avatar
                        alt={n.senderName || 'User'}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {n.senderName ? `${n.senderName} ${n.message}` : n.message}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(n.date || n.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="text-center p-2">
              <button
                onClick={handleClearAll}
                className="text-indigo-600 hover:underline text-sm"
              >
                Clear All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
