'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import CreatePostWizard from '../components/formComponents/CreatePostWizard'; // Adjust path if needed

const PostContentPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Add new post to state (from wizard)
  const addNewPost = (newPost) => {
    if (!newPost || !newPost._id || !newPost.title) {
      console.warn('New post incomplete:', newPost);
      return;
    }
    setPosts((prev) => [newPost, ...prev]);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use axios with credentials (cookies)
        const res = await axios.get('http://localhost:5000/api/posts/mine', {
          withCredentials: true,
        });
        setPosts(res.data);
      } catch (err) {
        // If 401 Unauthorized, user is probably not logged in
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
  }, []);

  const handleDelete = async (id) => {
    const confirmed = confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`, {
        withCredentials: true,
      });

      setPosts((prev) => prev.filter((post) => post._id !== id));
    } catch (err) {
      if (err.response?.status === 401) {
        alert('You must be logged in to delete posts.');
      } else {
        alert(err.message || 'Error deleting post');
      }
    } finally {
      setDeleting(false);
    }
  };

  const renderPostBox = (post) => (
    <div key={post._id} className="border rounded p-4 shadow bg-white space-y-2">
      <h3 className="text-lg font-semibold">{post.title}</h3>
      <p className="text-sm text-gray-600">{post.description?.slice(0, 120)}...</p>
      <p className="text-xs text-gray-500">
        {post.educationSystem} | Subjects: {post.subjects?.join(', ')}
      </p>

      <div className="flex gap-3 mt-3">
        <Link
          href={`/dashboard/posts/${post._id}`}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View
        </Link>

        <Link
          href={`/dashboard/posts/${post._id}/edit`}
          className="text-sm px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Edit
        </Link>

        <button
          onClick={() => handleDelete(post._id)}
          className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4 space-y-6">
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {/* Wizard to create new post */}
      <CreatePostWizard onPostCreated={addNewPost} />

      {/* Existing posts list */}
      <div className="mt-10 flex flex-col md:flex-row gap-4">
        <div
          className={`md:w-full max-h-[80vh] pr-2 space-y-3 ${
            posts.length > 10
              ? 'overflow-y-hidden hover:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200'
              : 'overflow-y-auto'
          }`}
        >
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-gray-500">No posts found. Create your first one above.</p>
          ) : (
            posts.map((post) => renderPostBox(post))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostContentPage;
