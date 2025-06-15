'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PostDetails from './../../teacher/components/postDetails'; // ✅ updated relative path

const PostDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
console.log('postId:', id);
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${id}`);
        if (!res.ok) throw new Error('Post not found or server error');
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  if (loading) {
    return <div className="animate-pulse h-40 bg-gray-200 rounded-lg m-4"></div>;
  }

  if (!post) {
    return <p className="text-center mt-8 text-red-500">Post not found or failed to load.</p>;
  }

  return (
    <div className="">
      <PostDetails post={post} />
    </div>
  );
};

export default PostDetailPage;
