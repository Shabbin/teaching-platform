'use client';
export const dynamic = 'force-dynamic';

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
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import MessengerPopup from './components/chat-components/MessengerPopup';
import NotificationBellIcon from './components/notificationComponent/NotificationBellIcon';
import API from '../../api/axios';
import DashboardProviders from './DashboardProviders';

export default function DashboardLayout({ children }) {
  return (
    <DashboardProviders>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProviders>
  );
}

function DashboardLayoutInner({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const messengerPopupRef = useRef(null);

  const userInfo = useSelector((state) => state.user.userInfo);
  const profileImage = userInfo?.profileImage;
  const role = userInfo?.role;

  const [navOpen, setNavOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signupDropdownOpen, setSignupDropdownOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [activePath, setActivePath] = useState('');

  // Scroll listener removed for better mobile performance (using CSS-only approach)

  // Update nav items based on role
  useEffect(() => {
    if (role === 'teacher') {
      setNavItems([
        { label: 'Post Content', href: '/dashboard/teacher/post-content', icon: '✍️' },
        { label: 'Requests', href: '/dashboard/teacher/requests', icon: '📋' },
        { label: 'Schedule', href: '/dashboard/teacher/schedule', icon: '📅' },
        { label: 'Students', href: '/dashboard/teacher/students', icon: '👥' },
        { label: 'Media Tuitions', href: '/dashboard/teacher/media-tuitions', icon: '🎥' },
        { label: 'Profile', href: '/dashboard/teacher/profile', icon: '👤' },
      ]);
    } else if (role === 'student') {
      setNavItems([
        { label: 'Find Teachers', href: '/dashboard/student/teachers', icon: '🔍' },
        { label: 'My Schedule', href: '/dashboard/student/schedule', icon: '📅' },
        { label: 'My Bookings', href: '/dashboard/student/bookings', icon: '📚' },
        { label: 'Profile', href: '/dashboard/student/profile', icon: '👤' },
      ]);
    } else {
      setNavItems([]);
    }
  }, [role]);

  // Set active path
  useEffect(() => {
    setActivePath(router.pathname);
  }, [router.pathname]);

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout', {}, { withCredentials: true });
      dispatch(logout());
      router.replace('/');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  // Close dropdowns if click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSignupDropdownOpen(false);
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
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/${profileImage}`
        : '/default-avatar.png';

  const logoLink = userInfo
    ? role === 'teacher'
      ? '/dashboard/teacher'
      : '/dashboard/student'
    : '/';

  return (
    <div className="w-screen h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background Gradient - Hidden on mobile for performance */}
      <div className="hidden md:block fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      {/* Static Background for Mobile */}
      <div className="md:hidden fixed inset-0 bg-indigo-50 -z-10"></div>

      {/* Header Container */}
      <header
        className={`
          flex items-center justify-between z-40 h-20 relative flex-shrink-0 overflow-visible
          transition-all duration-500 ease-out
        `}
      >
        {/* Glass Background - CSS Only for better performance */}
        <div
          className={`
            absolute inset-0 -z-10 transition-all duration-300
            bg-white/70 backdrop-blur-md md:backdrop-blur-xl shadow-sm border-b border-gray-100/50
          `}
        />

        {/* Left: Logo with glow and overflow behavior matching page.tsx */}
        <div className="px-6 flex items-center justify-between w-full h-full relative overflow-visible">
          <Link href={logoLink} className="flex items-center relative z-50 group overflow-visible">
            <div className="relative flex items-center justify-center overflow-visible">
              {/* Glow behind logo */}
              <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity rounded-full" />
              {/* Actual logo */}
              <img
                src="/logo.png"
                alt="Logo"
                className="h-20 md:h-44 w-auto relative z-10 cursor-pointer object-contain"
              />
            </div>
          </Link>

          {/* Center: Desktop Navbar with floating effect */}
          {userInfo && (
            <nav className="hidden md:flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full px-4 py-2 shadow-sm border border-white/50">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setActivePath(item.href)}
                  className={`
                  relative px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300
                  ${isActiveTab(item.href)
                      ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-300/50'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-white/80'
                    }
                `}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>

                  {isActiveTab(item.href) && (
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 blur-lg opacity-30 -z-10 animate-pulse"></span>
                  )}
                </Link>
              ))}
            </nav>
          )}

          {/* Right section */}
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            {userInfo ? (
              <>
                {/* Messenger & Notification with modern styling */}
                <div className="flex items-center gap-2">
                  <MessengerPopup ref={messengerPopupRef} user={userInfo} role={userInfo?.role} />
                  <div onClick={() => {
                    setDropdownOpen(false);
                    messengerPopupRef.current?.close();
                  }}>
                    <NotificationBellIcon />
                  </div>
                </div>

                {/* Profile with premium styling */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      if (!dropdownOpen) {
                        messengerPopupRef.current?.close();
                      }
                    }}
                    className="relative group"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
                    <img
                      src={profileSrc}
                      alt="Profile"
                      className="relative w-11 h-11 rounded-full object-cover border-2 border-white shadow-lg cursor-pointer ring-2 ring-transparent group-hover:ring-indigo-400 transition-all duration-300 transform group-hover:scale-105 flex-shrink-0 aspect-square"
                    />
                    <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full transition-transform ${dropdownOpen ? 'scale-0' : 'scale-100'}`}></div>
                  </button>

                  {/* Premium Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-16 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-indigo-200/30 z-50 overflow-hidden animate-dropdown">
                      {/* Profile Header in Dropdown */}
                      <div className="p-5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                        <div className="flex items-center gap-3">
                          <img
                            src={profileSrc}
                            alt="Profile"
                            className="w-14 h-14 rounded-full object-cover border-3 border-white/30 shadow-lg"
                          />
                          <div>
                            <h3 className="font-bold text-lg">{userInfo?.name || 'User'}</h3>
                            <p className="text-xs text-white/80 capitalize">{role} Account</p>
                          </div>
                        </div>
                      </div>

                      <ul className="flex flex-col text-sm text-gray-700">
                        {role === 'teacher' && (
                          <li>
                            <Link
                              href="/dashboard/teacher/post-content/view-content"
                              className="group flex items-center gap-3 px-5 py-3.5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all border-b border-gray-100"
                              onClick={() => setDropdownOpen(false)}
                            >
                              <span className="text-lg">✍️</span>
                              <span className="font-medium text-gray-800 group-hover:text-gray-900">Manage Content</span>
                            </Link>
                          </li>
                        )}
                        <li>
                          <Link
                            href={`/dashboard/${role}/profile`}
                            className="group flex items-center gap-3 px-5 py-3.5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all border-b border-gray-100"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <User className="w-5 h-5 text-gray-700 group-hover:text-indigo-600 transition-colors" />
                            <span className="font-medium text-gray-800 group-hover:text-gray-900">View Profile</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href={`/dashboard/${role}/settings`}
                            className="group flex items-center gap-3 px-5 py-3.5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all border-b border-gray-100"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Settings className="w-5 h-5 text-gray-700 group-hover:text-indigo-600 transition-colors" />
                            <span className="font-medium text-gray-800 group-hover:text-gray-900">Settings & Privacy</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/help"
                            className="group flex items-center gap-3 px-5 py-3.5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all border-b border-gray-100"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <HelpCircle className="w-5 h-5 text-gray-700 group-hover:text-indigo-600 transition-colors" />
                            <span className="font-medium text-gray-800 group-hover:text-gray-900">Help & Support</span>
                          </Link>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleLogout();
                            }}
                            className="group w-full text-left flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 transition-all"
                          >
                            <LogOut className="w-5 h-5 text-gray-700 group-hover:text-red-600 transition-colors" />
                            <span className="font-medium text-gray-800 group-hover:text-red-600">Logout</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Guest CTA Buttons */}
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:shadow-lg hover:shadow-indigo-300/50 transition-all transform hover:-translate-y-0.5 hover:scale-105"
                >
                  Sign In
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setSignupDropdownOpen(!signupDropdownOpen)}
                    className="px-5 py-2.5 text-sm font-bold text-indigo-600 border-2 border-indigo-600 rounded-full flex items-center gap-2 hover:bg-indigo-50 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Sign Up</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${signupDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {signupDropdownOpen && (
                    <div className="absolute right-0 top-14 w-48 bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl z-50 overflow-hidden animate-dropdown">
                      <ul className="flex flex-col text-sm">
                        <li>
                          <Link
                            href="/register/student"
                            className="block px-5 py-3 hover:bg-indigo-50 transition font-medium text-gray-700 border-b border-gray-100"
                            onClick={() => setSignupDropdownOpen(false)}
                          >
                            📚 As Student
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/register/teacher"
                            className="block px-5 py-3 hover:bg-indigo-50 transition font-medium text-gray-700"
                            onClick={() => setSignupDropdownOpen(false)}
                          >
                            👨‍🏫 As Teacher
                          </Link>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile menu toggle */}
            {userInfo && (
              <button
                className="md:hidden text-gray-700 ml-2 p-2 hover:bg-indigo-50 rounded-full transition"
                onClick={() => setNavOpen(!navOpen)}
              >
                {navOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Menu */}
      {userInfo && (
        <div
          className={`
            md:hidden fixed inset-y-0 left-0 w-72 bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-out
            ${navOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Mobile Menu Header */}
          <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Navigation</h2>
              <button onClick={() => setNavOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <img src={profileSrc} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
              <div>
                <p className="font-semibold">{userInfo?.name || 'User'}</p>
                <p className="text-xs text-white/80 capitalize">{role}</p>
              </div>
            </div>
          </div>

          {/* Mobile Menu Items */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all
                  ${isActiveTab(item.href)
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-300/50'
                    : 'text-gray-700 hover:bg-indigo-50'
                  }
                `}
                onClick={() => {
                  setActivePath(item.href);
                  setNavOpen(false);
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Mobile Overlay */}
      {navOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fadeIn"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* Main Content scroller - Optimized for "App-like" performance */}
      <main
        className="flex-1 overflow-y-auto relative z-10 overscroll-contain touch-pan-y"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          willChange: 'transform'
        }}
      >
        {children}
      </main>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes dropdown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-dropdown {
          animation: dropdown 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Custom scrollbar for the entire app */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #818cf8, #a78bfa);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
        }
      `}</style>
    </div>
  );
}
