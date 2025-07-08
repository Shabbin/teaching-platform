'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { deleteTeacherPost } from '../../../redux/teacherPostSlice';

const ViewPostDetails = ({ post }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const user = useSelector((state) => state.user);
  const userInfo = user?.userInfo || {};
  const userId = userInfo?.id || userInfo?._id;
  const userRole = userInfo?.role;

  const fallbackTeacher = post.teacher || {
    _id: userId,
    name: userInfo?.name || 'Unnamed',
    profileImage: userInfo?.profileImage || '',
    location: userInfo?.location || '',
  };

  const teacherId = post.teacher?._id || userId;
  const isOwner = userRole === 'teacher' && String(userId) === String(teacherId);

  const getImageUrl = (img) =>
    !img || img.trim() === ''
      ? '/default-profile.png'
      : img.startsWith('http')
      ? img
      : `http://localhost:5000/${img}`;

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

  const handleGoBack = () => {
    router.push('/dashboard/teacher/post-content');
  };

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

  // ✅ Extract YouTube video ID
  const extractYouTubeId = (url) => {
    const match = url.match(
      /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=)([^#&?]*).*/
    );
    return match && match[1].length === 11 ? match[1] : null;
  };

  const youtubeId = post.youtubeLink ? extractYouTubeId(post.youtubeLink) : null;

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
          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="mb-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            aria-label="Go back to posts list"
          >
            ← Go Back
          </button>

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

          {/* ✅ YouTube Embed */}
          {youtubeId && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Intro Video</h3>
              <iframe
                className="w-full aspect-video rounded-md border"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="Intro Video"
                allowFullScreen
              />
            </div>
          )}

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
        </main>
      </div>
    </div>
  );
};

export default ViewPostDetails;




//................................................
// The code component below is an outstanding one
//.................................................

// 'use client';

// import { useSelector, useDispatch } from 'react-redux';
// import { useRouter } from 'next/navigation';
// import Image from 'next/image';
// import Link from 'next/link';
// import { useState } from 'react';
// import { deleteTeacherPost } from '../../../redux/teacherPostSlice';

// const PostDetails = ({ post }) => {
//   const dispatch = useDispatch();
//   const router = useRouter();
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState(null);

//   const user = useSelector((state) => state.user);
//   const userInfo = user?.userInfo || {};
//   const userId = userInfo?.id || userInfo?._id;
//   const userRole = userInfo?.role;

//   if (!post) {
//     return <p className="p-6 text-center text-gray-500">Loading post...</p>;
//   }

//   const fallbackTeacher = post.teacher || {
//     _id: userId,
//     name: userInfo?.name || 'Unnamed',
//     profileImage: userInfo?.profileImage || '',
//     location: userInfo?.location || '',
//   };

//   const teacherId = post.teacher?._id || userId;
//   const isOwner = userRole === 'teacher' && userId && String(userId) === String(teacherId);

//   const getTeacherImageUrl = (image) => {
//     if (!image || image.trim() === '') return '/default-profile.png';
//     return image.startsWith('http') ? image : `http://localhost:5000/${image}`;
//   };

//   const handleDelete = async () => {
//     if (!confirm('Are you sure you want to delete this post?')) return;
//     setSaving(true);
//     setError(null);

//     try {
//       const result = await dispatch(deleteTeacherPost(post._id));
//       if (deleteTeacherPost.fulfilled.match(result)) {
//         router.push('/dashboard/teacher/post-content');
//       } else {
//         setError(result.payload || 'Failed to delete post');
//       }
//     } catch (err) {
//       setError(err.message || 'Something went wrong');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 relative max-w-7xl mx-auto p-6">
//       {/* Go Back Button */}
//       <button
//         onClick={() => router.push('/dashboard/teacher/post-content')}
//         className="mb-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
//         aria-label="Go back"
//       >
//         ← Go Back
//       </button>

//       <div className="flex flex-col lg:flex-row gap-8">
//         {/* Sidebar Teacher Info */}
//         <div className="hidden lg:block sticky top-8 bg-white rounded-xl p-6 shadow-lg flex flex-col items-center w-64">
//           <div className="w-40 h-40 rounded-full overflow-hidden">
//             <Image
//               src={getTeacherImageUrl(fallbackTeacher?.profileImage)}
//               alt={fallbackTeacher?.name || 'Teacher'}
//               width={160}
//               height={160}
//               className="object-cover w-full h-full"
//             />
//           </div>
//           <div className="mt-4 text-center text-gray-700 text-base space-y-1">
//             <div className="font-semibold text-gray-800">
//               {fallbackTeacher?.name || 'Unnamed Teacher'}
//             </div>
//             <div className="text-sm text-gray-500">
//               📍 {post?.location || fallbackTeacher?.location || 'Unknown'}
//             </div>
//             <div className="text-sm text-yellow-500">★★★★☆ (12 reviews)</div>
//           </div>
//         </div>

//         {/* Post Content */}
//         <div className="flex-1 space-y-6">
//           <h1 className="text-4xl font-bold text-gray-800">{post.title}</h1>

//           <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
//             {post.description}
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-base">
//             <div className="bg-gray-100 rounded-lg p-3">
//               <span className="font-semibold">Subjects:</span><br />
//               <span className="text-gray-600">{post.subjects?.join(', ')}</span>
//             </div>
//             <div className="bg-gray-100 rounded-lg p-3">
//               <span className="font-semibold">Location:</span><br />
//               <span className="text-gray-600">{post.location}</span>
//             </div>
//             <div className="bg-gray-100 rounded-lg p-3">
//               <span className="font-semibold">Language:</span><br />
//               <span className="text-gray-600">{post.language}</span>
//             </div>
//             <div className="bg-gray-100 rounded-lg p-3">
//               <span className="font-semibold">Hourly Rate:</span><br />
//               <span className="text-gray-600">{post.hourlyRate} BDT/hr</span>
//             </div>
//           </div>

//           {post.youtubeLink && (
//             <div>
//               <h3 className="text-lg font-semibold text-gray-800 mb-2">Intro Video</h3>
//               <iframe
//                 className="w-full aspect-video rounded-md border"
//                 src={`https://www.youtube.com/embed/${extractYouTubeId(post.youtubeLink)}`}
//                 title="Intro Video"
//                 allowFullScreen
//               />
//             </div>
//           )}

//           {error && <p className="text-red-600">{error}</p>}

//           {/* Footer Actions */}
//           <div className="flex justify-end gap-4 pt-4">
//             {isOwner ? (
//               <>
//                 <Link href={`/dashboard/posts/${post._id}/edit?from=view`}>
//                   <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
//                     ✏️ Edit Post
//                   </button>
//                 </Link>
//                 <button
//                   onClick={handleDelete}
//                   disabled={saving}
//                   className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
//                 >
//                   {saving ? 'Deleting...' : '🗑 Delete Post'}
//                 </button>
//               </>
//             ) : (
//               <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                 📩 Request Tuition
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Helper to extract YouTube video ID from full link
// function extractYouTubeId(url) {
//   // Simple regex to extract id
//   const regExp =
//     /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=)([^#&?]*).*/;
//   const match = url.match(regExp);
//   return match && match[1].length === 11 ? match[1] : '';
// }

// export default PostDetails;


