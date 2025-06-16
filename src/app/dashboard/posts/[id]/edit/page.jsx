'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { updateTeacherPost } from '../../../../redux/teacherPostSlice'; // ✅ Adjust path as needed

const EditPostPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${id}`);
        if (!res.ok) throw new Error('Failed to fetch post');
        const data = await res.json();
        setPost(data);

        setTitle(data.title || '');
        setDescription(data.description || '');
        setSubjects(data.subjects || []);
        setLocation(data.location || '');
        setLanguage(data.language || '');
        setHourlyRate(data.hourlyRate || '');
        setYoutubeLink(data.youtubeLink || '');
        setTags(data.tags || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const updatedData = {
      title,
      description,
      subjects, // subjects stay unchanged
      location,
      language,
      hourlyRate: Number(hourlyRate),
      youtubeLink,
      tags,
    };

    try {
      const result = await dispatch(updateTeacherPost({ id, updatedData }));

      if (updateTeacherPost.fulfilled.match(result)) {
        router.push(`/dashboard/posts/${id}`);
      } else {
        setError(result.payload || 'Failed to update post');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTagsChange = (e) => {
    const val = e.target.value;
    setTags(val.split(',').map(t => t.trim()).filter(Boolean));
  };

  if (loading) return <p>Loading post data...</p>;
  if (error && !post) return <p className="text-red-600">Error: {error}</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-3xl font-semibold mb-6">Edit Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            maxLength={150}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1" htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            maxLength={2000}
            onChange={e => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={6}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1" htmlFor="subjects">Subjects (read-only)</label>
          <input
            id="subjects"
            type="text"
            value={subjects.join(', ')}
            readOnly
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium mb-1" htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1" htmlFor="language">Language</label>
          <input
            id="language"
            type="text"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1" htmlFor="hourlyRate">Hourly Rate (BDT)</label>
          <input
            id="hourlyRate"
            type="number"
            min="0"
            value={hourlyRate}
            onChange={e => setHourlyRate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1" htmlFor="youtubeLink">YouTube Link</label>
          <input
            id="youtubeLink"
            type="url"
            value={youtubeLink}
            onChange={e => setYoutubeLink(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1" htmlFor="tags">Tags (comma separated)</label>
          <input
            id="tags"
            type="text"
            value={tags.join(', ')}
            onChange={handleTagsChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditPostPage;
