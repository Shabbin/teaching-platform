// src/app/dashboard/student/schedule/invites/page.jsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays, RefreshCw, BookOpen, Settings, Mail,
  Megaphone, Clock, ShieldCheck, CreditCard, ChevronRight,
  Sparkles, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';

import useSocket from '../../../../hooks/useSocket';
import {
  listIncomingEnrollmentInvites,
  chooseInvitePayment,
  markInvitePaid,
  declineEnrollmentInvite,
  startInvitePayment
} from '../../../../../api/enrollmentInvites';
import API from '../../../../../api/axios';

/** ---------- HELPERS ---------- */
const getImageUrl = (path) => {
  if (!path) return 'https://i.pravatar.cc/150';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/${path}`;
};

const formatDhaka = (iso) => {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d)) return 'TBD';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' });
};

const dhakaDateKey = (dateLike) => {
  const d = new Date(dateLike);
  if (isNaN(d)) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};
const isSameDhakaDay = (a, b) => dhakaDateKey(a) === dhakaDateKey(b);

const money = (cents, cur = 'USD') => `${(cents / 100).toFixed(2)} ${cur}`;

/** ---------- COMPONENTS ---------- */

function StudentSidebar({ studentName, studentImage }) {
  const router = useRouter();
  const pathname = usePathname();
  const go = (path) => () => router.push(path);
  const isActive = (path) => pathname === path || (path !== '/' && pathname?.startsWith(path));

  const itemClass = (active) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 border ${active
      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200 scale-[1.02]'
      : 'text-slate-500 bg-transparent border-transparent hover:bg-white hover:border-slate-100 hover:text-slate-900'
    }`;

  const navItems = [
    { label: 'My Schedule', path: '/dashboard/student/schedule', icon: <CalendarDays size={18} /> },
    { label: 'Regular Routine', path: '/dashboard/student/schedule/routines', icon: <RefreshCw size={18} /> },
    { label: 'My Courses', path: '/dashboard/student/courses', icon: <BookOpen size={18} /> },
    { label: 'Find Teachers', path: '/dashboard/student/find-teachers', icon: <Settings size={18} /> },
    { label: 'Messages', path: '/dashboard/student/messages', icon: <Mail size={18} /> },
    { label: 'Settings', path: '/dashboard/student/settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-[280px] bg-white/40 backdrop-blur-3xl border-r border-white/50 p-6 flex flex-col flex-shrink-0 hidden md:flex relative z-20">
      <div className="text-center mb-8 relative">
        <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full scale-150"></div>
        <div className="relative">
          <img src={getImageUrl(studentImage)} alt="" className="w-20 h-20 rounded-3xl object-cover mx-auto ring-4 ring-white shadow-xl shadow-slate-200/50" />
          <div className="absolute -bottom-2 right-1/2 translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">Student</div>
        </div>
        <h3 className="mt-6 text-lg font-black text-slate-900 truncate tracking-tight uppercase">{studentName || 'Student'}</h3>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <button key={item.path} type="button" onClick={go(item.path)} className={itemClass(isActive(item.path))}>
            {item.icon}
            <span className="tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function RightSidebar({ teachers = [] }) {
  const todayItems = useMemo(() => {
    const now = new Date();
    const all = [];
    teachers.forEach(t => t.courses.forEach(c => c.classes.forEach(cls => {
      if (!cls.date || cls.status === 'cancelled') return;
      if (isSameDhakaDay(new Date(cls.date), now)) {
        all.push({ id: `${t.id}-${cls.id}`, subject: c.subject, teacher: t.name, time: cls.date });
      }
    })));
    return all.sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [teachers]);

  return (
    <aside className="w-[320px] bg-white/40 backdrop-blur-3xl p-8 border-l border-white/50 flex-shrink-0 min-h-screen hidden md:block relative z-20">
      <div className="flex flex-col h-full space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100"><Megaphone size={18} /></div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">System</h3>
          </div>
          <div className="p-5 rounded-[1.5rem] bg-white/60 backdrop-blur-xl border border-white shadow-lg">
            <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tight">Accepting an invite immediately secures your spot in the batch.</p>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-6 pt-8 border-t border-slate-100">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100"><CalendarDays size={18} /></div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Today</h3>
          </div>
          {todayItems.length === 0 ? <p className="text-[10px] font-black uppercase text-slate-400 text-center py-8">Free Schedule</p> : (
            <div className="space-y-3">
              {todayItems.map(it => (
                <div key={it.id} className="p-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white shadow-lg">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(it.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{it.subject}</div>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{it.teacher}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/** ---------- MAIN PAGE ---------- */

export default function StudentInvitesPage() {
  const router = useRouter();
  const { userInfo, studentDashboard } = useSelector((s) => s.user || {});
  const me = studentDashboard?.student || userInfo || {};
  const studentName = me?.name || 'Student';
  const studentImage = me?.profileImage || '';
  const userId = useSelector((s) => s?.auth?.user?._id) || me?._id || me?.id;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [acting, setActing] = useState(null);
  const [teachers, setTeachers] = useState([]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const list = await listIncomingEnrollmentInvites();
      setItems(Array.isArray(list) ? list : []);
    } catch { setItems([]); } finally { setLoading(false); }
  };

  const fetchSchedulesForSidebar = async () => {
    try {
      const now = new Date();
      const res = await API.get(`/schedules/student?from=${new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()}&to=${new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString()}`);
      // Simple teacher transform for sidebar
      const mapped = [];
      (res.data || []).forEach(s => {
        const tid = s.teacherId?._id;
        if (!mapped.find(x => x.id === tid)) {
          mapped.push({ id: tid, name: s.teacherId?.name, courses: [{ title: s.postId?.title, subject: s.subject, classes: [{ date: s.date, status: s.status }] }] });
        } else {
          mapped.find(x => x.id === tid).courses[0].classes.push({ date: s.date, status: s.status });
        }
      });
      setTeachers(mapped);
    } catch { setTeachers([]); }
  };

  useEffect(() => { fetchInvites(); fetchSchedulesForSidebar(); }, []); // eslint-disable-line

  useSocket(userId, undefined, undefined, undefined, (n) => {
    if (['enrollment_invite_created', 'enrollment_invite_updated', 'enrollment_invite_paid'].includes(n?.type)) fetchInvites();
  });

  const onChoose = async (id, option) => {
    try {
      setActing(id);
      const res = await chooseInvitePayment(id, option);
      await fetchInvites();
    } catch (e) { alert(e?.response?.data?.message || 'Failed'); } finally { setActing(null); }
  };

  const onPayNowSimulator = async (invite) => {
    try {
      setActing(invite._id);
      const choice = invite.selectedOption || (invite.allowHalf ? 'half' : 'full');
      const { requiredCents } = await chooseInvitePayment(invite._id, choice);
      const { enrolled } = await markInvitePaid(invite._id, Number(requiredCents) || invite.priceCents);
      if (enrolled) alert('Successfully Enrolled! 🎉');
      await fetchInvites();
    } catch (e) { alert('Simulation failed'); } finally { setActing(null); }
  };

  const onDecline = async (inviteId) => {
    try {
      setActing(inviteId);
      await declineEnrollmentInvite(inviteId);
      await fetchInvites();
    } catch { alert('Failed to decline'); } finally { setActing(null); }
  };

  const pending = items.filter(i => i.status === 'pending');
  const finished = items.filter(i => i.status === 'completed');

  return (
    <div className="flex w-full h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-emerald-500/5 blur-[180px] rounded-full animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-indigo-500/5 blur-[150px] rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply"></div>
      </div>

      <StudentSidebar studentName={studentName} studentImage={studentImage} />

      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="p-4 md:p-12 max-w-5xl mx-auto space-y-16">
          <section>
            <div className="mb-10 px-2 flex flex-col items-start gap-4">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Gateway Invitations</h1>
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-200 border border-emerald-500 group hover:scale-[1.03] transition-all duration-500 cursor-default">
                <div className="p-1.5 rounded-lg bg-white/20 shadow-inner">
                  <Sparkles size={16} className="text-white fill-white/20" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{pending.length} Unclaimed Access Keys</span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="animate-pulse bg-white/40 h-48 rounded-[3rem] border border-white" />)}
              </div>
            ) : pending.length === 0 ? (
              <div className="p-20 text-center rounded-[3rem] bg-white/40 backdrop-blur-3xl border border-white shadow-2xl">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><Mail size={24} className="text-slate-200" /></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">Your inbox is clear for now.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pending.map((inv, idx) => (
                  <motion.div
                    key={inv._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white p-8 shadow-xl shadow-slate-200/40 hover:shadow-emerald-500/10 transition-all duration-500"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.8rem] bg-gradient-to-br from-emerald-100 to-white flex items-center justify-center shadow-lg"><BookOpen size={28} className="text-emerald-600" /></div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{inv.postId?.title || 'Advanced Tuition'}</h3>
                          <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><CreditCard size={12} /> {money(inv.priceCents, inv.currency)}</div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><ShieldCheck size={12} /> {inv.allowHalf ? 'Flexible' : 'Strict'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {!inv.selectedOption && (
                          <>
                            <button onClick={() => onChoose(inv._id, 'full')} className="h-12 px-6 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95">Full Access</button>
                            {inv.allowHalf && <button onClick={() => onChoose(inv._id, 'half')} className="h-12 px-6 rounded-2xl bg-white text-slate-900 border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 transition-all active:scale-95">Partial Key</button>}
                          </>
                        )}
                        {inv.selectedOption && (
                          <button onClick={() => onPayNowSimulator(inv)} className="h-12 px-8 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95 flex items-center gap-2">Initialize ({inv.selectedOption.toUpperCase()}) <ArrowRight size={14} /></button>
                        )}
                        <button onClick={() => onDecline(inv._id)} className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><MoreHorizontal size={20} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {finished.length > 0 && (
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 px-2">Archived Sessions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {finished.map(inv => (
                  <div key={inv._id} className="p-6 rounded-[2.5rem] bg-white/40 border border-white opacity-60">
                    <div className="text-xs font-black text-slate-900 uppercase truncate mb-1">{inv.postId?.title}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrollment Secured</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <RightSidebar teachers={teachers} />

      <style jsx global>{`
        @keyframes blob { 0%,100% {transform:translate(0,0) scale(1);} 33%{transform:translate(30px,-50px) scale(1.1);} 66%{transform:translate(-20px,20px) scale(0.9);} }
        .animate-blob { animation: blob 15s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .custom-scrollbar::-webkit-scrollbar { width:6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background:transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.05); border-radius:10px; }
      `}</style>
    </div>
  );
}
