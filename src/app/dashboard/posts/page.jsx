'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import API from '../../api/axios'; // ← adjust the relative path if needed

export default function PostsListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await API.get('/posts/mine', { withCredentials: true });
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading)
    return (
      <p className="p-6 text-center text-gray-500 animate-pulse">
        Loading posts...
      </p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Heading chip with brand color */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 mb-5">
          <span className="text-sm font-semibold">Your Posts</span>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white/95 border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-700 text-lg">No posts found.</p>
            <p className="text-gray-400 text-sm mt-1">
              Create your first post to get started 🚀
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li
                key={post._id}
                className="bg-white/95 p-5 border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-indigo-200 transition"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 line-clamp-1">
                  {post.title}
                </h2>
                <p className="text-gray-600 text-sm">
                  {(post.description || '').slice(0, 100)}...
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/posts/${post._id}`}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm px-4 py-2 rounded-md hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  >
                    View
                  </Link>

                  <Link
                    href={`/dashboard/posts/${post._id}/edit`}
                    className="inline-flex items-center justify-center text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-sm px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
