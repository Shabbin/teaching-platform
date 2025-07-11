// 'use client';

// import Image from 'next/image';

// const StudentPostDetails = ({ post }) => {
//   const getTeacherImageUrl = (image) => {
//     if (!image || image.trim() === '') return '/default-profile.png';
//     return image.startsWith('http') ? image : `http://localhost:5000/${image}`;
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 relative">
//       <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-start gap-8 p-6">
        
//         {/* Profile Image Sidebar */}
//         <div className="hidden lg:block absolute left-8 top-8 z-10">
//           <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center w-64">
//             <div className="w-40 h-40 rounded-full overflow-hidden">
//               <Image
//                 src={getTeacherImageUrl(post.teacher?.profileImage)}
//                 alt="Teacher"
//                 width={160}
//                 height={160}
//                 className="object-cover w-full h-full"
//               />
//             </div>
//             <div className="mt-4 text-center text-gray-700 text-base space-y-1">
//               <div className="font-semibold text-gray-800">{post.teacher?.name}</div>
//               <div className="text-sm text-gray-500">📍 {post.location}</div>
//             </div>
//           </div>
//         </div>

//         {/* Post Content */}
//         <div className="w-full lg:pl-64 space-y-6">
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
//                 src={`https://www.youtube.com/embed/${post.youtubeLink}`}
//                 title="YouTube video"
//                 allowFullScreen
//               />
//             </div>
//           )}

//           {/* Student-specific button */}
//           <div className="flex justify-end pt-6">
//             <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base">
//               📩 Request Session
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StudentPostDetails;
