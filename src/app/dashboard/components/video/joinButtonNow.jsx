'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCanJoin } from '../../../hooks/useCanJoin';
import { issueJoinToken } from '../../../../api/video';
import ClassJoiner from "./classJoiner";


export default function JoinNowButton({ schedule, scheduleId: scheduleIdProp, compact }) {
  const scheduleId = useMemo(
    () => (schedule?._id ? String(schedule._id) : scheduleIdProp ? String(scheduleIdProp) : ''),
    [schedule, scheduleIdProp]
  );

  const { loading, state, refresh } = useCanJoin(scheduleId);
  const [issuing, setIssuing] = useState(false);
  const [open, setOpen] = useState(false);
  const [joinInfo, setJoinInfo] = useState(null);

  const onJoin = useCallback(async () => {
    try {
      setIssuing(true);
      const data = await issueJoinToken(scheduleId); // { provider, roomName, token?, joinUrl? }
      setJoinInfo(data);
      setOpen(true); // open the modal here
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Could not start the call');
      refresh();
    } finally {
      setIssuing(false);
    }
  }, [scheduleId, refresh]);

  const canJoin = !!state?.canJoin;
  const reason = state?.reason;

  let hint = '';
  if (loading) hint = 'Checking…';
  else if (reason === 'unauthorized') hint = 'Sign in required';
  else if (reason === 'window') hint = 'Not available to join yet';
  else if (reason === 'invalid_state') hint = 'Invalid schedule';
  else if (reason === 'not_participant') hint = 'Not a participant';
  else if (!canJoin) hint = 'Unavailable';

  return (
    <>
      <div className={`flex items-center gap-2 ${compact ? '' : ''}`}>
        <button
          disabled={!canJoin || loading || issuing || !scheduleId}
          onClick={onJoin}
          className={`px-3 py-1.5 rounded-lg text-white ${canJoin ? 'bg-slate-900 hover:bg-black' : 'bg-slate-200'}`}
        >
          {issuing ? 'Joining…' : 'Join'}
        </button>
        <span className="text-xs text-slate-500">{hint}</span>
      </div>

      {open && joinInfo && (
        <ClassJoiner
          open={open}
          onClose={() => setOpen(false)}
          provider={joinInfo.provider}     // ✅ important
          roomName={joinInfo.roomName}
          token={joinInfo.token ?? null}
          joinUrl={joinInfo.joinUrl ?? null}
        />
      )}
    </>
  );
}
