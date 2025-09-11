// src/app/dashboard/posts/[id]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ViewPostDetails from '../../student/components/viewPostDetails';
import API, { videoUrlFromStoredPath } from '../../../../api/axios'; // keep for legacy fallback

const PostDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // render after client mount to avoid flat 0:00 video glitches
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Normalize the video field to a playable URL (Cloudinary-first, legacy fallback)
  const resolveVideoField = (data) => {
    if (!data || !data.videoFile) return data;

    const vf = data.videoFile;
    // If the backend already saved a full Cloudinary URL, keep it.
    if (typeof vf === 'string' && /^https?:\/\//i.test(vf)) {
      return data;
    }
    // Legacy relative path -> turn into absolute URL your browser can fetch
    return { ...data, videoFile: videoUrlFromStoredPath(vf) };
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await API.get(`/posts/${id}`, { withCredentials: true });
        const normalized = resolveVideoField(data);
        if (!cancelled) setPost(normalized);
      } catch (err) {
        console.error(err);
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!mounted) return null;
  if (loading) return <p className="p-6 text-center text-gray-500">Loading post...</p>;
  if (!post) return <p className="p-6 text-center text-red-500">Post not found.</p>;

  // Force remount of video section when source changes (prevents stale <video> state)
  const viewKey = `${post._id}-${post.videoFile || ''}-${post.youtubeLink || ''}`;

  return <ViewPostDetails key={viewKey} post={post} />;
};

export default PostDetailPage;
