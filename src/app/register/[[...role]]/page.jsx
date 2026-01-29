"use client"

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../redux/userSlice';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, BookOpen, GraduationCap,
  ArrowRight, Camera, Loader2, CheckCircle2,
  AlertCircle, ChevronRight, Clock
} from 'lucide-react';

const InputField = ({ label, icon: Icon, error, ...props }) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
        <Icon size={18} />
      </div>
      <input
        {...props}
        className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 text-sm font-bold placeholder:text-slate-300 outline-none transition-all shadow-inner"
      />
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-1 ml-1"
      >
        {error}
      </motion.p>
    )}
  </div>
);

export default function RegisterPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();

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

  // No auto-redirect for existing sessions to prevent fatal takeover on back-navigation.
  // We will handle redirect ONLY after explicit registration success in handleSubmit.

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

    if (result.meta.requestStatus === 'fulfilled') {
      const user = result.payload;
      if (user?.role === 'teacher') router.push('/dashboard/teacher');
      else if (user?.role === 'student') router.push('/dashboard/student');
      else router.push('/');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };


  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-6 md:p-12">
      {/* Legendary Background (Light Edition) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-500/5 blur-[180px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/5 blur-[150px] rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-multiply"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white/70 backdrop-blur-3xl border border-white rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-200/50 relative z-10"
      >
        {/* Left Side: Branding & Role Selection */}
        <div className="p-8 md:p-12 lg:border-r border-slate-100 bg-gradient-to-br from-indigo-50/50 to-transparent flex flex-col items-start min-h-0">
          <div className="relative -mt-8 mb-2">
            <Link href="/" className="inline-block group">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-48 md:h-56 w-auto -ml-8 transform group-hover:scale-105 transition-all duration-500"
              />
            </Link>
          </div>
          <div className="relative z-10 w-full">
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tighter"
            >
              Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Journey</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-slate-500 font-medium">
              Join thousands of learners and educators in the most advanced tuition platform.
            </motion.p>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Choose Your Path</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                disabled={!!lockedRole}
                onClick={() => {
                  setForm({
                    name: '',
                    email: '',
                    password: '',
                    role: 'student',
                    age: '',
                    profileImage: null,
                  });
                  setPreview(null);
                }}
                className={`relative p-6 rounded-[2rem] border-2 transition-all duration-500 text-left group overflow-hidden ${form.role === 'student'
                  ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100'
                  : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                  }`}
              >
                <div className={`p-3 rounded-2xl mb-4 w-fit transition-colors ${form.role === 'student' ? 'bg-indigo-600 text-white' : 'bg-white/80 text-slate-400 shadow-sm'}`}>
                  <GraduationCap size={24} />
                </div>
                <h3 className={`font-black uppercase tracking-tight text-lg ${form.role === 'student' ? 'text-slate-900' : 'text-slate-400'}`}>Student</h3>
                <p className={`text-xs font-medium mt-1 ${form.role === 'student' ? 'text-indigo-600' : 'text-slate-400'}`}>I want to learn.</p>
                {form.role === 'student' && (
                  <motion.div layoutId="roleGlow" className="absolute top-2 right-2 text-indigo-600">
                    <CheckCircle2 size={18} />
                  </motion.div>
                )}
              </button>

              <button
                disabled={!!lockedRole}
                onClick={() => {
                  setForm({
                    name: '',
                    email: '',
                    password: '',
                    role: 'teacher',
                    age: '',
                    profileImage: null,
                  });
                  setPreview(null);
                }}
                className={`relative p-6 rounded-[2rem] border-2 transition-all duration-500 text-left group overflow-hidden ${form.role === 'teacher'
                  ? 'border-purple-600 bg-white shadow-xl shadow-purple-100'
                  : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                  }`}
              >
                <div className={`p-3 rounded-2xl mb-4 w-fit transition-colors ${form.role === 'teacher' ? 'bg-purple-600 text-white' : 'bg-white/80 text-slate-400 shadow-sm'}`}>
                  <BookOpen size={24} />
                </div>
                <h3 className={`font-black uppercase tracking-tight text-lg ${form.role === 'teacher' ? 'text-slate-900' : 'text-slate-400'}`}>Teacher</h3>
                <p className={`text-xs font-medium mt-1 ${form.role === 'teacher' ? 'text-purple-600' : 'text-slate-400'}`}>I want to teach.</p>
                {form.role === 'teacher' && (
                  <motion.div layoutId="roleGlow" className="absolute top-2 right-2 text-purple-600">
                    <CheckCircle2 size={18} />
                  </motion.div>
                )}
              </button>
            </div>
          </div>

          <div className="mt-12 lg:mt-24 pt-8 border-t border-slate-100 hidden lg:block">
            <Link href="/help" className="flex items-center gap-2 text-slate-400 group cursor-pointer hover:text-indigo-600 transition-colors">
              <AlertCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Need help getting started?</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 relative flex flex-col justify-center bg-white/40">
          <AnimatePresence mode="wait">
            <motion.form
              key={form.role}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-sm font-bold flex items-center gap-3"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}

              <InputField
                label="Full Name"
                icon={User}
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                error={clientErrors.name}
                required
              />

              <InputField
                label="Email Address"
                icon={Mail}
                type="email"
                name="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                error={clientErrors.email}
                required
              />

              <InputField
                label="Create Password"
                icon={Lock}
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                error={clientErrors.password}
                required
              />

              {isTeacher && (
                <InputField
                  label="Age"
                  icon={Clock}
                  type="number"
                  name="age"
                  min={20}
                  placeholder="25"
                  value={form.age}
                  onChange={handleChange}
                  error={clientErrors.age}
                  required
                />
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all cursor-pointer group/photo relative overflow-hidden shadow-inner">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 group-hover/photo:bg-indigo-600 group-hover/photo:text-white transition-all overflow-hidden relative">
                    {preview ? (
                      <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">
                      {preview ? 'Photo selected' : 'Upload your photo'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">JPG, PNG, up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || hasClientErrors}
                className={`w-full group/btn relative h-16 rounded-[2rem] overflow-hidden transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl ${isTeacher ? 'shadow-purple-100' : 'shadow-indigo-100'
                  }`}
              >
                <div className={`absolute inset-0 bg-slate-900 transition-all group-hover/btn:bg-indigo-600`}></div>
                <div className="relative z-10 flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-xs">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Launching...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </motion.form>
          </AnimatePresence>

          <motion.p variants={itemVariants} className="text-center text-slate-400 text-sm font-medium mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-black hover:text-indigo-700 transition-colors uppercase tracking-widest text-xs">
              Login Here
            </Link>
          </motion.p>
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 15s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </main>
  );
}
