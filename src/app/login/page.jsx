'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/userSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '' });
  const { userInfo, loading, error } = useSelector((state) => state.user);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  const result = await dispatch(loginUser(form));

  // Optional: check for errors directly
  if (result.meta.requestStatus === 'rejected') {
    console.log('Login failed');
    return;
  }
};

useEffect(() => {
  console.log('User Info from Redux:', userInfo);
  if (userInfo) {
    if (userInfo.role === 'teacher') {
      router.push('/dashboard/teacher');
    } else if (userInfo.role === 'student'){
      router.push('/dashboard/student')
    }
     else {
      router.push('/');
    }
  }
}, [userInfo, router]);
 
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full border rounded-xl p-8 shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-600">Login to Your Account</h1>

        {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Don't have an account?{' '}
          <Link href="/register/student" className="text-indigo-600 font-medium hover:underline">
            Register as Student
          </Link>
        </p>
      </div>
    </main>
  );
}
