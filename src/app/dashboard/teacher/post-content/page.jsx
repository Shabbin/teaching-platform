'use client';
import { useState } from 'react';

export default function PostContentPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('Unauthorized. Please log in.');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subject', subject);
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5000/api/teachers/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload');

      setSuccess(true);
      setTitle('');
      setDescription('');
      setSubject('');
      setFile(null);
    } catch (err) {
      setError('Something went wrong while uploading.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-indigo-600 mb-4">📤 Post New Content</h1>

      {success && <p className="text-green-600 mb-4">Content uploaded successfully!</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 shadow rounded-lg">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />

        <textarea
          placeholder="Short description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        ></textarea>

        <input
          type="text"
          placeholder="Subject (e.g. Math, Physics)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full"
          required
        />

        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Upload
        </button>
      </form>
    </div>
  );
}
