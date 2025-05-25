'use client';

import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logout } from './../../../redux/userSlice';

const Topbar = ({ title = 'Dashboard' }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    router.push('/');
  };

  return (
    <div className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-indigo-700">{title}</h1>
      <div className="flex items-center space-x-4">
        {/* Optional avatar */}
        {/* <img src="/path/to/avatar.png" alt="Avatar" className="w-8 h-8 rounded-full" /> */}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-semibold"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;
