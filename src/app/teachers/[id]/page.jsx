'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const TeacherPage = () => {
  const { id } = useParams(); // dynamic teacher ID from URL
  const [teacherData, setTeacherData] = useState(null); // full data (teacher + posts)
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 👇 Replace this with actual logged-in student ID from auth context/localStorage
  const studentId = typeof window !== 'undefined' ? localStorage.getItem('studentId') : null;
console.log(studentId, 'pum pum pum');
  useEffect(() => {
    if (!id) return;

    const getTeacher = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/teachers/${id}/profile`);
        const data = await response.json();

        if (!response.ok) {
          console.error('Failed to fetch teacher:', data);
          return;
        }

        setTeacherData(data);
        setLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setLoading(false);
      }
    };

    getTeacher();
  }, [id]);

  const handleRequestHelp = async () => {
    if (!studentId || !teacherData?.teacher?._id) {
      alert('Missing student or teacher ID');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('http://localhost:5000/api/session-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          teacherId: teacherData.teacher._id,
          subject: teacherData.teacher.subject || 'General',
          message,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Failed to send request');
      }

      alert('Request sent successfully!');
      setMessage('');
    } catch (err) {
      console.error('Error sending request:', err);
      alert('Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!teacherData) return <div>No teacher found.</div>;

  const { teacher, posts } = teacherData;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{teacher.name}</h1>
      <p className="mb-4">{teacher.bio}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Tuition Posts:</h2>
      {posts && posts.length > 0 ? (
        <ul className="list-disc pl-5">
          {posts.map((post) => (
            <li key={post._id} className="mb-2">
              <h3 className="font-semibold">{post.title}</h3>
              <p>{post.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>This teacher has no posts yet.</p>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Request Tuition Help</h2>
        <textarea
          className="w-full border p-2 rounded mb-2"
          placeholder="Write your message to the teacher..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={handleRequestHelp}
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {submitting ? 'Sending...' : 'Request Tuition Help'}
        </button>
      </div>
    </div>
  );
};

export default TeacherPage;
