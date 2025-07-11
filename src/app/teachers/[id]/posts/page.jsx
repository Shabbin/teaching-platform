'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const TeacherPostsPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const subjectParams = searchParams.getAll('subject'); // ✅ supports multiple subjects

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const queryParams = new URLSearchParams();
    queryParams.append('teacher', id);
    subjectParams.forEach(s => queryParams.append('subject', s)); // ✅ add all subjects

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

  if (loading) return <p className="p-6 text-center text-gray-500">Loading posts...</p>;
  if (posts.length === 0) return <p className="p-6 text-center text-red-500">No posts found for this teacher.</p>;

  const teacher = posts[0].teacher;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ✅ Go Back to All Teachers */}
      <button
        onClick={() => router.push('/dashboard/student/teachers')}
        className="mb-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Go Back to All Teachers
      </button>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        📚 Posts by {teacher.name}{' '}
        {subjectParams.length > 0 && `(Filtered by ${subjectParams.join(', ')})`}
      </h1>

      <div className="space-y-6">
        {posts.map(post => (
          <div key={post._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold text-gray-800">{post.title}</h2>
            <p className="text-gray-600 mt-2 line-clamp-3">{post.description}</p>

            <div className="flex gap-2 mt-4 flex-wrap text-sm text-blue-700">
              {post.subjects?.map((s, i) => (
                <span key={i} className="bg-blue-100 px-2 py-0.5 rounded-full">#{s}</span>
              ))}
            </div>

            <div className="text-sm text-gray-500 mt-2">
              ৳ {post.hourlyRate} / hr | 📍 {post.location}
            </div>

            <div className="mt-4">
              <Link href={`/dashboard/posts/${post._id}?teacherId=${teacher._id}`}>
                <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
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
