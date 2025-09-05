// src/app/dashboard/student/schedule/invites/page.jsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import useSocket from '../../../../hooks/useSocket';

import {
  listIncomingEnrollmentInvites,
  chooseInvitePayment,
  markInvitePaid,
  declineEnrollmentInvite,
} from '../../../../../api/enrollmentInvites';

const money = (cents, cur='USD') => `${(cents/100).toFixed(2)} ${cur}`;

export default function StudentInvitesPage() {
  const userId = useSelector(s => s?.auth?.user?._id);
  const [loading, setLoading] = useState(true);
  const [items, setItems]     = useState([]);
  const [acting, setActing]   = useState(null);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const list = await listIncomingEnrollmentInvites();
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvites(); }, []); // eslint-disable-line

  useSocket(
    userId,
    undefined, undefined, undefined,
    (n) => {
      if ([
        'new_notification',
        'routine_refresh',
        'schedules_refresh',
        'enrollment_invite_created',
        'enrollment_invite_updated',
        'enrollment_invite_paid',
      ].includes(n?.type)) {
        fetchInvites();
      }
    }
  );

  const onChoose = async (id, option) => {
    try {
      setActing(id);
      const res = await chooseInvitePayment(id, option);
      alert(
        option === 'half'
          ? `Half selected. You must pay at least ${money(res.requiredCents, res.currency)} to enroll.`
          : `Full selected. Please pay ${money(res.requiredCents, res.currency)} to enroll.`
      );
      await fetchInvites();
    } catch (e) {
      alert(e?.response?.data?.message || e?.normalizedMessage || 'Failed to choose payment option');
    } finally {
      setActing(null);
    }
  };

  const onPayNow = async (invite) => {
    try {
      setActing(invite._id);
      const choice = invite.selectedOption || (invite.allowHalf ? 'half' : 'full');
      const { requiredCents } = await chooseInvitePayment(invite._id, choice);
      const pay = Number(requiredCents) || Number(invite.priceCents);
      const res = await markInvitePaid(invite._id, pay);
      alert(res?.enrolled ? 'Payment received. You are enrolled! 🎉' : 'Payment recorded.');
      await fetchInvites();
    } catch (e) {
      alert(e?.response?.data?.message || e?.normalizedMessage || 'Payment failed');
    } finally {
      setActing(null);
    }
  };

  const onDecline = async (inviteId) => {
    try {
      setActing(inviteId);
      await declineEnrollmentInvite(inviteId);
      await fetchInvites();
    } catch (e) {
      alert(e?.response?.data?.message || e?.normalizedMessage || 'Failed to decline');
    } finally {
      setActing(null);
    }
  };

  const pending   = useMemo(() => items.filter(i => i.status === 'pending'), [items]);
  const completed = useMemo(() => items.filter(i => i.status === 'completed'), [items]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold">Course Invites</h2>
      <p className="text-sm text-slate-600">Accept and pay to enroll.</p>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : pending.length === 0 && completed.length === 0 ? (
          <div className="text-sm text-slate-500">No invites.</div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <section>
                <h3 className="text-sm font-medium mb-2">Pending</h3>
                <div className="space-y-3">
                  {pending.map(inv => (
                    <div key={inv._id} className="border rounded-xl p-4 bg-white">
                      <div className="flex items-start gap-3">
                        <div className="grow">
                          <div className="text-sm font-semibold">
                            {inv?.postId?.title || 'Course'}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Price: {money(inv.priceCents, inv.currency)} • {inv.allowHalf ? 'Half allowed' : 'Full only'}
                          </div>
                          {inv.note && <div className="text-xs text-slate-600 mt-1">Note: {inv.note}</div>}
                          {inv.selectedOption && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Selected: {inv.selectedOption.toUpperCase()}
                            </div>
                          )}
                          {inv.paymentStatus !== 'unpaid' && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Payment: {inv.paymentStatus} ({money(inv.paidCents || 0, inv.currency)} paid)
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full ring-1 bg-amber-50 text-amber-700 ring-amber-200">pending</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button disabled={acting === inv._id} onClick={() => onChoose(inv._id, 'full')} className="px-3 py-1.5 rounded-lg border">Pay full</button>
                        {inv.allowHalf && (
                          <button disabled={acting === inv._id} onClick={() => onChoose(inv._id, 'half')} className="px-3 py-1.5 rounded-lg border">Pay half</button>
                        )}
                        <button
                          disabled={acting === inv._id}
                          onClick={() => onPayNow(inv)}
                          className="px-3 py-1.5 rounded-lg text-white"
                          style={{ backgroundColor: 'oklch(0.49 0.25 277)' }}
                          title="Simulate paying the minimum to enroll"
                        >
                          Pay now (simulate)
                        </button>
                        <button disabled={acting === inv._id} onClick={() => onDecline(inv._id)} className="px-3 py-1.5 rounded-lg border">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h3 className="text-sm font-medium mb-2">Completed</h3>
                <div className="space-y-3">
                  {completed.map(inv => (
                    <div key={inv._id} className="border rounded-xl p-4 bg-white">
                      <div className="flex items-start gap-3">
                        <div className="grow">
                          <div className="text-sm font-semibold">
                            {inv?.postId?.title || 'Course'}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Paid: {money(inv.paidCents || inv.priceCents, inv.currency)}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200">completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
