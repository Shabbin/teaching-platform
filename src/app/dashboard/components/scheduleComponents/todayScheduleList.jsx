"use client";
//src\app\dashboard\components\scheduleComponents\todayScheduleList.jsx
import React, { useMemo } from "react";

// 👇 Use ONE of these based on where your hook file lives.
// If hook is at src/app/hooks/useSchedules.js (most likely in your project):
import { useTeacherSchedules } from "../../../hooks/useSchedules";

// If hook is at src/hooks/useSchedules.js instead, comment the above line and uncomment this:
// import { useTeacherSchedules } from "../../../../hooks/useSchedules";

import JoinNowButton from "../video/joinButtonNow"; // ✅ exact casing

export default function TodayScheduleList() {
  const q = useTeacherSchedules();

  const today = useMemo(() => {
    const items = Array.isArray(q.data) ? q.data : [];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date();   end.setHours(23, 59, 59, 999);
    return items
      .filter((s) => s?.status === "scheduled")
      .filter((s) => {
        const d = new Date(s?.date);
        return !isNaN(+d) && d >= start && d <= end;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [q.data]);

  if (q.isLoading) {
    return <div className="text-sm text-slate-500">Loading today’s classes…</div>;
  }
  if (today.length === 0) {
    return <div className="text-sm text-slate-500">No classes today.</div>;
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Today’s Classes</h2>
      <div className="grid gap-3">
        {today.map((s) => {
          const t = new Date(s.date);
          const time = isNaN(+t)
            ? "—"
            : t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const subj =
            s?.subject ||
            (Array.isArray(s?.postId?.subjects) ? s.postId.subjects.join(" | ") : s?.postId?.subjects) ||
            "Class";
          const type = s?.type === "demo" ? "Demo" : "Regular";
          const students =
            Array.isArray(s?.studentIds) ? s.studentIds.length : s?.studentId ? 1 : 0;

          return (
            <div
              key={s._id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900">
                  {time} — {subj}
                </div>
                <div className="text-[11px] text-slate-500">
                  {type} • {students} {students === 1 ? "student" : "students"}
                </div>
              </div>
              <JoinNowButton schedule={s} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
