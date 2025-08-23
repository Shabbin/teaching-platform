// app/dashboard/teacher/requests/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import API from '../../../../api/axios'; // env-driven axios (withCredentials enabled)

export default function RequestsPage() {
  const router = useRouter();
  const userInfo = useSelector((state) => state.user.userInfo);
  const teacherId = userInfo?.id || userInfo?._id;

  const [requests, setRequests] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacherId) {
      setError('You must be logged in as a teacher.');
      return;
    }

    async function fetchRequests() {
      setError(null);
      setLoading(true);
      try {
        const res = await API.get('/teacher-requests');
        setRequests(res.data || []);
      } catch (err) {
        setError(err.normalizedMessage || err.message || 'Failed to fetch requests');
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [teacherId]);

  async function updateRequestStatus(id, action) {
    setError(null);
    setLoadingIds((prev) => [...prev, id]);

    try {
      const res = await API.post(`/teacher-requests/${id}/${action}`, {});
      const data = res.data;

      if (action === 'approve' && data?.threadId) {
        // Navigate to the messenger thread
        router.push(`/dashboard/teacher/messenger/${data.threadId}`);
      }

      // Optimistically update list
      setRequests((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
        )
      );
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Failed to update request');
    } finally {
      setLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
    }
  }

  if (!teacherId) return <p>Please log in as a teacher.</p>;
  if (loading) return <p>Loading requests...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (requests.length === 0) return <p>No tuition requests found.</p>;

  return (
    <div>
      <h1>Teacher Requests</h1>
      <ul>
        {requests.map((req) => {
          const isLoading = loadingIds.includes(req._id);
          return (
            <li key={req._id} style={{ marginBottom: 12 }}>
              <strong>{req.studentName}</strong> wants help on <em>{req.topic || 'tuition'}</em>
              <br />
              Status: <b>{req.status}</b>{' '}
              {req.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateRequestStatus(req._id, 'approve')}
                    disabled={isLoading}
                    style={{ marginRight: 8 }}
                  >
                    {isLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => updateRequestStatus(req._id, 'reject')}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Reject'}
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
