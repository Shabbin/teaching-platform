'use client';
//dashboard\student\components\viewPostDetails.jsx
import { useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import TuitionRequestModal from './tuitionRequestComponent';
import TopicHelpModal from './topicHelpModal'; // import your topic help modal

const ViewPostDetails = ({ post }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [showTuitionModal, setShowTuitionModal] = useState(false);
  const [showTopicHelpModal, setShowTopicHelpModal] = useState(false);

  const user = useSelector((state) => state.user);
  const userInfo = user?.userInfo || {};
  const userId = userInfo?.id || userInfo?._id;
  const userRole = userInfo?.role;
console.log(userInfo)
  const teacherIdFromQuery = searchParams.get('teacherId');
  const fallbackTeacher = post.teacher || {
    _id: userId,
    name: userInfo?.name || 'Unnamed',
    profileImage: userInfo?.profileImage || '',
    location: userInfo?.location || '',
  };

  const teacherId = post.teacher?._id || teacherIdFromQuery || userId;
  const isOwner = userRole === 'teacher' && String(userId) === String(teacherId);

  const getImageUrl = (img) =>
    !img || img.trim() === ''
      ? '/default-profile.png'
      : img.startsWith('http')
      ? img
      : `http://localhost:5000/${img}`;

  const handleGoBack = () => {
    if (userRole === 'teacher') {
      router.push('/dashboard/teacher/post-content');
    } else if (teacherIdFromQuery) {
      router.push(`/teachers/${teacherIdFromQuery}/posts`);
    } else {
      router.back();
    }
  };

  const extractYouTubeId = (url) => {
    const match = url.match(
      /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=)([^#&?]*).*/
    );
    return match && match[1].length === 11 ? match[1] : null;
  };

  const youtubeId = post.youtubeLink ? extractYouTubeId(post.youtubeLink) : null;

  const entries = {
    'Education System': post.educationSystem,
    Board: post.board,
    Group: post.group,
    Level: post.level,
    'Sub-Level': post.subLevel,
    Subjects: post.subjects?.join(', '),
    Location: post.location,
    Language: post.language,
    'Hourly Rate': post.hourlyRate ? `${post.hourlyRate} BDT/hr` : '',
    Tags: post.tags?.join(', '),
  };

 const handleRequestSuccess = (requestId) => {
  setShowTuitionModal(false);
  setShowTopicHelpModal(false);

  if (requestId) {
    router.push(`/messenger/${requestId}`);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-6">
        {/* Sidebar: Teacher Info */}
        <aside className="hidden lg:block w-64 sticky top-6 self-start">
          <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center">
            <div className="w-40 h-40 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={getImageUrl(fallbackTeacher.profileImage)}
                alt={fallbackTeacher.name}
                width={160}
                height={160}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="mt-4 text-center text-gray-700 text-base space-y-1">
              <div className="font-semibold text-gray-800">
                {fallbackTeacher.name || 'Unnamed Teacher'}
              </div>
              <div className="text-sm text-gray-500">
                📍 {post.location || fallbackTeacher.location || 'Unknown'}
              </div>
              <div className="text-sm text-yellow-500">★★★★☆ (12 reviews)</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6 lg:pl-8">
          {/* Top Navigation */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleGoBack}
              className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              aria-label="Go back to posts list"
            >
              ← Go Back
            </button>

            {!isOwner && (
              <button
                onClick={() => router.push('/dashboard/student/teachers')}
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                🎓 All Teachers
              </button>
            )}
          </div>

          {/* YouTube at Top */}
          {youtubeId && (
            <div>
              <iframe
                className="w-full aspect-video rounded-md border mb-6"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="Intro Video"
                allowFullScreen
              />
            </div>
          )}

          <h1 className="text-4xl font-bold text-gray-800">{post.title}</h1>

          <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
            {post.description}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(entries).map(
              ([label, value]) =>
                value && (
                  <div key={label} className="bg-gray-100 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-600">{label}</div>
                    <div className="text-base text-gray-800 mt-1 break-words whitespace-pre-wrap">
                      {value}
                    </div>
                  </div>
                )
            )}
          </div>

          {error && <p className="text-red-600">{error}</p>}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            {isOwner ? (
              <>
                <Link href={`/dashboard/posts/${post._id}/edit?from=view`}>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    ✏️ Edit Post
                  </button>
                </Link>
                <button
                  onClick={() => alert('Delete not implemented here')}
                  disabled={saving}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : '🗑 Delete Post'}
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <button
                  onClick={() => setShowTuitionModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📩 Request Tuition
                </button>
                <button
                  onClick={() => setShowTopicHelpModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📩 Ask for Topic Help
                </button>
              </div>
            )}
          </div>

          {showTuitionModal && (
            <TuitionRequestModal
              teacherId={teacherId}
              postId={post._id}
              onClose={() => setShowTuitionModal(false)}
              onSuccess={handleRequestSuccess}
            />
          )}

          {showTopicHelpModal && (
            <TopicHelpModal
              teacherId={teacherId}
              onClose={() => setShowTopicHelpModal(false)}
              onSuccess={handleRequestSuccess}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ViewPostDetails;
