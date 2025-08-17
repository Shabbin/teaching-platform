'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Edit3, Trash2, Users, X, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostById } from '../../../../redux/postViewEventSlice'; // adjust path if needed
import DOMPurify from 'isomorphic-dompurify';

export default function MyPostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const dispatch = useDispatch();
  const { posts: postsWithViews } = useSelector((state) => state.postViewEvents);

  // Fetch my posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('http://localhost:5000/api/posts/mine', {
          withCredentials: true,
        });
        setPosts(res.data);

        // Fetch full detail for each post (to populate redux with viewsCount)
        res.data.forEach((post) => {
          dispatch(fetchPostById(post._id));
        });
      } catch (err) {
        if (err.response?.status === 401) {
          setError('You must be logged in to view posts.');
        } else {
          setError(err.message || 'Error fetching posts');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [dispatch]);

  const confirmDelete = (id) => setDeleteTarget(id);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:5000/api/posts/${deleteTarget}`, {
        withCredentials: true,
      });
      setPosts((prev) => prev.filter((post) => post._id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Error deleting post');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Heading chip */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 mb-6">
        <span className="text-sm font-semibold">Manage Your Contents</span>
      </div>

      {error && (
        <p className="text-red-600 mb-4 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading your posts...</p>
      ) : posts.length === 0 ? (
        <div className="bg-white/95 text-center py-10 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-700 text-lg">No posts yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Create your first post to get started 🚀
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {posts.map((post) => {
            const viewsCount = postsWithViews[post._id]?.viewsCount || 0;
            const enrollments = Math.floor(Math.random() * 50) + 1; // dummy enrollments
            const cleanDesc = DOMPurify.sanitize(post.description || '', {
              USE_PROFILES: { html: true },
            });

            return (
              <div
                key={post._id}
                className="group bg-white/95 border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-indigo-200 transition transform hover:-translate-y-0.5 p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Title: dark for readability, turns indigo on hover */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1 transition-colors group-hover:text-indigo-700">
                    {post.title}
                  </h3>

                  {/* Description: sanitized, neutral, clamped */}
                  <div
                    className="text-gray-600 text-sm mb-3 leading-relaxed prose prose-sm max-w-none line-clamp-3 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: cleanDesc }}
                  />

                  <p className="text-xs text-gray-500 mb-3">
                    🎓 {post.educationSystem}{' '}
                    <span className="mx-2 text-gray-300">•</span>
                    📘 Subjects:{' '}
                    <span className="text-indigo-700 font-medium">
                      {post.subjects?.join(', ')}
                    </span>
                  </p>

                  {/* Views + Enrollment Info (with eye icon restored) */}
                  <div className="flex items-center gap-6 text-sm font-medium">
                    <span className="inline-flex items-center gap-1 text-indigo-700">
                      <Eye className="w-4 h-4" /> {viewsCount} Views
                    </span>
                    <span className="inline-flex items-center gap-1 text-indigo-700">
                      <Users className="w-4 h-4" /> {enrollments} Enrolled
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-5">
                  <Link
                    href={`/dashboard/posts/${post._id}`}
                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm px-4 py-2 rounded-full hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    View
                  </Link>

                  <Link
                    href={`/dashboard/posts/${post._id}/edit`}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </Link>

                  <button
                    onClick={() => confirmDelete(post._id)}
                    className="flex items-center gap-2 bg-red-500 text-white text-sm px-4 py-2 rounded-full hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/10">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-sm w-full p-6 relative border border-gray-100">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-full"
              onClick={() => setDeleteTarget(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
