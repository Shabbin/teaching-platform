// src/app/dashboard/components/scheduleComponents/StudentTodayScheduleList.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import API from "../../../../../api/axios";               // <-- note the path depth from /components/scheduleComponents
import JoinNowButton from "../video/JoinNowButton";      // reuse the same button

const brand = "oklch(0.49 0.25 277)";

export default function StudentTodayScheduleList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch only today's window (Asia/Dhaka)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const now = new Date();

        // Start/end of today in local system time; backend will store UTC.
        // We’ll just query a 1-day window so we don’t overfetch.
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        const end   = new Date(now); end.setHours(23, 59, 59, 999);

        const params = new URLSearchParams({
          from: start.toISOString(),
          to: end.toISOString(),
        }).toString();

        const res = await API.get(`/schedules/student?${params}`);
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = useMemo(() => {
    return (items || [])
      .filter((s) => s?.status === "scheduled")
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [items]);

  if (loading) return <div className="text-sm text-slate-500">Loading today’s classes…</div>;
  if (today.length === 0) return <div className="text-sm text-slate-500">No classes today.</div>;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Today’s Classes</h2>
      <div className="grid gap-3">
        {today.map((s) => {
          const t = new Date(s.date);
          const time = isNaN(+t)
            ? "—"
            : t.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Dhaka",
              });

          const subj =
            s?.subject ||
            (Array.isArray(s?.postId?.subjects)
              ? s.postId.subjects.join(" | ")
              : s?.postId?.subjects) ||
            "Class";

          const type = s?.type === "demo" ? "Demo" : "Regular";
          const students = Array.isArray(s?.studentIds)
            ? s.studentIds.length
            : s?.studentId
            ? 1
            : 0;

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

              {/* Reuses the same join logic as teacher side */}
              <JoinNowButton schedule={s} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
