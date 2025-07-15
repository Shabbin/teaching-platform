'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const userInfo = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const teacherId = userInfo?.id;
console.log(requests,"REQUESTS")
  useEffect(() => {
    if (!teacherId || !token) {
      setError('You must be logged in as a teacher.');
      return;
    }

    async function fetchRequests() {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/teacher-requests', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch requests');
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [teacherId, token]);

  async function updateRequestStatus(id, action) {
    setError(null);
    setLoadingIds((prev) => [...prev, id]);

    try {
      const res = await fetch(
        `http://localhost:5000/api/teacher-requests/${id}/${action}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
console.log(res,"RES")
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update request');
      }

      const data = await res.json();

      if (action === 'approve' && data.threadId) {
      
window.location.href = `/dashboard/teacher/chat/${data.threadId}`;
       
      }

      setRequests((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
    }
  }

  if (!teacherId || !token) return <p>Please log in as a teacher.</p>;
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
            <li key={req._id}>
              <strong>{req.studentName}</strong> wants help on <em>{req.topic || 'tuition'}</em>
              <br />
              Status: <b>{req.status}</b>
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
