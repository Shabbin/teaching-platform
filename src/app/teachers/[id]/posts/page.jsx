'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const TeacherPostsPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const subjectParams = searchParams.getAll('subject');

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const queryParams = new URLSearchParams();
    queryParams.append('teacher', id);
    subjectParams.forEach(s => queryParams.append('subject', s));

    const fetchPosts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts?${queryParams.toString()}`);
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error('Error fetching teacher posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [id, subjectParams.join(',')]);

  if (loading) return <p className="p-6 text-center text-gray-400 animate-pulse">Loading posts...</p>;
  if (posts.length === 0) return <p className="p-6 text-center text-red-500">No posts found for this teacher.</p>;

  const teacher = posts[0].teacher;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Go Back */}
      <button
        onClick={() => router.push('/dashboard/student/teachers')}
        className="mb-8 px-5 py-2 bg-gradient-to-r from-gray-300 to-gray-200 text-gray-800 font-semibold rounded-full shadow hover:from-gray-400 hover:to-gray-300 transition transform hover:-translate-y-1"
      >
        ← Go Back to All Teachers
      </button>

      {/* Teacher Name with Profile Image */}
      <div className="flex items-center gap-4 mb-10">
        <img
          src={teacher.profileImage || '/default.png'}
          alt={teacher.name}
          className="w-20 h-20 rounded-full object-cover shadow-lg"
        />
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-wide">
          {teacher.name}{' '}
          {subjectParams.length > 0 && (
            <span className="text-indigo-600 font-semibold"> (Filtered by {subjectParams.join(', ')})</span>
          )}
        </h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
     {posts.map(post => (
  <div
    key={post._id}
    className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 hover:scale-[1.02] flex flex-col justify-between"
    style={{ minHeight: '360px' }} // optional: ensure all cards have a base height
  >
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-3">{post.title}</h2>
      <p className="text-gray-600 mt-1 line-clamp-3">{post.description}</p>

      <div className="flex gap-2 mt-4 flex-wrap text-sm text-indigo-700">
        {post.subjects?.map((s, i) => (
          <span
            key={i}
            className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium"
          >
            #{s}
          </span>
        ))}
      </div>

      <div className="text-sm text-gray-500 mt-3 flex justify-between items-center">
        <span>৳ {post.hourlyRate} / hr</span>
        <span className="flex items-center gap-1">📍 {post.location}</span>
      </div>
    </div>

    <div className="mt-5">
      <Link href={`/dashboard/posts/${post._id}?teacherId=${teacher._id}`}>
        <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition transform hover:-translate-y-1 hover:scale-105">
          View Details
        </button>
      </Link>
    </div>
  </div>
))}

      </div>
    </div>
  );
};

export default TeacherPostsPage;
