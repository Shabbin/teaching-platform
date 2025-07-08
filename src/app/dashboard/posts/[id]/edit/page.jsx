'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import EditPostForm from '../../../../dashboard/teacher/components/EditPostForms';

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [post, setPost] = useState(null);
  const [educationTree, setEducationTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Check if navigated from view page
  const fromView = searchParams.get('from') === 'view';

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      setLoading(true);
      setFetchError(null);
      try {
        const postRes = await fetch(`http://localhost:5000/api/posts/${id}`);
        if (!postRes.ok) throw new Error('Post not found');
        const postData = await postRes.json();

        const treeRes = await fetch('http://localhost:5000/api/education-tree');
        if (!treeRes.ok) throw new Error('Failed to load education tree');
        const treeData = await treeRes.json();

        setPost(postData);
        setEducationTree(treeData);
      } catch (err) {
        setFetchError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) return <p className="p-6 text-center text-gray-500">Loading post data...</p>;
  if (fetchError) return <p className="p-6 text-center text-red-600">{fetchError}</p>;
  if (!post) return <p className="p-6 text-center">No post found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      {/* Go Back Button */}
      <button
        onClick={() =>
          fromView
            ? router.push(`/dashboard/posts/${id}`) // back to view page
            : router.push('/dashboard/teacher/post-content') // back to posts list
        }
        className="mb-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        aria-label="Go back"
      >
        ← Go Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Edit Post: {post.title}</h1>
      <EditPostForm
        post={post}
        postId={id}
        educationTree={educationTree}
        onSuccess={() => router.push(`/dashboard/posts/${id}`)}
      />
    </div>
  );
}
