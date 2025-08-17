'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, StarBorder } from '@mui/icons-material';
import DOMPurify from 'isomorphic-dompurify';

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
    subjectParams.forEach((s) => queryParams.append('subject', s));

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

  // Dummy ratings/reviews (replace with backend data if available)
  const rating = teacher.rating || Math.floor(Math.random() * 5) + 1;
  const reviews = teacher.reviews || Math.floor(Math.random() * 20) + 1;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Go Back */}
      <button
        onClick={() => router.push('/dashboard/student/teachers')}
        className="mb-8 px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        All Teachers
      </button>

      {/* Teacher Name with Profile Image */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <img
          src={teacher.profileImage || '/default.png'}
          alt={teacher.name}
          className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-indigo-500/60"
        />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-wide text-gray-900">
            <span className="text-gray-900 ">
              {teacher.name}
            </span>
            {subjectParams.length > 0 && (
              <span className="text-indigo-700 font-semibold"> (Filtered by {subjectParams.join(', ')})</span>
            )}
          </h1>

          {/* Ratings */}
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) =>
              i < rating ? (
                <Star key={i} className="text-yellow-400" fontSize="small" />
              ) : (
                <StarBorder key={i} className="text-gray-300" fontSize="small" />
              )
            )}
            <span className="text-sm text-gray-600 ml-2">({reviews} reviews)</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const cleanDesc = DOMPurify.sanitize(post.description || '', {
            USE_PROFILES: { html: true },
          });

          return (
            <div
              key={post._id}
              className="group bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 hover:scale-[1.02] flex flex-col justify-between border border-gray-100 hover:border-indigo-200"
              style={{ minHeight: '360px' }}
            >
              <div>
                {/* Title: dark for readability, turns indigo on hover/focus */}
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 transition-colors group-hover:text-indigo-700">
                  {post.title}
                </h2>

                {/* Description: neutral, clamped to 3 lines; render sanitized HTML */}
                <div
                  className="text-gray-600 leading-relaxed mt-1 prose prose-sm max-w-none line-clamp-3 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: cleanDesc }}
                />

                <div className="flex gap-2 mt-4 flex-wrap text-sm">
                  {post.subjects?.map((s, i) => (
                    <span
                      key={i}
                      className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium ring-1 ring-indigo-100"
                    >
                      #{s}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-gray-500 mt-3 flex justify-between items-center">
                  <span>৳ {post.hourlyRate} / hr</span>
                  <span className="flex items-center gap-1">📍 {post.location}</span>
                </div>

                {/* Views & Enrollments */}
                <div className="text-sm text-gray-700 mt-3 flex justify-between items-center">
                  <span>👁️ {post.viewsCount || 0} views</span>
                  <span>📝 {5} enrollments</span> {/* dummy value */}
                </div>
              </div>

              <div className="mt-5">
                <Link href={`/dashboard/posts/${post._id}?teacherId=${teacher._id}`}>
                  <button
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg
                               hover:shadow-xl hover:from-indigo-700 hover:to-indigo-700 transition transform hover:-translate-y-1 hover:scale-105
                               focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherPostsPage;
