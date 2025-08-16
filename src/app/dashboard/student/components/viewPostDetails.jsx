'use client';
import { useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Send, BookOpen, ArrowLeft, Eye, Users } from 'lucide-react';
import TuitionRequestModal from './tuitionRequestComponent';
import TopicHelpModal from './topicHelpModal'; 
import { updatePostViewsCount } from '../../../redux/postViewEventSlice';

function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
function getCookie(name) {
  const cookieString = document.cookie;
  const cookies = cookieString ? cookieString.split('; ') : [];
  for (let i = 0; i < cookies.length; i++) {
    const [cookieName, cookieValue] = cookies[i].split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return undefined;
}

const ViewPostDetails = ({ post }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [viewsCount, setViewsCount] = useState(post.viewsCount || 0);
  const dummyEnrollments = 3; // static for now

  const [showTuitionModal, setShowTuitionModal] = useState(false);
  const [showTopicHelpModal, setShowTopicHelpModal] = useState(false);

  const user = useSelector((state) => state.user);
  const userInfo = user?.userInfo || {};
  const userId = userInfo?.id || userInfo?._id;
  const userRole = userInfo?.role;
  const [hasRecordedView, setHasRecordedView] = useState(false);
  const hasRecordedRef = useRef(false);
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
      ? '/default-avatar.png'
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

  useEffect(() => {
    if (!post?._id) return;
    if (hasRecordedRef.current) return;

    const viewedKey = `viewed_post_${post._id}`;
    if (getCookie(viewedKey)) {
      setHasRecordedView(true);
      hasRecordedRef.current = true;
      return;
    }

    hasRecordedRef.current = true;
    const controller = new AbortController();

    const recordView = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${post._id}/view`, {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.message === "View already counted recently") {
            setHasRecordedView(true);
          } else {
            console.error('Failed to record post view:', data.message || res.status);
          }
        } else {
          setHasRecordedView(true);
          setViewsCount(data.viewsCount);
          setCookie(viewedKey, 'true', 3600);
          dispatch(updatePostViewsCount({ postId: post._id, viewsCount: data.viewsCount }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error recording post view', err);
        }
      }
    };
    recordView();
    return () => controller.abort();
  }, [post._id, dispatch]);

  const handleRequestSuccess = (requestId) => {
    setShowTuitionModal(false);
    setShowTopicHelpModal(false);
    if (requestId) router.push(`/messenger/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 sticky top-6 self-start">
          <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-center border border-gray-200">
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
              <div className="font-semibold text-gray-900">{fallbackTeacher.name || 'Unnamed Teacher'}</div>
              <div className="text-sm text-gray-500">📍 {post.location || fallbackTeacher.location || 'Unknown'}</div>
              <div className="text-sm text-yellow-500">★★★★☆ (12 reviews)</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-8 lg:pl-8">
          <div className="flex gap-4 flex-wrap items-center">
            {/* Go Back button */}
            <button
              onClick={handleGoBack}
              className="mb-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-full shadow-md hover:opacity-90 transition-all duration-200 flex items-center gap-2 text-lg"
            >
              <ArrowLeft size={18} /> Go Back
            </button>
          </div>

          {/* Video Section */}
          <div className="w-full max-w-3xl mx-auto overflow-hidden rounded-xl border border-gray-200 shadow-sm mb-6">
            {youtubeId ? (
              <iframe
                className="w-full aspect-video rounded-lg"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube Video"
                allowFullScreen
              />
            ) : post.videoFile ? (
              <video
                controls
                className="w-full aspect-video rounded-lg"
              >
                <source src={`http://localhost:5000/videos/${post.videoFile.split('/').pop()}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : null}
          </div>

          {/* Views & Enrollments */}
          <div className="flex gap-6 mb-6 ml-[70px]">
            <div className="px-5 py-2 rounded-full font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center gap-2 shadow">
              <Eye size={18} /> {viewsCount} Views
            </div>
            <div className="px-5 py-2 rounded-full font-medium text-white bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-2 shadow">
              <Users size={18} /> {dummyEnrollments} Enrollments
            </div>
          </div>

          {/* Post Title & Description */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">{post.title}</h1>
          <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line prose prose-slate max-w-4xl">
            {post.description}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {Object.entries(entries).map(
              ([label, value]) =>
                value && (
                  <div key={label} className="bg-white rounded-xl p-5 shadow hover:shadow-md transition-shadow duration-300 border border-gray-100">
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
                    <div className="text-gray-900 text-base mt-2 break-words whitespace-pre-wrap">{value}</div>
                  </div>
                )
            )}
          </div>

          {error && <p className="text-red-600">{error}</p>}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-4 pt-6 flex-wrap">
            {isOwner ? (
              <>
                <Link href={`/dashboard/posts/${post._id}/edit?from=view`}>
                  <button className="px-6 py-3 bg-white text-[oklch(0.57_0.3_200)] border-2 border-[oklch(0.57_0.3_200)] rounded-xl shadow-md hover:bg-[oklch(0.57_0.25_200)] hover:text-white hover:border-[oklch(0.57_0.25_200)] transition duration-300 flex items-center justify-center font-medium">
                    Edit Post
                  </button>
                </Link>
                <button
                  onClick={() => alert('Delete not implemented here')}
                  disabled={saving}
                  className="px-6 py-3 bg-white text-[oklch(0.63_0.35_30)] border-2 border-[oklch(0.63_0.35_30)] rounded-xl shadow-md hover:bg-[oklch(0.63_0.3_30)] hover:text-white hover:border-[oklch(0.63_0.3_30)] transition duration-300 flex items-center justify-center font-medium disabled:opacity-50"
                >
                  Delete Post
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
 <button
  onClick={() => setShowTuitionModal(true)}
  className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 font-semibold rounded-2xl shadow-sm hover:bg-indigo-600 hover:text-white transition duration-300 flex items-center justify-center gap-2"
>
  <Send size={18} /> Request Tuition
</button>

<button
  onClick={() => setShowTopicHelpModal(true)}
  className="px-6 py-3 bg-white text-emerald-600 border-2 border-emerald-600 font-semibold rounded-2xl shadow-sm hover:bg-emerald-600 hover:text-white transition duration-300 flex items-center justify-center gap-2"
>
  <BookOpen size={18} /> Ask for Topic Help
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
