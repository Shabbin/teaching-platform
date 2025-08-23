'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// ⬇️ Use your env-driven axios instance
import API, { absUrl } from '../../../api/axios'; // adjust path if needed

export default function TuitionPostsPage() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ subject: '', teacher: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, posts]);

  const fetchPosts = async () => {
    try {
      const res = await API.get('/posts');
      const data = res.data || [];

      setPosts(data);
      setFilteredPosts(data);

      // Build unique subject list (supports array or single string)
      const subjSet = new Set();
      for (const p of data) {
        if (Array.isArray(p.subjects)) {
          p.subjects.forEach((s) => s && subjSet.add(s));
        } else if (p.subject) {
          subjSet.add(p.subject);
        }
      }
      setSubjects(Array.from(subjSet));
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const applyFilters = () => {
    const subjectFilter = (post) => {
      if (!filters.subject) return true;
      if (Array.isArray(post.subjects)) return post.subjects.includes(filters.subject);
      if (post.subject) return post.subject === filters.subject;
      return false;
    };

    const teacherFilter = (post) => {
      if (!filters.teacher) return true;
      const teacherName =
        post.teacher?.name ||
        post.teacherName ||
        (typeof post.teacher === 'string' ? post.teacher : '') ||
        '';
      return teacherName.toLowerCase().includes(filters.teacher.toLowerCase());
    };

    setFilteredPosts(posts.filter((p) => subjectFilter(p) && teacherFilter(p)));
  };

  const teacherNameOf = (post) =>
    post.teacher?.name || post.teacherName || 'Unknown Teacher';

  const teacherIdOf = (post) =>
    (post.teacher && (post.teacher._id || post.teacher.id)) || post.teacherId;

  const teacherAvatarOf = (post) => {
    const raw =
      post.teacher?.profileImage ||
      post.teacherProfileImage ||
      ''; // could be relative path from backend
    if (!raw) return 'https://via.placeholder.com/56';
    return absUrl(raw.replace(/\\/g, '/')); // normalize windows slashes
  };

  const subjectLabelOf = (post) =>
    Array.isArray(post.subjects) ? post.subjects.join(', ') : (post.subject || '—');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Browse Tuition Posts</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center">
        <select
          className="border p-2 rounded w-full md:w-60"
          value={filters.subject}
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
        >
          <option value="">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by teacher name"
          className="border p-2 rounded w-full md:w-60"
          value={filters.teacher}
          onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}
        />
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <p className="text-center text-gray-500">No posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const name = teacherNameOf(post);
            const teacherId = teacherIdOf(post);
            const avatar = teacherAvatarOf(post);

            return (
              <div
                key={post._id}
                className="bg-white border rounded-2xl shadow hover:shadow-lg transition p-5"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src={avatar}
                    alt={name}
                    width={56}
                    height={56}
                    className="rounded-full object-cover border"
                  />
                  <div>
                    <h2 className="text-lg font-semibold">{name}</h2>
                    <p className="text-sm text-gray-500 italic">
                      {subjectLabelOf(post)}
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                <p className="text-gray-700 mb-4">
                  {typeof post.description === 'string'
                    ? post.description
                    : ''}
                </p>

                {teacherId ? (
                  <Link href={`/teachers/${teacherId}/posts`}>
                    <button className="mt-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full">
                      View Profile
                    </button>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="mt-auto bg-gray-200 text-gray-500 px-4 py-2 rounded w-full cursor-not-allowed"
                  >
                    Profile Unavailable
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
