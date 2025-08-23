// src/hooks/useTuitionStatus.js
import { useEffect, useState, useCallback } from "react";
import { getTuitionStatus } from "@/api/tuition";

export function useTuitionStatus({ studentId, teacherId, requestId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!studentId || !teacherId) return;
    setLoading(true);
    try {
      const s = await getTuitionStatus({ studentId, teacherId, requestId });
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, [studentId, teacherId, requestId]);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return { status, loading, refresh };
}
