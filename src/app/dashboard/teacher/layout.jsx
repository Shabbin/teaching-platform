'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/userSlice';
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
import MessengerPopup from './components/MessengerPopup';

const navItems = [
  { label: 'Dashboard Home', href: '/dashboard/teacher' },
  { label: 'Post Content', href: '/dashboard/teacher/post-content' },
  { label: 'Requests', href: '/dashboard/teacher/requests' },
  { label: 'Schedule', href: '/dashboard/teacher/schedule' },
  { label: 'Students', href: '/dashboard/teacher/students' },
  { label: 'Media Tuitions', href: '/dashboard/teacher/media-tuitions' },
  { label: 'Profile', href: '/dashboard/teacher/profile' },
];

export default function TeacherDashboardLayout({ children }) {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const dropdownRef = useRef(null);
const dispatch = useDispatch();
  const handleLogout = () => {
    localStorage.removeItem('user');
  localStorage.removeItem('token');
  dispatch(logout()); 
    router.push('/login');
  };

  // ✅ Token check and secure fetch
useEffect(() => {
  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5000/api/auth/teacher/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const img = data?.teacher?.profileImage;
      if (img && typeof img === 'string' && img.trim() !== '') {
        const fullPath = img.startsWith('http') ? img : `http://localhost:5000/${img}`;
        setProfileImage(fullPath);
      } else {
        setProfileImage('/default-profile.png');
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileImage('/default-profile.png');
    }
  };

  fetchProfile();
}, []);


  // 👇 Detect clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between relative">
        <div className="text-xl font-bold text-indigo-600">Teacher Panel</div>

        {/* Mobile Nav Toggle */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setNavOpen(!navOpen)}
        >
          {navOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-700 hover:text-indigo-600 font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Icons */}
        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          <button className="text-gray-600 hover:text-indigo-600">
            <Bell className="w-5 h-5" />
          </button>

          <MessengerPopup />
          <img
            src={profileImage || '/default-profile.png'}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />

          {/* Animated Dropdown */}
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
                  <li>
                    <Link
                      href="/dashboard/teacher/profile"
                      className="flex items-center px-4 py-3 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-2" /> View Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/teacher/settings"
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

      {/* Mobile Navigation */}
      {navOpen && (
        <div className="md:hidden px-6 py-2 bg-white shadow space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-gray-700 hover:text-indigo-600 font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
