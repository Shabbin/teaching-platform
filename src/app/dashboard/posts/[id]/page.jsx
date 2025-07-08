'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ViewPostDetails from '../../../dashboard/teacher/components/viewPostDetails';

const PostDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${id}`);
        if (!res.ok) throw new Error('Post not found');
        const data = await res.json();
        setPost(data);
      } catch (error) {
        console.error(error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) return <p className="p-6 text-center text-gray-500">Loading post...</p>;
  if (!post) return <p className="p-6 text-center text-red-500">Post not found.</p>;

  return <ViewPostDetails post={post} />;
};

export default PostDetailPage;
