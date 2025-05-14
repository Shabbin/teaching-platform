'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
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
      const res = await axios.get('http://localhost:5000/api/posts');
      const data = res.data || [];
console.log(data,'daata')
      setPosts(data);
      setFilteredPosts(data);

      const uniqueSubjects = [...new Set(data.map(post => post.subject))];
      setSubjects(uniqueSubjects);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const applyFilters = () => {
    const filtered = posts.filter(post => {
      const matchesSubject = filters.subject ? post.subject === filters.subject : true;
      const matchesTeacher = filters.teacher
        ? post.teacher.name.toLowerCase().includes(filters.teacher.toLowerCase())
        : true;
      return matchesSubject && matchesTeacher;
    });
    setFilteredPosts(filtered);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Browse Tuition Posts</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center">
        <select
          className="border p-2 rounded w-full md:w-60"
          value={filters.subject}
          onChange={e => setFilters({ ...filters, subject: e.target.value })}
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
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
          onChange={e => setFilters({ ...filters, teacher: e.target.value })}
        />
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <p className="text-center text-gray-500">No posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <div
              key={post._id}
              className="bg-white border rounded-2xl shadow hover:shadow-lg transition p-5"
            >
              <div className="flex items-center gap-4 mb-4">
                <Image 
                  src={
    post.teacher.profileImage
      ? `http://localhost:5000/${post.teacher.profileImage.replace(/\\/g, '/')}`
      : 'https://via.placeholder.com/56'
  }
  alt={post.teacher.name}
  width={56}
  height={56}
  className="rounded-full object-cover border"

                />
                <div>
                  <h2 className="text-lg font-semibold">{post.teacher.name}</h2>
                  <p className="text-sm text-gray-500 italic">{post.subject}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">{post.title}</h3>
              <p className="text-gray-700 mb-4">{post.description}</p>

              <Link href={`/teachers/${post.teacher._id}`}>
                <button className="mt-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full">
                  View Profile
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
