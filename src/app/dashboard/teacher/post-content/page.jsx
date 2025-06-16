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
  const [expandedPostIds, setExpandedPostIds] = useState(new Set());

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/posts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : data.posts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const toggleSelectPost = (id) => {
    setSelectedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectAll(next.size === posts.length);
      return next;
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

  const handleDeleteSelected = async () => {
    if (!selectedPosts.size) return alert('No posts selected.');
    if (!confirm(`Delete ${selectedPosts.size} posts?`)) return;
    setDeletingMultiple(true);
    try {
      await Promise.all(
        Array.from(selectedPosts).map((id) =>
          fetch(`http://localhost:5000/api/posts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })
        )
      );
      setPosts((prev) => prev.filter((p) => !selectedPosts.has(p._id)));
      setSelectedPosts(new Set());
      setSelectAll(false);
      setExpandedPostIds(new Set()); // close all expanded on delete
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingMultiple(false);
    }
  };

  const toggleExpandPost = (id) => {
    setExpandedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const shortDesc = (t) => {
    if (!t) return '';
    return t.length > 100 ? t.slice(0, 100) + '…' : t;
  };

  return (
    <div className="w-full p-4">
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {/* Desktop */}
      <div className="hidden md:flex gap-4">
        <div className="w-1/3 max-h-[80vh] overflow-y-auto pr-2 space-y-3">
          <div className="flex justify-between items-center mb-2 px-2">
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
                {deletingMultiple ? 'Deleting...' : `Delete (${selectedPosts.size})`}
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-gray-500">No posts.</p>
          ) : (
            posts.map((post) => {
              const isExpanded = expandedPostIds.has(post._id);
              return (
                <div
                  key={post._id}
                  className="bg-white border border-gray-200 rounded-md shadow-sm"
                >
                  <div
                    className="flex items-center justify-between px-4 py-2 font-semibold text-sm cursor-pointer select-none"
                    onClick={() => toggleExpandPost(post._id)}
                  >
                    <label
                      className="flex items-center gap-2 min-w-0 cursor-pointer"
                      onClick={(e) => e.stopPropagation()} // prevent toggle on checkbox click
                    >
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post._id)}
                        onChange={() => toggleSelectPost(post._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 cursor-pointer"
                      />
                      <span className="truncate">{post.title}</span>
                    </label>
                    <span className="select-none text-gray-400" aria-hidden="true">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-3 text-sm text-gray-600 space-y-1">
                      <p>{shortDesc(post.description)}</p>
                      <Link
                        href={`/dashboard/posts/${post._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View Full Post
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="w-2/3">
          <CreatePostForm />
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-4">
        <div className="bg-base-100 border border-base-300 rounded-md">
          <div className="font-semibold flex justify-between px-4 py-2 cursor-pointer select-none">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
              <span>📚 My Posts</span>
            </label>
            {selectedPosts.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deletingMultiple}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deletingMultiple ? 'Deleting...' : `Delete (${selectedPosts.size})`}
              </button>
            )}
          </div>

          <div className="px-4 pb-3 space-y-2">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="text-sm text-gray-500">No posts.</p>
            ) : (
              posts.map((post) => {
                const isExpanded = expandedPostIds.has(post._id);
                return (
                  <div key={post._id} className="bg-white border border-gray-200 rounded-md">
                    <div
                      className="flex justify-between items-center px-3 py-2 text-sm cursor-pointer select-none"
                      onClick={() => toggleExpandPost(post._id)}
                    >
                      <label
                        className="flex items-center gap-2 min-w-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPosts.has(post._id)}
                          onChange={() => toggleSelectPost(post._id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="truncate">{post.title}</span>
                      </label>
                      <span className="select-none text-gray-400">{isExpanded ? '−' : '+'}</span>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-3 text-gray-600 text-sm space-y-1">
                        <p>{shortDesc(post.description)}</p>
                        <Link href={`/dashboard/posts/${post._id}`} className="text-blue-600">
                          View Full Post
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-base-100 border border-base-300 rounded-md">
          <div className="font-semibold flex justify-between px-4 py-2 cursor-pointer select-none">
            <span>➕ Create New Post</span>
          </div>
          <div className="px-4 pb-3">
            <CreatePostForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostContentPage;
