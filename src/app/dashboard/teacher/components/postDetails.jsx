'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { deleteTeacherPost } from '../../../redux/teacherPostSlice';

const PostDetails = ({ post }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const router = useRouter();

  // ✅ Get profile image from Redux userSlice
  const profileImage = useSelector((state) => state.user.profileImage);

  const getTeacherImageUrl = (image) => {
    if (!image || image.trim() === '') return '/SHABBU.jpg';
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
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-start gap-8 p-6">
        
        {/* Floating Badge Style Image */}
        <div className="hidden lg:block absolute left-8 top-8 z-10">
          <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center w-64">
          <div className="w-40 h-40 rounded-full overflow-hidden">
  <Image
    src={getTeacherImageUrl(profileImage)}
    alt="Teacher"
    width={160}
    height={160}
    className="object-cover w-full h-full"
  />
</div>

            <div className="mt-4 text-center text-gray-700 text-base space-y-1">
              <div className="font-semibold text-gray-800">Rating</div>
              <div className="text-yellow-500 text-xl">★★★★☆</div>
              <div className="text-sm text-gray-500">12 reviews</div>
            </div>
          </div>
        </div>

        {/* Details Section - Full Width */}
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

          {post.youtubeLink && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Intro Video</h3>
              <iframe
                className="w-full aspect-video rounded-md border"
                src={`https://www.youtube.com/embed/${post.youtubeLink}`}
                title="YouTube video"
               
                allowFullScreen
              />
            </div>
          )}

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <Link href={`/dashboard/posts/${post._id}/edit`}>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base">
                Edit Post
              </button>
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Deleting...' : 'Delete Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
