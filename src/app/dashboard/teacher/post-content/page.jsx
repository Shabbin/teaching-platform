

'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CreatePostForm from '../components/postForm';
const PostContentPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

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

  const handleDeleteSelected = async () => {
    if (selectedPosts.size === 0) return alert('No posts selected.');
    if (!confirm(`Are you sure you want to delete ${selectedPosts.size} post(s)?`)) return;

    setDeletingMultiple(true);
    setError(null);

    try {
      const deletePromises = Array.from(selectedPosts).map(async (id) => {
        const res = await fetch(`http://localhost:5000/api/posts/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || `Failed to delete post ${id}`);
        }
        return id;
      });

      await Promise.all(deletePromises);
      setPosts((prev) => prev.filter((post) => !selectedPosts.has(post._id)));
      setSelectedPosts(new Set());
      setSelectAll(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingMultiple(false);
    }
  };

  const toggleSelectPost = (id) => {
    setSelectedPosts((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      setSelectAll(newSet.size === posts.length);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPosts(new Set());
      setSelectAll(false);
    } else {
      setSelectedPosts(new Set(posts.map((p) => p._id)));
      setSelectAll(true);
    }
  };

  return (
    <div className="w-full p-4">
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {/* 📱 Mobile View */}
      <div className="md:hidden space-y-4">
        <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-md">
          <input type="checkbox" id="mobile-my-posts" className="peer" />
          <label htmlFor="mobile-my-posts" className="collapse-title peer-checked:bg-base-200 font-semibold text-base flex items-center gap-2 cursor-pointer">
            📚 My Posts
          </label>
          <div className="collapse-content">
            {posts.length > 0 && (
              <div className="flex justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                  Select All
                </label>
                {selectedPosts.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    disabled={deletingMultiple}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingMultiple ? 'Deleting...' : `Delete Selected (${selectedPosts.size})`}
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="text-sm text-gray-500">No posts found.</p>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedPosts.has(post._id)}
                      onChange={() => toggleSelectPost(post._id)}
                    />
                    <div>
                      <p className="font-semibold truncate">{post.title}</p>
                      <Link href={`/dashboard/posts/${post._id}`} className="text-blue-600 text-xs hover:underline">
                        ➜ View
                      </Link>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

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
        <div className="md:w-1/3 max-h-[80vh] overflow-y-auto pr-1 space-y-3">
          <h2 className="font-bold text-lg flex items-center gap-1">📚 My Posts</h2>

          {posts.length > 0 && (
            <div className="flex justify-between mb-3 px-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
                Select All
              </label>
              {selectedPosts.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deletingMultiple}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingMultiple
                    ? 'Deleting...'
                    : `Delete Selected (${selectedPosts.size})`}
                </button>
              )}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-gray-500">No posts found.</p>
          ) : (
            posts.map((post, index) => (
              <div key={post._id} className="collapse collapse-arrow bg-white border border-gray-200 rounded-md shadow-sm">
                <input type="checkbox" className="peer hidden" id={`desktop-post-${index}`} />
                <label
                  htmlFor={`desktop-post-${index}`}
                  className="collapse-title peer-checked:bg-gray-100 font-semibold text-sm md:text-base truncate cursor-pointer flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedPosts.has(post._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectPost(post._id);
                    }}
                    className="cursor-pointer"
                  />
                  {post.title}
                </label>
                <div className="collapse-content text-sm text-gray-600 space-y-2">
                  <p><strong>Description:</strong> {post.description || 'N/A'}</p>
                  <p><strong>Subjects:</strong> {Array.isArray(post.subjects) ? post.subjects.join(', ') : 'N/A'}</p>
                  <p><strong>Location:</strong> {post.location || 'N/A'}</p>
                  <p><strong>Mode:</strong> {post.mode || 'N/A'}</p>
                  <p><strong>Hourly Rate:</strong> {post.hourlyRate ? `৳${post.hourlyRate}` : 'N/A'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Link href={`/dashboard/posts/${post._id}`} className="text-blue-600 hover:underline">
                      ➜ View Full Post
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="md:w-2/3">
          <CreatePostForm />
        </div>
      </div>
    </div>
  );
};

export default PostContentPage;
