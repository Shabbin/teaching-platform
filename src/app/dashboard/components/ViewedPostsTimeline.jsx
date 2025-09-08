'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostViewEvents, fetchPostById } from '../../redux/postViewEventSlice';
import DOMPurify from 'isomorphic-dompurify';
import { Eye } from 'lucide-react';
import { videoUrlFromStoredPath } from '../../../api/axios';

export default function ViewedPostsTimeline() {
  const dispatch = useDispatch();

  const userInfo = useSelector((state) => state.user.userInfo);
  const isFetched = useSelector((state) => state.user.isFetched);

  // ▶️ FIX: read both id and _id (after login it’s often `id`)
  const teacherId = userInfo?.id || userInfo?._id;

  const { events = [], posts = {}, loading, error } = useSelector(
    (state) => state.postViewEvents
  );

  const viewedPostsRef = useRef(new Set());

  // bootstrap fetch once we know who the user is
  useEffect(() => {
    if (!isFetched) return;
    if (!teacherId) return; // logged in user not teacher or not hydrated yet
    if (events.length === 0 && !loading && !error) {
      dispatch(fetchPostViewEvents(teacherId));
    }
  }, [isFetched, teacherId, events.length, loading, error, dispatch]);

  // fetch full post details for the posts we got events for
  useEffect(() => {
    if (loading || error || events.length === 0) return;
    events.forEach((event) => {
      const postIdKey =
        typeof event.postId === 'object'
          ? event.postId._id?.toString() || JSON.stringify(event.postId)
          : event.postId;

      if (!posts[postIdKey]) {
        dispatch(fetchPostById(postIdKey));
      }
    });
  }, [events, posts, loading, error, dispatch]);

  // remember which posts appeared
  useEffect(() => {
    if (!teacherId || events.length === 0) return;
    events.forEach((event) => {
      const postIdKey =
        typeof event.postId === 'object'
          ? event.postId._id?.toString() || JSON.stringify(event.postId)
          : event.postId;
      if (!viewedPostsRef.current.has(postIdKey)) {
        viewedPostsRef.current.add(postIdKey);
      }
    });
  }, [events, teacherId]);

  // group events by post (use createdAt from timestamps as fallback)
  const groupedEvents = useMemo(() => {
    const map = new Map();

    events.forEach((event) => {
      const postIdKey =
        typeof event.postId === 'object'
          ? event.postId._id?.toString() || JSON.stringify(event.postId)
          : event.postId;

      if (!map.has(postIdKey)) {
        map.set(postIdKey, {
          postId: postIdKey,
          totalViews: 0,
          latestEventId: event._id || null,
          latestViewedAt: event.viewedAt || event.createdAt || null, // ▶️ fallback
        });
      }

      const existing = map.get(postIdKey);
      existing.totalViews += 1;

      const when = event.viewedAt || event.createdAt || null;
      if (when && (!existing.latestViewedAt || new Date(when) > new Date(existing.latestViewedAt))) {
        existing.latestViewedAt = when;
        existing.latestEventId = event._id || null;
      }
    });

    return Array.from(map.values());
  }, [events]);

  const renderVideo = (post) => {
    if (post.youtubeLink) {
      const match = post.youtubeLink.match(
        /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=)([^#&?]*).*/
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

  // UI states
  if (!isFetched) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 text-lg font-semibold">
        Loading user data...
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 text-lg font-semibold">
        Please log in to see viewed posts.
      </div>
    );
  }

  if (loading && groupedEvents.length === 0) {
    return <p className="text-gray-600 text-center text-lg py-20">Loading viewed posts...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center text-lg py-20">Error: {error}</p>;
  }

  if (groupedEvents.length === 0) {
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
