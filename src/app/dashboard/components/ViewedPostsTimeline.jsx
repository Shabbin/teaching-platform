'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostViewEvents, fetchPostById } from '../../redux/postViewEventSlice';
import DOMPurify from 'isomorphic-dompurify';
import { Eye } from 'lucide-react';
import { videoUrlFromStoredPath } from '../../../api/axios';

export default function ViewedPostsTimeline() {
  const dispatch = useDispatch();

  const userInfo  = useSelector((state) => state.user.userInfo);
  const isFetched = useSelector((state) => state.user.isFetched);

  // 🔧 FIX: support either `_id` or `id` (some sessions return `id`)
  const rawTeacherId = userInfo?._id || userInfo?.id;
  const teacherId = rawTeacherId ? String(rawTeacherId) : null;

  const { events = [], posts = {}, loading, error } = useSelector(
    (state) => state.postViewEvents
  );

  // --- guards to avoid refetch loops when result is empty
  const fetchedOnceRef = useRef(false);
  const lastTeacherRef = useRef(null);

  // fetch once per teacher after auth is ready
  useEffect(() => {
    if (!isFetched || !teacherId) return;

    if (lastTeacherRef.current !== teacherId) {
      lastTeacherRef.current = teacherId;
      fetchedOnceRef.current = false; // new user → allow one fetch
    }

    if (!fetchedOnceRef.current) {
      fetchedOnceRef.current = true;
      dispatch(fetchPostViewEvents(teacherId));
    }
  }, [isFetched, teacherId, dispatch]);

  // lazily fetch full post details for any events we have
  useEffect(() => {
    if (loading || error || events.length === 0) return;
    for (const event of events) {
      const postIdKey =
        typeof event.postId === 'object'
          ? event.postId._id?.toString() || JSON.stringify(event.postId)
          : event.postId;
      if (!posts[postIdKey]) {
        dispatch(fetchPostById(postIdKey));
      }
    }
  }, [events, posts, loading, error, dispatch]);

  // group by postId
  const groupedEvents = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      const postIdKey =
        typeof event.postId === 'object'
          ? event.postId._id?.toString() || JSON.stringify(event.postId)
          : event.postId;

      if (!map.has(postIdKey)) {
        map.set(postIdKey, {
          postId: postIdKey,
          totalViews: 0,
          latestEventId: event._id || null,
          latestViewedAt: event.viewedAt || event.createdAt || null,
        });
      }
      const existing = map.get(postIdKey);
      existing.totalViews += 1;

      const evTime = event.viewedAt || event.createdAt;
      if (evTime && (!existing.latestViewedAt || new Date(evTime) > new Date(existing.latestViewedAt))) {
        existing.latestViewedAt = evTime;
        existing.latestEventId = event._id || null;
      }
    }
    return Array.from(map.values());
  }, [events]);

  const renderVideo = (post) => {
    if (post.youtubeLink) {
      const match = post.youtubeLink.match(
        /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=)([^#&?]*).*/
      );
      const youtubeId = match && match[1]?.length === 11 ? match[1] : null;
      if (youtubeId) {
        return (
          <iframe
            className="w-full max-w-[400px] aspect-video rounded-lg mt-2"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={post.title}
            allowFullScreen
          />
        );
      }
    }
    if (post.videoFile) {
      return (
        <video controls className="w-full max-w-[400px] aspect-video rounded-lg mt-2">
          <source src={videoUrlFromStoredPath(post.videoFile)} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }
    return null;
  };

  // --- UI states
  if (!isFetched) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 text-lg font-semibold">
        Loading user data...
      </div>
    );
  }

  // Only show “Please log in” after auth is fetched AND there’s no id in either field
  if (!teacherId) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 text-lg font-semibold">
        Please log in to see viewed posts.
      </div>
    );
  }

  if (loading && events.length === 0) {
    return (
      <p className="text-gray-600 text-center text-lg py-20">Loading viewed posts...</p>
    );
  }

  if (error) {
    return <p className="text-red-600 text-center text-lg py-20">Error: {error}</p>;
  }

  if (events.length === 0) {
    return <p className="text-gray-600 text-center text-lg py-20">No viewed posts yet.</p>;
  }

  return (
    <div className="space-y-4">
      {groupedEvents.map(({ postId }) => {
        const post = posts[postId];
        if (!post) {
          return (
            <p
              key={`loading-${postId}`}
              className="bg-gray-100 rounded-xl p-6 text-gray-500 text-center text-lg animate-pulse"
            >
              Loading post details...
            </p>
          );
        }

        const cleanDesc = DOMPurify.sanitize(post.description || '', {
          USE_PROFILES: { html: true },
        });

        return (
          <article
            key={post._id}
            className="bg-white/95 shadow-sm rounded-2xl p-6 border border-gray-100 cursor-default"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
            {renderVideo(post)}
            <div
              className="text-gray-700 mb-4 mt-4 line-clamp-3 prose prose-sm max-w-none overflow-hidden"
              dangerouslySetInnerHTML={{ __html: cleanDesc }}
            />
            <div className="flex items-center text-sm font-medium">
              <span className="inline-flex items-center gap-1 text-indigo-700">
                <Eye className="w-4 h-4" />
                {post.viewsCount || 0} view{(post.viewsCount || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
