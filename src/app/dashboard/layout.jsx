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
import MessengerPopup from './components/chat-components/MessengerPopup';
import NotificationBellIcon from './components/notificationComponent/NotificationBellIcon';
import API from '../api/axios'; // ✅ use env-driven axios instance

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

  // Set active path (kept as-is with your router usage)
  useEffect(() => {
    setActivePath(router.pathname);
  }, [router.pathname]);

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout', {}, { withCredentials: true }); // ✅ no hardcoded URL
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

  const isActiveTab = (href) => {
    if (!href.includes('/dashboard')) return false;
    return router.pathname === href;
  };

  const profileSrc =
    profileImage?.startsWith('http')
      ? profileImage
      : profileImage
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/${profileImage}` // ✅ env-based host
      : '/default-avatar.png';

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50 ">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <Link href={`/dashboard/${role}`}>
          <img
            src="/logo.png"
            alt="Logo"
            className="h-12 w-auto object-contain cursor-pointer hover:opacity-90 transition"
          />
        </Link>

        {/* Mobile menu toggle */}
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
                className={`font-medium py-2 transition-colors ${
                  isActiveTab(item.href)
                    ? 'text-[oklch(0.62_0.2_310.02)]'
                    : 'text-gray-600 hover:text-[oklch(0.62_0.2_310.02)]'
                }`}
                onClick={() => setActivePath(item.href)}
              >
                {item.label}
              </Link>
              {isActiveTab(item.href) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[oklch(0.62_0.2_310.02)] rounded-full"></span>
              )}
            </div>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          <MessengerPopup user={userInfo} role={userInfo?.role} />
          <NotificationBellIcon />

          {/* Profile + Dropdown */}
          <div className="relative">
            <img
              src={profileSrc}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm cursor-pointer ring-2 ring-transparent hover:ring-[oklch(0.62_0.2_310.02)] transition"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            />

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-14 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                <ul className="flex flex-col text-sm text-gray-800 divide-y divide-gray-100">
                  {role === 'teacher' && (
                    <li>
                      <Link
                        href="/dashboard/teacher/post-content/view-content"
                        className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        ✍️ Manage Content
                      </Link>
                    </li>
                  )}

                  <li>
                    <Link
                      href={`/dashboard/${role}/profile`}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" /> View Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/dashboard/${role}/settings`}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" /> Settings & Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/help"
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <HelpCircle className="w-4 h-4 mr-2" /> Help
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center px-4 py-3 hover:bg-gray-50 transition text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navbar */}
      {navOpen && (
        <div className="md:hidden px-6 py-4 bg-white border-b border-gray-100 shadow-sm space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block font-medium py-2 px-2 rounded-lg transition ${
                isActiveTab(item.href)
                  ? 'text-[oklch(0.62_0.2_310.02)] bg-[oklch(0.62_0.2_310.02)/10]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActivePath(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
// import AXIOS from '../api/axios' is the right import
