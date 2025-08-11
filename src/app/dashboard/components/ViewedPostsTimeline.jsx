'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostViewEvents, fetchPostById } from '../../redux/postViewEventSlice';

export default function ViewedPostsTimeline() {
  const dispatch = useDispatch();

  const userInfo = useSelector(state => state.user.userInfo);
  const isFetched = useSelector(state => state.user.isFetched);
  const teacherId = userInfo?._id;

  const { events = [], posts = {}, loading, error } = useSelector(state => state.postViewEvents);

  const viewedPostsRef = useRef(new Set());

  useEffect(() => {
    if (!isFetched) return;
    if (!teacherId) return;

    // Only fetch if no events loaded yet to prevent clearing and refetching every mount
    if (events.length === 0 && !loading && !error) {
      dispatch(fetchPostViewEvents(teacherId));
    }
  }, [isFetched, teacherId, dispatch, events.length, loading, error]);

  useEffect(() => {
    if (!loading && !error && events.length > 0) {
      events.forEach(event => {
        const postIdKey =
          typeof event.postId === 'object'
            ? event.postId._id?.toString() || JSON.stringify(event.postId)
            : event.postId;

        if (!posts[postIdKey]) {
          dispatch(fetchPostById(postIdKey));
        }
      });
    }
  }, [events, posts, loading, error, dispatch]);

  useEffect(() => {
    if (teacherId && events.length > 0) {
      events.forEach(event => {
        const postIdKey =
          typeof event.postId === 'object'
            ? event.postId._id?.toString() || JSON.stringify(event.postId)
            : event.postId;

        if (!viewedPostsRef.current.has(postIdKey)) {
          viewedPostsRef.current.add(postIdKey);
        }
      });
    }
  }, [events, teacherId]);

  const groupedEvents = useMemo(() => {
    const map = new Map();

    events.forEach(event => {
      const postIdKey =
        typeof event.postId === 'object'
          ? event.postId._id?.toString() || JSON.stringify(event.postId)
          : event.postId;

      if (!map.has(postIdKey)) {
        map.set(postIdKey, {
          postId: postIdKey,
          totalViews: 0,
          latestEventId: event._id || null,
          latestViewedAt: event.viewedAt || null,
        });
      }

      const existing = map.get(postIdKey);
      existing.totalViews += 1;

      if (
        event.viewedAt &&
        (!existing.latestViewedAt || new Date(event.viewedAt) > new Date(existing.latestViewedAt))
      ) {
        existing.latestViewedAt = event.viewedAt;
        existing.latestEventId = event._id || null;
      }
    });

    return Array.from(map.values());
  }, [events]);

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
    return (
      <p className="text-gray-600 text-center text-lg py-20">Loading viewed posts...</p>
    );
  }

  if (error) {
    return (
      <p className="text-red-600 text-center text-lg py-20">Error: {error}</p>
    );
  }

  if (groupedEvents.length === 0) {
    return (
      <p className="text-gray-600 text-center text-lg py-20">No viewed posts yet.</p>
    );
  }

  return (
    <>
      {groupedEvents.map(({ postId }) => {
        const post = posts[postId];
        if (!post) {
          return (
            <p
              key={`loading-${postId}`}
              className="bg-gray-100 rounded-xl p-4 text-gray-500 text-center text-lg"
            >
              Loading post details...
            </p>
          );
        }

        return (
          <article
            key={post._id}
            className="border-b last:border-b-0 border-gray-300 py-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h3>
            <p className="text-gray-700 mb-2 line-clamp-3">{post.description}</p>
            <div className="flex items-center text-gray-500 text-sm font-medium space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 
                    8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 
                    7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>
                {post.viewsCount || 0} view{(post.viewsCount || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </article>
        );
      })}
    </>
  );
}
