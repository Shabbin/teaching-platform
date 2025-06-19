'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { deleteTeacherPost } from '../../../redux/teacherPostSlice';

const PostDetails = ({ post }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const user = useSelector((state) => state.user);
  const userInfo = user?.userInfo || {};
  const userId = userInfo?.id || userInfo?._id;
  const userRole = userInfo?.role;

  console.log('userRole:', userRole);
  console.log('userId:', userId);
  console.log('teacher:', post.teacher);

  if (!post) {
    return <p className="p-6 text-center text-gray-500">Loading post...</p>;
  }

  // Fallback teacher info for teacher dashboard (post.teacher may be undefined)
  const fallbackTeacher = post.teacher || {
    _id: userId,
    name: userInfo?.name || 'Unnamed',
    profileImage: userInfo?.profileImage || '',
    location: userInfo?.location || '',
  };

  // Ownership check
  const teacherId = post.teacher?._id || userId;
  const isOwner = userRole === 'teacher' && userId && String(userId) === String(teacherId);

  const getTeacherImageUrl = (image) => {
    if (!image || image.trim() === '') return '/default-profile.png';
    return image.startsWith('http') ? image : `http://localhost:5000/${image}`;
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setSaving(true);
    setError(null);

    try {
      const result = await dispatch(deleteTeacherPost(post._id));
      if (deleteTeacherPost.fulfilled.match(result)) {
        router.push('/dashboard/teacher/post-content');
      } else {
        setError(result.payload || 'Failed to delete post');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-6">
        {/* Sidebar Teacher Info */}
        <div className="hidden lg:block absolute left-8 top-8 z-10">
          <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center w-64">
            <div className="w-40 h-40 rounded-full overflow-hidden">
              <Image
                src={getTeacherImageUrl(fallbackTeacher?.profileImage)}
                alt={fallbackTeacher?.name || 'Teacher'}
                width={160}
                height={160}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="mt-4 text-center text-gray-700 text-base space-y-1">
              <div className="font-semibold text-gray-800">
                {fallbackTeacher?.name || 'Unnamed Teacher'}
              </div>
              <div className="text-sm text-gray-500">
                📍 {post?.location || fallbackTeacher?.location || 'Unknown'}
              </div>
              <div className="text-sm text-yellow-500">★★★★☆ (12 reviews)</div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="w-full lg:pl-64 space-y-6">
          <h1 className="text-4xl font-bold text-gray-800">{post.title}</h1>

          <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
            {post.description}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-base">
            <div className="bg-gray-100 rounded-lg p-3">
              <span className="font-semibold">Subjects:</span><br />
              <span className="text-gray-600">{post.subjects?.join(', ')}</span>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <span className="font-semibold">Location:</span><br />
              <span className="text-gray-600">{post.location}</span>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <span className="font-semibold">Language:</span><br />
              <span className="text-gray-600">{post.language}</span>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <span className="font-semibold">Hourly Rate:</span><br />
              <span className="text-gray-600">{post.hourlyRate} BDT/hr</span>
            </div>
          </div>

          {/* YouTube Video (if any) */}
          {post.youtubeLink && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Intro Video</h3>
              <iframe
                className="w-full aspect-video rounded-md border"
                src={`https://www.youtube.com/embed/${post.youtubeLink}`}
                title="Intro Video"
                allowFullScreen
              />
            </div>
          )}

          {/* Error Display */}
          {error && <p className="text-red-600">{error}</p>}

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-4">
            {isOwner ? (
              <>
                <Link href={`/dashboard/posts/${post._id}/edit`}>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    ✏️ Edit Post
                  </button>
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : '🗑 Delete Post'}
                </button>
              </>
            ) : (
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                📩 Request Tuition
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
