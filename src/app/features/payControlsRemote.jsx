'use client';
import { useEffect, useMemo, useState } from 'react';
import { getTuitionStatus, useDemo } from '../api/tuition';
import { startTuition } from '../api/payments';

export default function TuitionBanner({
  role = 'student',          // "student" | "teacher"
  requestId,
  studentId,
  teacherId,
  defaultMonthlyFee = '',
  className = '',
  returnUrl,                 // optional override
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  // only fetch when IDs exist
  const idsReady = !!studentId && !!teacherId && !!requestId;

  const currentUrl =
    returnUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // load status
  useEffect(() => {
    let ignore = false;
    if (!idsReady) {
      setStatus(null);
      setErr('');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const data = await getTuitionStatus({ studentId, teacherId, requestId });
        if (!ignore) setStatus(data);
      } catch (e) {
        if (!ignore) setErr(e?.response?.data?.error || e.message || 'Failed to load tuition status');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [idsReady, studentId, teacherId, requestId]);

  // handle return from payment (?paid=1&type=TUITION)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    const paid = u.searchParams.get('paid');
    const type = u.searchParams.get('type');
    if (paid === '1' && type === 'TUITION') {
      // clean flags
      ['paid','type','tran_id','amt','status','phase','month'].forEach(k => u.searchParams.delete(k));
      window.history.replaceState({}, '', u.toString());
      // refresh status
      (async () => {
        try {
          if (!idsReady) return;
          setLoading(true);
          const data = await getTuitionStatus({ studentId, teacherId, requestId });
          setStatus(data);
        } catch (e) {
          setErr(e?.response?.data?.error || e.message || 'Failed to refresh status');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [idsReady, studentId, teacherId, requestId]);

  const isApproved = !!status?.isApproved;
  const paid = !!status?.paid;
  const maxDemos = status?.maxDemos ?? 3;
  const demosUsed = status?.demosUsed ?? 0;
  const demosLeft = Math.max(0, maxDemos - demosUsed);
  const storedMonthly = Number(status?.monthlyFee || defaultMonthlyFee || 0);
  const monthlyFee = useMemo(() => storedMonthly > 0 ? storedMonthly : 0, [storedMonthly]);

  async function refresh() {
    try {
      const data = await getTuitionStatus({ studentId, teacherId, requestId });
      setStatus(data);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || 'Failed to refresh');
    }
  }

  async function onUseDemo() {
    setErr('');
    try {
      setBusy(true);
      await useDemo({ requestId });
      await refresh();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || 'Failed to record demo');
    } finally {
      setBusy(false);
    }
  }

  async function onPay(fraction) {
    setErr('');
    try {
      // Ensure we have a fee. If not set on request, ask once.
      let fee = monthlyFee;
      if (!fee || fee <= 0) {
        const raw = typeof window !== 'undefined'
          ? window.prompt('Enter monthly fee (BDT) agreed with teacher:', '')
          : '';
        fee = Number(raw || 0);
        if (!fee) return;
      }

      const { url } = await startTuition({
        requestId,
        monthlyFee: fee,
        phase: 'FIRST',
        fraction,
        returnUrl: currentUrl,
      });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || 'Failed to initiate payment');
    }
  }

  // visibility logic:
  // - Both see status chips always (once IDs exist)
  // - While approved & not paid:
  //   - Teacher gets "Mark demo complete" until limit reached
  //   - Student gets "Use demo" until limit reached, then "Pay 50%" / "Pay 100%"
  // - After 3 demos: no more demos; only student sees pay buttons
  // - After paid: nothing actionable here (status only)

  if (!idsReady) return null;
  if (loading) return <div className={className}>Loading tuition status…</div>;

  return (
    <div className={`rounded-xl border p-4 bg-white shadow-sm ${className}`}>
      {/* status row */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
          {isApproved ? 'Approved' : 'Pending approval'}
        </span>
        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
          Demos: {demosUsed} / {maxDemos}
        </span>
        {paid ? (
          <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
            Payment received
          </span>
        ) : demosLeft <= 0 ? (
          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
            Demo limit reached
          </span>
        ) : null}
        {monthlyFee > 0 && (
          <span className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700">
            Agreed fee: {monthlyFee} BDT
          </span>
        )}
      </div>

      {/* error */}
      {err && <div className="text-sm text-red-600 mb-2">{err}</div>}

      {/* actions */}
      {!paid && isApproved && (
        <div className="flex flex-wrap gap-8 items-center">
          {/* Demo controls */}
          {demosLeft > 0 && (
            role === 'teacher' ? (
              <button
                onClick={onUseDemo}
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
              >
                Mark demo complete
              </button>
            ) : (
              <button
                onClick={onUseDemo}
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
              >
                Use demo now
              </button>
            )
          )}

          {/* Payment controls (student only) */}
          {role === 'student' && demosLeft === 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => onPay(0.5)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Pay 50% advance
              </button>
              <button
                onClick={() => onPay(1)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Pay 100% advance
              </button>
            </div>
          )}
        </div>
      )}

      {/* guidance text */}
      {!paid && isApproved && demosLeft > 0 && (
        <p className="text-xs text-slate-500 mt-2">
          Up to {maxDemos} demo classes are allowed. After that, payment is required to continue.
        </p>
      )}
      {!paid && isApproved && demosLeft === 0 && role === 'student' && (
        <p className="text-xs text-slate-500 mt-2">
          Demo limit reached. Please complete the first payment to continue scheduling.
        </p>
      )}
    </div>
  );
}
