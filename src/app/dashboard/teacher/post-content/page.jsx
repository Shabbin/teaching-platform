'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CreatePostForm from '../components/postForm';

const PostContentPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState(null); // track which post is deleting
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/posts', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : data.posts || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Delete handler
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    setDeletingPostId(id);
    setError(null);

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete post');
      }

      // Remove post from state to update UI immediately
      setPosts((prev) => prev.filter((post) => post._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <div className="w-full p-4">
      {/* Show error if any */}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {/* 📱 Mobile View */}
      <div className="md:hidden space-y-4">
        {/* Mobile My Posts Accordion */}
        <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-md">
          <input type="checkbox" id="mobile-my-posts" className="peer" />
          <label htmlFor="mobile-my-posts" className="collapse-title peer-checked:bg-base-200 font-semibold text-base flex items-center gap-2 cursor-pointer">
            📚 My Posts
          </label>
          <div className="collapse-content">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="text-sm text-gray-500">No posts found.</p>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold truncate">{post.title}</p>
                      <Link
                        href={`/dashboard/posts/${post._id}`}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        ➜ View
                      </Link>
                    </div>

                    <button
                      onClick={() => handleDelete(post._id)}
                      disabled={deletingPostId === post._id}
                      className="ml-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingPostId === post._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Create Post Accordion */}
        <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-md">
          <input type="checkbox" id="mobile-create-post" className="peer" />
          <label htmlFor="mobile-create-post" className="collapse-title peer-checked:bg-base-200 font-semibold text-base flex items-center gap-2 cursor-pointer">
            ➕ Create New Post
          </label>
          <div className="collapse-content">
            <CreatePostForm />
          </div>
        </div>
      </div>

      {/* 🖥️ Desktop View */}
      <div className="hidden md:flex md:flex-row gap-4">
        {/* Sidebar */}
        <div className="md:w-1/3 max-h-[80vh] overflow-y-auto pr-1 space-y-3">
          <h2 className="font-bold text-lg flex items-center gap-1">📚 My Posts</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-gray-500">No posts found.</p>
          ) : (
            posts.map((post, index) => (
              <div
                key={post._id}
                className="collapse collapse-arrow bg-white border border-gray-200 rounded-md shadow-sm"
              >
                <input
                  type="checkbox"
                  className="peer hidden"
                  id={`desktop-post-${index}`}
                />
                <label
                  htmlFor={`desktop-post-${index}`}
                  className="collapse-title peer-checked:bg-gray-100 font-semibold text-sm md:text-base truncate cursor-pointer"
                >
                  {post.title}
                </label>
                <div className="collapse-content text-sm text-gray-600 space-y-2">
                  <p><strong>Description:</strong> {post.description || 'N/A'}</p>
                  <p><strong>Subjects:</strong> {Array.isArray(post.subjects) ? post.subjects.join(', ') : 'N/A'}</p>
                  <p><strong>Location:</strong> {post.location || 'N/A'}</p>
                  <p><strong>Mode:</strong> {post.mode || 'N/A'}</p>
                  <p><strong>Hourly Rate:</strong> {post.hourlyRate ? `৳${post.hourlyRate}` : 'N/A'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Link
                      href={`/dashboard/posts/${post._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      ➜ View Full Post
                    </Link>
                    <button
                      onClick={() => handleDelete(post._id)}
                      disabled={deletingPostId === post._id}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingPostId === post._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form */}
        <div className="md:w-2/3">
          <CreatePostForm />
        </div>
      </div>
    </div>
  );
};

export default PostContentPage;
