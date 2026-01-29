
'use client';

import React, { useMemo } from 'react';
import { useStudentSchedules } from '../../../hooks/useSchedules';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Video, BookOpen, User } from 'lucide-react';
// ⬇️ FIX: join button is inside the *same* components folder → use "./video/..."
import JoinNowButton from "../../components/video/joinButtonNow";

const tz = 'Asia/Dhaka';

function isSameDhakaDay(a, b) {
  const da = new Date(a), db = new Date(b);
  if (isNaN(da) || isNaN(db)) return false;
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(da) === fmt.format(db);
}
function formatDhaka(iso) {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d)) return 'TBD';
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: tz });
  const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
  return `${datePart}, ${timePart}`;
}

export default function StudentTodayScheduleList() {
  const { data, isLoading, error } = useStudentSchedules();

  const todays = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const now = new Date();
    return list
      .filter(s => s?.date && s?.status !== 'cancelled' && isSameDhakaDay(s.date, now))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-white/40 backdrop-blur-md md:backdrop-blur-xl rounded-[2rem] border border-white animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-[2rem] bg-rose-50/50 border border-rose-100 text-center">
        <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Failed to load schedule</p>
      </div>
    );
  }

  if (!todays.length) {
    return (
      <div className="p-8 rounded-[2rem] bg-white/40 backdrop-blur-md md:backdrop-blur-xl border border-white text-center">
        <div className="w-12 h-12 rounded-full bg-slate-50 grid place-items-center mx-auto mb-4">
          <Calendar size={20} className="text-slate-200" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No classes today</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todays.map((s, idx) => (
        <motion.div
          key={s._id}
          initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : idx * 0.1 }}
          className="group relative p-5 rounded-[2rem] bg-white/60 backdrop-blur-md md:backdrop-blur-2xl border border-white shadow-lg shadow-indigo-100/20 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-500"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0 group-hover:bg-indigo-600 transition-colors">
                <span className="text-[10px] font-black leading-none mb-1 opacity-60">
                  {new Date(s.date).getHours() >= 12 ? 'PM' : 'AM'}
                </span>
                <span className="text-sm font-black leading-none">
                  {new Date(s.date).getHours() % 12 || 12}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(s.date).toLocaleTimeString('en-GB', {
                      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
                    })}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 truncate tracking-tight uppercase group-hover:text-indigo-600 transition-colors">
                  {s.subject || s?.postId?.title || 'Class Session'}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                  <div className="flex items-center gap-1">
                    <User size={10} className="text-slate-300" />
                    <span className="truncate max-w-[80px]">{s?.teacherId?.name || 'Teacher'}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-1">
                    <BookOpen size={10} className="text-slate-300" />
                    <span>{s.type || 'Regular'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 scale-90 md:scale-100">
              <JoinNowButton scheduleId={s._id} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
