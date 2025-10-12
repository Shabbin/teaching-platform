// app/register/[[...role]]/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../redux/userSlice';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();

  // Supports: /register, /register/student, /register/teacher
  const roleParam = Array.isArray(params?.role) ? params.role[0] : params?.role;
  const lockedRole =
    roleParam === 'student' || roleParam === 'teacher' ? roleParam : null;

  const { userInfo, loading, error } = useSelector((state) => state.user);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: lockedRole || 'student',
    age: '',
    profileImage: null,
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (userInfo) {
      if (userInfo.role === 'teacher') router.push('/dashboard/teacher');
      else if (userInfo.role === 'student') router.push('/dashboard/student');
      else router.push('/');
    }
  }, [userInfo, router]);

  const isTeacher = form.role === 'teacher';

  const clientErrors = useMemo(() => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/.+@.+\..+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.role) errs.role = 'Choose a role';
    if (isTeacher) {
      if (form.age === '' || form.age === null) errs.age = 'Age is required for teachers';
      const n = Number(form.age);
      if (Number.isNaN(n)) errs.age = 'Age must be a number';
      else if (n < 20) errs.age = 'Teachers must be at least 20 years old';
    }
    return errs;
  }, [form, isTeacher]);

  const hasClientErrors = Object.keys(clientErrors).length > 0;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profileImage') {
      const file = files?.[0] || null;
      setForm((f) => ({ ...f, profileImage: file }));
      if (file) {
        const url = URL.createObjectURL(file);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(url);
      } else {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
      }
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasClientErrors) return;
    const result = await dispatch(registerUser(form));
    if (result.meta.requestStatus === 'rejected') return;
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full border rounded-xl p-8 shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-600">
          {isTeacher ? 'Register as Teacher' : 'Register as Student'}
        </h1>

        {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {clientErrors.name && <p className="text-xs text-red-600 mt-1">{clientErrors.name}</p>}
          </div>

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
            {clientErrors.email && <p className="text-xs text-red-600 mt-1">{clientErrors.email}</p>}
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
            {clientErrors.password && <p className="text-xs text-red-600 mt-1">{clientErrors.password}</p>}
          </div>

          {lockedRole ? (
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <input
                value={form.role}
                readOnly
                className="w-full border px-4 py-2 rounded-md bg-gray-50"
              />
            </div>
          ) : (
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {clientErrors.role && <p className="text-xs text-red-600 mt-1">{clientErrors.role}</p>}
            </div>
          )}

          {isTeacher && (
            <div>
              <label className="block mb-1 font-medium">Age</label>
              <input
                type="number"
                name="age"
                min={0}
                value={form.age}
                onChange={handleChange}
                required
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {clientErrors.age && <p className="text-xs text-red-600 mt-1">{clientErrors.age}</p>}
            </div>
          )}

          <div>
            <label className="block mb-1 font-medium">Profile Image (optional)</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-gray-50">
                <span>Choose file</span>
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
              {preview && (
                <img
                  src={preview}
                  alt="preview"
                  className="h-12 w-12 rounded-full object-cover border"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || hasClientErrors}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
