'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, MessageCircle, LogOut, Settings, User } from 'lucide-react';

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
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/auth/teacher/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfileImage(data?.teacher?.profileImage || '/default-profile.png');
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

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
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-indigo-600">Teacher Panel</div>

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

        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          {/* Bell Icon */}
          <button className="text-gray-600 hover:text-indigo-600">
            <Bell className="w-5 h-5" />
          </button>

          {/* Messenger Icon */}
          <button className="text-gray-600 hover:text-indigo-600">
            <MessageCircle className="w-5 h-5" />
          </button>

          {/* Profile Image Dropdown Trigger */}
          <div className="relative">
            <img
              src={profileImage || '/default-profile.png'}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            />

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                <ul className="flex flex-col text-sm text-gray-700">
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
                      ❓ Help
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
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
