'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/userSlice';
import {
  Bell,
  MessageCircle,
  LogOut,
  Settings,
  User,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessengerPopup from './components/chat-components/MessengerPopup';
import NotificationBellIcon from './components/notificationComponent/NotificationBellIcon';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  const userInfo = useSelector((state) => state.user.userInfo);
  const profileImage = userInfo?.profileImage;
  const role = userInfo?.role;

  const [navOpen, setNavOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [activePath, setActivePath] = useState('');

  // Update nav items based on role
  useEffect(() => {
    if (role === 'teacher') {
      setNavItems([
        { label: 'Dashboard Home', href: '/dashboard/teacher' },
        { label: 'Post Content', href: '/dashboard/teacher/post-content' },
        { label: 'Requests', href: '/dashboard/teacher/requests' },
        { label: 'Schedule', href: '/dashboard/teacher/schedule' },
        { label: 'Students', href: '/dashboard/teacher/students' },
        { label: 'Media Tuitions', href: '/dashboard/teacher/media-tuitions' },
        { label: 'Profile', href: '/dashboard/teacher/profile' },
      ]);
    } else if (role === 'student') {
      setNavItems([
        { label: 'Dashboard Home', href: '/dashboard/student' },
        { label: 'Find Teachers', href: '/dashboard/student/teachers' },
        { label: 'My Schedule', href: '/dashboard/student/schedule' },
        { label: 'My Bookings', href: '/dashboard/student/bookings' },
        { label: 'Profile', href: '/dashboard/student/profile' },
      ]);
    }
  }, [role]);

  // Set active path on mount and router change
  useEffect(() => {
    setActivePath(router.pathname);
  }, [router.pathname]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      dispatch(logout());
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine if a nav tab should be highlighted
  const isActiveTab = (href) => {
    // Only highlight dashboard pages
    if (!href.includes('/dashboard')) return false;
    return router.pathname === href;
  };

  return (
    <div className="w-screen h-screen flex flex-col">
      <header className="bg-white  px-6 py-4 flex items-center justify-between relative">
    <Link href={`/dashboard/${role}`}>
  <img
    src="/logo.png"
    alt="Logo"
    className="h-16 max-h-full w-auto object-contain cursor-pointer"
  />
</Link>

        <button
          className="md:hidden text-gray-700"
          onClick={() => setNavOpen(!navOpen)}
        >
          {navOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop Navbar */}
        <nav className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <div
              key={item.href}
              className="relative flex flex-col items-center group"
            >
              <Link
                href={item.href}
                className={`font-medium py-2 cursor-pointer ${
                  isActiveTab(item.href)
                    ? 'text-[oklch(0.55_0.28_296.83)] '
                    : 'text-[oklch(0.55_0.28_296.83)]  group-hover:[oklch(0.55_0.28_296.83)] '
                }`}
                onClick={() => setActivePath(item.href)}
              >
                {item.label}
              </Link>

              {/* Underline for active tab */}
              {isActiveTab(item.href) && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-[oklch(0.55_0.28_296.83)]  rounded-full"></span>
              )}

              {/* Hover underline for inactive tabs */}
              {!isActiveTab(item.href) && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-[oklch(0.55_0.28_296.83)]  rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"></span>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          <MessengerPopup user={userInfo} role={userInfo?.role} />
          <NotificationBellIcon />

          <img
            src={
              profileImage?.startsWith('http')
                ? profileImage
                : profileImage
                ? `http://localhost:5000/${profileImage}`
                : '/default-avatar.png'
            }
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-14 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
              >
                <ul className="flex flex-col text-sm text-gray-800 divide-y divide-gray-100">
                  {role === 'teacher' && (
                    <li>
                      <Link
                        href="/dashboard/teacher/post-content"
                        className="flex items-center px-4 py-3 hover:bg-gray-100"
                      >
                        ✍️ Post Content
                      </Link>
                    </li>
                  )}

                  <li>
                    <Link
                      href={`/dashboard/${role}/profile`}
                      className="flex items-center px-4 py-3 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-2" /> View Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/dashboard/${role}/settings`}
                      className="flex items-center px-4 py-3 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-2" /> Settings & Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/help"
                      className="flex items-center px-4 py-3 hover:bg-gray-100"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" /> Help
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-4 py-3 hover:bg-gray-100 text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile Navbar */}
      {navOpen && (
        <div className="md:hidden px-6 py-2 bg-white shadow space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block font-medium cursor-pointer ${
                isActiveTab(item.href) ? 'text-indigo-600' : 'text-gray-700'
              }`}
              onClick={() => setActivePath(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}
