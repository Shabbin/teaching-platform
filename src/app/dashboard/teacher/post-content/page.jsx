'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CreatePostWizard from '../components/formComponents/CreatePostWizard'; // Make sure path is correct

const PostContentPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [error, setError] = useState(null); // ✅ This line is important
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const addNewPost = (newPost) => {
    if (!newPost || !newPost._id || !newPost.title) {
      console.warn('New post incomplete:', newPost);
      return;
    }
    setPosts((prev) => [newPost, ...prev]);
  };

  // ...your fetch, delete, etc.

  return (
    <div className="w-full p-4 space-y-6">
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {/* Wizard goes here */}
      <CreatePostWizard onPostCreated={addNewPost} />

      {/* Existing Post List */}
      <div className="mt-10 flex flex-col md:flex-row gap-4">
        <div
          className={`md:w-full max-h-[80vh] pr-2 space-y-3
            ${
              posts.length > 10
                ? 'overflow-y-hidden hover:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200'
                : 'overflow-y-auto'
            }
          `}
        >
       
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-gray-500">No posts.</p>
          ) : (
            posts.map((post) => renderPostBox(post))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostContentPage;
