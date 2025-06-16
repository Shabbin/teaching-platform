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
  const [expandedPost, setExpandedPost] = useState(null);

 useEffect(() => {
  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/posts/mine', {
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
      next.has(id) ? next.delete(id) : next.add(id);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingMultiple(false);
    }
  };

  const shortDesc = (t) => {
    if (!t) return '';
    return t.length > 100 ? t.slice(0, 100) + '…' : t;
  };

  const renderPostBox = (post) => (
    <div key={post._id} className="bg-white border border-gray-200 rounded-md shadow-sm">
      <div
        className="flex justify-between items-center px-3 py-2 cursor-pointer"
        onClick={() =>
          setExpandedPost((prev) => (prev === post._id ? null : post._id))
        }
      >
        <span className="text-sm font-medium truncate">{post.title}</span>
        <input
          type="checkbox"
          checked={selectedPosts.has(post._id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSelectPost(post._id)}
        />
      </div>

      <div
        className={`transition-all overflow-hidden text-sm text-gray-600 space-y-1 px-3 ${
          expandedPost === post._id ? 'max-h-40 py-2' : 'max-h-0 py-0'
        }`}
      >
        <p>{shortDesc(post.description)}</p>
        <Link
          href={`/dashboard/posts/${post._id}`}
          className="text-blue-600 hover:underline inline-block"
        >
          ➜ View Full Post
        </Link>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4">
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="flex flex-col md:flex-row gap-4">
        {/* Post List */}
        <div className="md:w-1/3 max-h-[80vh] overflow-y-auto pr-2 space-y-3">
          <div className="flex justify-between items-center mb-2 px-2">
            <label className="flex items-center gap-2">
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
            posts.map((post) => renderPostBox(post))
          )}
        </div>

        {/* Create Post Form Without Wrapper */}
        <div className="md:w-2/3">
          <CreatePostForm />
        </div>
      </div>
    </div>
  );
};

export default PostContentPage;
