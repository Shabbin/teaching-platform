// src/app/classroom/[scheduleId]/page.jsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { issueJoinToken, canJoin } from '../../../api/video';

export default function ClassroomPage({ params }) {
  const { scheduleId } = params;
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [joinUrl, setJoinUrl] = useState('');

  // Optional pre-check (gives nicer messages if outside window / not paid)
  useEffect(() => {
    let mounted = true;
    (async () => { 
      try {
        const cj = await canJoin(scheduleId);
        if (!mounted) return;
        if (!cj?.canJoin) {
          if (cj?.reason === 'payment_required') {
            setError('Payment required before joining this class.');
          } else if (cj?.reason === 'window') {
            const open = cj?.joinWindow?.openBeforeMin ?? 10;
            const after = cj?.joinWindow?.afterGraceMin ?? 15;
            setError(
              `Join will open shortly before class (≈${open} min) and stay open for ≈${after} min after.`
            );
          } else {
            setError('You cannot join this class.');
          }
          setChecking(false);
          setLoading(false);
          return;
        }
        setChecking(false);
        // If can join, get the token
        const resp = await issueJoinToken(scheduleId);
        if (!mounted) return;
        if (!resp?.token || !resp?.joinUrl) {
          setError('Could not get a video token. Try again.');
          setLoading(false);
          return;
        }
        setToken(resp.token);
        setJoinUrl(resp.joinUrl);
        setLoading(false);
      } catch (e) {
        setError(
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          'Could not initialize classroom.'
        );
        setChecking(false);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [scheduleId]);

  const iframeSrc = useMemo(() => {
    if (!joinUrl || !token) return '';
    // Daily Prebuilt accepts token via ?t=
    const url = new URL(joinUrl);
    url.searchParams.set('t', token);
    return url.toString();
  }, [joinUrl, token]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-slate-600">Preparing your classroom…</div>
      </div>
    );
  }

  if (error && !iframeSrc) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-slate-900 mb-2">Unable to join</h1>
          <p className="text-slate-600">{error}</p>
          {!checking && (
            <button
              onClick={() => location.reload()}
              className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // ✅ Render the actual video room
  return (
    <div className="w-screen h-screen">
      <iframe
        src={iframeSrc}
        allow="camera; microphone; speakers; display-capture; fullscreen; clipboard-write"
        allowFullScreen
        className="w-full h-full border-0"
        title="Live Class"
      />
    </div>
  );
}
