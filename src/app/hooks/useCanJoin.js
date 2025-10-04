// src/hooks/useCanJoin.js
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { canJoin } from '../../api/video';   // ✅ use the real named export

export function useCanJoin(scheduleId, { intervalMs = 15000 } = {}) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(null);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await canJoin(scheduleId);   // ✅ correct function
      setState(res);                           // { canJoin, reason, joinWindow, role? }
    } catch (e) {
      // If the backend really 401s, keep that reason explicit
      const status = e?.response?.status;
      setState({
        canJoin: false,
        reason: status === 401 ? 'unauthorized' : 'error',
        error: e?.response?.data?.message || e?.message || 'Failed',
      });
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    if (!scheduleId) return;
    load();
    timerRef.current = window.setInterval(load, intervalMs);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [load, intervalMs, scheduleId]);

  return { loading, state, refresh: load };
}
