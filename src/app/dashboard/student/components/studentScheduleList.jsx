
'use client';

import React, { useMemo } from 'react';
import { useStudentSchedules } from '../../../hooks/useSchedules';
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
    return <div className="text-sm text-slate-500">Loading today’s classes…</div>;
  }
  if (error) {
    return <div className="text-sm text-rose-600">Failed to load: {String(error?.message || 'Error')}</div>;
  }
  if (!todays.length) {
    return <div className="text-sm text-slate-500">No classes scheduled today.</div>;
  }

  return (
    <div className="space-y-3">
      {todays.map((s) => (
        <div key={s._id} className="p-3 rounded-xl bg-white shadow-sm border border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-800">
                {new Date(s.date).toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
                })}{' '}
                — {s.subject || s?.postId?.title || 'Class'}
              </div>
              <div className="text-[12px] text-slate-500 truncate">
                {s?.teacherId?.name ? `Teacher: ${s.teacherId.name}` : ''}
                <span className="ml-2 opacity-75">{formatDhaka(s.date)}</span>
              </div>
            </div>

            {/* ✅ This uses useCanJoin under the hood */}
            <JoinNowButton scheduleId={s._id} />
          </div>
        </div>
      ))}
    </div>
  );
}
