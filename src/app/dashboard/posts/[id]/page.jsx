'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ViewPostDetails from '../../student/components/viewPostDetails';
import API from '../../../api/axios'; // ← adjust path if needed

const PostDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const { data } = await API.get(`/posts/${id}`, { withCredentials: true });
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
