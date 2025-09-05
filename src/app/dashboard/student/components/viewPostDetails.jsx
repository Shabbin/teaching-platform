'use client';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, ArrowLeft, Eye, Users } from 'lucide-react';
import TuitionRequestModal from './tuitionRequestComponent';
import TopicHelpModal from './topicHelpModal';
import { updatePostViewsCount } from '../../../redux/postViewEventSlice';
import DOMPurify from 'isomorphic-dompurify';
import API, { videoUrlFromStoredPath, API_BASE_URL_LOG } from '../../../../api/axios';

// ✅ tiny API helpers
import { canTopicHelp } from '../../../../api/tuition';
import { getTopicCredits, startTopicPack } from '../../../../api/payments';

const ViewPostDetails = ({ post }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const dummyEnrollments = 3;

  const [showTuitionModal, setShowTuitionModal] = useState(false);
  const [showTopicHelpModal, setShowTopicHelpModal] = useState(false);

  // spinner for the topic-help gate
  const [topicGateLoading, setTopicGateLoading] = useState(false);

  const user = useSelector((state) => state.user);
  const userInfo = user?.userInfo || {};
  const userId = userInfo?.id || userInfo?._id;
  const userRole = userInfo?.role;

  // Prevent double-fire in StrictMode
  const firedRef = useRef(false);

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
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${img}`;

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

  // Increment views once on mount for non-owners
  useEffect(() => {
    const pid = post?._id;
    if (!pid) return;
    if (isOwner) return;
    if (firedRef.current) return;

    firedRef.current = true;

    (async () => {
      try {
        const res = await API.post(`/posts/${pid}/view`, {}, { withCredentials: true });
        const data = res.data;
        if (typeof data?.viewsCount === 'number') {
          dispatch(updatePostViewsCount({ postId: pid, viewsCount: data.viewsCount }));
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err.message;
        if (msg === 'View already counted recently') return;
        console.warn('[view-track] failed:', msg);
      }
    })();
  }, [post?._id, userRole, isOwner, dispatch]);

  // Pull viewsCount from Redux if available, else fallback
  const viewsCount = useSelector(
    (state) => state.postViewEvents.posts[post._id]?.viewsCount ?? post.viewsCount ?? 0
  );

  const handleRequestSuccess = (requestId) => {
    setShowTuitionModal(false);
    setShowTopicHelpModal(false);
    if (requestId) router.push(`/messenger/${requestId}`);
  };

  // 👉 helper: remove specified query params from current URL (no reload)
  const removeParams = (keys) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    keys.forEach((k) => url.searchParams.delete(k));
    router.replace(url.pathname + (url.search ? url.search : ''), { scroll: false });
  };

  // ✅ handle return from payment (Topic Pack + Tuition)
  useEffect(() => {
    const paid = searchParams.get('paid');
    const type = searchParams.get('type'); // "TOPIC_PACK_10" or "TUITION"

    if (paid === '1' && type && type.startsWith('TOPIC_PACK')) {
      (async () => {
        try {
          const { topicCredits } = await getTopicCredits(userId);
          if ((topicCredits ?? 0) > 0) {
            setShowTopicHelpModal(true);
          }
        } catch (e) {
          console.warn('refresh credits after return failed:', e?.message || e);
        } finally {
          removeParams(['paid', 'type', 'tran_id', 'amt', 'status', 'phase', 'month']);
        }
      })();
    }

    if (paid === '1' && type === 'TUITION') {
      // optional: show a quick confirmation (or trigger any post-payment refresh)
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert('✅ Tuition payment successful. You can proceed with classes.');
      }
      removeParams(['paid', 'type', 'tran_id', 'amt', 'status', 'phase', 'month']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, userId]);

  // ==============================
  // Ask-for-Topic-Help flow
  // ==============================
  const handleAskTopicHelp = async () => {
    setError(null);
    if (!userId) {
      return router.push('/login');
    }
    setTopicGateLoading(true);
    try {
      // 1) Server gate: disallow if connected/paid with this teacher
      const gate = await canTopicHelp({ studentId: userId, teacherId });
      if (!gate.allow) {
        setError(gate.reason || 'Topic help is not allowed with this teacher.');
        return;
      }

      // 2) Ensure user has credits; if not, prompt to buy and open SSLCOMMERZ
      const { topicCredits } = await getTopicCredits(userId);
      if ((topicCredits ?? 0) < 1) {
        const buy = confirm('You need topic credits. Buy 10 credits for ৳400 now?');
        if (buy) {
          // include the exact page we’re on so the backend can bounce us back here
          const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
          const { url } = await startTopicPack({
            studentId: userId,
            orderId: 'TP-' + Date.now(),
            returnUrl: currentUrl,
          });
           // open gateway in new tab
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        return; // user will come back with ?paid=1&type=TOPIC_PACK_10...
      }

      // 3) Already has credits — open the compose modal
      setShowTopicHelpModal(true);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to start topic help');
    } finally {
      setTopicGateLoading(false);
    }
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
              <video controls>
                <source src={videoUrlFromStoredPath(post.videoFile)} type="video/mp4" />
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
          <div
            className="text-gray-700 text-lg leading-relaxed whitespace-pre-line prose prose-slate max-w-4xl"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.description || '', { USE_PROFILES: { html: true } }),
            }}
          />

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {Object.entries(entries).map(
              ([label, value]) =>
                value && (
                  <div
                    key={label}
                    className="bg-white rounded-xl p-5 shadow hover:shadow-md transition-shadow duration-300 border border-gray-100"
                  >
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
                {/* Request Tuition */}
                <button
                  onClick={() => setShowTuitionModal(true)}
                  className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 font-semibold rounded-2xl shadow-sm hover:bg-indigo-600 hover:text-white transition duration-300 flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Request Tuition
                </button>

                {/* Ask for Topic Help */}
                <button
                  onClick={handleAskTopicHelp}
                  disabled={topicGateLoading}
                  className="px-6 py-3 bg-white text-emerald-600 border-2 border-emerald-600 font-semibold rounded-2xl shadow-sm hover:bg-emerald-600 hover:text-white transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <BookOpen size={18} /> {topicGateLoading ? 'Checking…' : 'Ask for Topic Help'}
                </button>
              </div>
            )}
          </div>

          {showTuitionModal && (
            <TuitionRequestModal
              teacherId={teacherId}
              postId={post._id}
              // 👇 pass current page so the modal can forward it in startTuition({ returnUrl })
              returnUrl={typeof window !== 'undefined' ? window.location.href : ''}
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








// 'use client';
// import { useSelector, useDispatch } from 'react-redux';
// import { useRouter, useSearchParams } from 'next/navigation';
// import Image from 'next/image';
// import Link from 'next/link';
// import { useState, useEffect, useRef } from 'react';
// import { Send, BookOpen, ArrowLeft, Eye, Users } from 'lucide-react';
// import TuitionRequestModal from './tuitionRequestComponent';
// import TopicHelpModal from './topicHelpModal';
// import { updatePostViewsCount } from '../../../redux/postViewEventSlice';
// import DOMPurify from 'isomorphic-dompurify';
// import API, { videoUrlFromStoredPath, API_BASE_URL_LOG } from '../../../api/axios'; // adjust path if needed

// const ViewPostDetails = ({ post }) => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const dispatch = useDispatch();

//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState(null);
//   const dummyEnrollments = 3;

//   const [showTuitionModal, setShowTuitionModal] = useState(false);
//   const [showTopicHelpModal, setShowTopicHelpModal] = useState(false);

//   const user = useSelector((state) => state.user);
//   const userInfo = user?.userInfo || {};
//   const userId = userInfo?.id || userInfo?._id;
//   const userRole = userInfo?.role;

//   // Prevent double-fire in StrictMode
//   const firedRef = useRef(false);

//   const teacherIdFromQuery = searchParams.get('teacherId');
//   const fallbackTeacher = post.teacher || {
//     _id: userId,
//     name: userInfo?.name || 'Unnamed',
//     profileImage: userInfo?.profileImage || '',
//     location: userInfo?.location || '',
//   };

//   const teacherId = post.teacher?._id || teacherIdFromQuery || userId;
//   const isOwner = userRole === 'teacher' && String(userId) === String(teacherId);

//   const getImageUrl = (img) =>
//     !img || img.trim() === ''
//       ? '/default-avatar.png'
//       : img.startsWith('http')
//       ? img
//       : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${img}`;

//   const handleGoBack = () => {
//     if (userRole === 'teacher') {
//       router.push('/dashboard/teacher/post-content');
//     } else if (teacherIdFromQuery) {
//       router.push(`/teachers/${teacherIdFromQuery}/posts`);
//     } else {
//       router.back();
//     }
//   };

//   const extractYouTubeId = (url) => {
//     const match = url.match(
//       /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=)([^#&?]*).*/
//     );
//     return match && match[1].length === 11 ? match[1] : null;
//   };

//   const youtubeId = post.youtubeLink ? extractYouTubeId(post.youtubeLink) : null;

//   const entries = {
//     'Education System': post.educationSystem,
//     Board: post.board,
//     Group: post.group,
//     Level: post.level,
//     'Sub-Level': post.subLevel,
//     Subjects: post.subjects?.join(', '),
//     Location: post.location,
//     Language: post.language,
//     'Hourly Rate': post.hourlyRate ? `${post.hourlyRate} BDT/hr` : '',
//     Tags: post.tags?.join(', '),
//   };

//   // ✅ Increment views once on mount for non-owners (no AbortController)
//   useEffect(() => {
//     const pid = post?._id;
//     console.log('[view-track] axios baseURL:', API_BASE_URL_LOG);
//     console.log('[view-track] postId:', pid);
//     console.log('[view-track] userRole:', userRole, 'isOwner:', isOwner, 'firedRef:', firedRef.current);

//     if (!pid) return;
//     if (isOwner) return;          // owners shouldn't increment
//     if (firedRef.current) return; // avoid duplicate in StrictMode

//     firedRef.current = true;

//     (async () => {
//       try {
//         const res = await API.post(`/posts/${pid}/view`, {}, { withCredentials: true });
//         const data = res.data;
//         console.log('[view-track] success:', data);
//         if (typeof data?.viewsCount === 'number') {
//           dispatch(updatePostViewsCount({ postId: pid, viewsCount: data.viewsCount }));
//         }
//       } catch (err) {
//         const msg = err?.response?.data?.message || err.message;
//         console.warn('[view-track] failed:', msg);
//         // If backend says it's recently counted, that's fine (no-op)
//         if (msg === 'View already counted recently') return;
//       }
//     })();
//   }, [post?._id, userRole, isOwner, dispatch]);

//   // ✅ Pull viewsCount from Redux if available, else fallback
//   const viewsCount = useSelector(
//     (state) => state.postViewEvents.posts[post._id]?.viewsCount ?? post.viewsCount ?? 0
//   );

//   const handleRequestSuccess = (requestId) => {
//     setShowTuitionModal(false);
//     setShowTopicHelpModal(false);
//     if (requestId) router.push(`/messenger/${requestId}`);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 relative">
//       <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-6">
//         {/* Sidebar */}
//         <aside className="hidden lg:block w-64 sticky top-6 self-start">
//           <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-center border border-gray-200">
//             <div className="w-40 h-40 rounded-full overflow-hidden flex-shrink-0">
//               <Image
//                 src={getImageUrl(fallbackTeacher.profileImage)}
//                 alt={fallbackTeacher.name}
//                 width={160}
//                 height={160}
//                 className="object-cover w-full h-full"
//               />
//             </div>
//             <div className="mt-4 text-center text-gray-700 text-base space-y-1">
//               <div className="font-semibold text-gray-900">{fallbackTeacher.name || 'Unnamed Teacher'}</div>
//               <div className="text-sm text-gray-500">📍 {post.location || fallbackTeacher.location || 'Unknown'}</div>
//               <div className="text-sm text-yellow-500">★★★★☆ (12 reviews)</div>
//             </div>
//           </div>
//         </aside>

//         {/* Main */}
//         <main className="flex-1 space-y-8 lg:pl-8">
//           <div className="flex gap-4 flex-wrap items-center">
//             <button
//               onClick={handleGoBack}
//               className="mb-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-full shadow-md hover:opacity-90 transition-all duration-200 flex items-center gap-2 text-lg"
//             >
//               <ArrowLeft size={18} /> Go Back
//             </button>
//           </div>

//           {/* Video Section */}
//           <div className="w-full max-w-3xl mx-auto overflow-hidden rounded-xl border border-gray-200 shadow-sm mb-6">
//             {youtubeId ? (
//               <iframe
//                 className="w-full aspect-video rounded-lg"
//                 src={`https://www.youtube.com/embed/${youtubeId}`}
//                 title="YouTube Video"
//                 allowFullScreen
//               />
//             ) : post.videoFile ? (
//               <video controls>
//                 <source src={videoUrlFromStoredPath(post.videoFile)} type="video/mp4" />
//                 Your browser does not support the video tag.
//               </video>
//             ) : null}
//           </div>

//           {/* Views & Enrollments */}
//           <div className="flex gap-6 mb-6 ml-[70px]">
//             <div className="px-5 py-2 rounded-full font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center gap-2 shadow">
//               <Eye size={18} /> {viewsCount} Views
//             </div>
//             <div className="px-5 py-2 rounded-full font-medium text-white bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-2 shadow">
//               <Users size={18} /> {dummyEnrollments} Enrollments
//             </div>
//           </div>

//           {/* Post Title & Description */}
//           <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">{post.title}</h1>
//           <div
//             className="text-gray-700 text-lg leading-relaxed whitespace-pre-line prose prose-slate max-w-4xl"
//             dangerouslySetInnerHTML={{
//               __html: DOMPurify.sanitize(post.description || '', { USE_PROFILES: { html: true } }),
//             }}
//           />

//           {/* Info Grid */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
//             {Object.entries(entries).map(
//               ([label, value]) =>
//                 value && (
//                   <div
//                     key={label}
//                     className="bg-white rounded-xl p-5 shadow hover:shadow-md transition-shadow duration-300 border border-gray-100"
//                   >
//                     <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
//                     <div className="text-gray-900 text-base mt-2 break-words whitespace-pre-wrap">{value}</div>
//                   </div>
//                 )
//             )}
//           </div>

//           {error && <p className="text-red-600">{error}</p>}

//           {/* Footer Buttons */}
//           <div className="flex justify-end gap-4 pt-6 flex-wrap">
//             {isOwner ? (
//               <>
//                 <Link href={`/dashboard/posts/${post._id}/edit?from=view`}>
//                   <button className="px-6 py-3 bg-white text-[oklch(0.57_0.3_200)] border-2 border-[oklch(0.57_0.3_200)] rounded-xl shadow-md hover:bg-[oklch(0.57_0.25_200)] hover:text-white hover:border-[oklch(0.57_0.25_200)] transition duration-300 flex items-center justify-center font-medium">
//                     Edit Post
//                   </button>
//                 </Link>
//                 <button
//                   onClick={() => alert('Delete not implemented here')}
//                   disabled={saving}
//                   className="px-6 py-3 bg-white text-[oklch(0.63_0.35_30)] border-2 border-[oklch(0.63_0.35_30)] rounded-xl shadow-md hover:bg-[oklch(0.63_0.3_30)] hover:text-white hover:border-[oklch(0.63_0.3_30)] transition duration-300 flex items-center justify-center font-medium disabled:opacity-50"
//                 >
//                   Delete Post
//                 </button>
//               </>
//             ) : (
//               <div className="flex flex-col sm:flex-row gap-4">
//                 <button
//                   onClick={() => setShowTuitionModal(true)}
//                   className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 font-semibold rounded-2xl shadow-sm hover:bg-indigo-600 hover:text-white transition duration-300 flex items-center justify-center gap-2"
//                 >
//                   <Send size={18} /> Request Tuition
//                 </button>

//                 <button
//                   onClick={() => setShowTopicHelpModal(true)}
//                   className="px-6 py-3 bg-white text-emerald-600 border-2 border-emerald-600 font-semibold rounded-2xl shadow-sm hover:bg-emerald-600 hover:text-white transition duration-300 flex items-center justify-center gap-2"
//                 >
//                   <BookOpen size={18} /> Ask for Topic Help
//                 </button>
//               </div>
//             )}
//           </div>

//           {showTuitionModal && (
//             <TuitionRequestModal
//               teacherId={teacherId}
//               postId={post._id}
//               onClose={() => setShowTuitionModal(false)}
//               onSuccess={handleRequestSuccess}
//             />
//           )}

//           {showTopicHelpModal && (
//             <TopicHelpModal
//               teacherId={teacherId}
//               onClose={() => setShowTopicHelpModal(false)}
//               onSuccess={handleRequestSuccess}
//             />
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default ViewPostDetails;
