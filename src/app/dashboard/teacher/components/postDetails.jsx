'use client';

import Image from 'next/image';
import Link from 'next/link';

const PostDetails = ({ post }) => {
  const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

  setSaving(true);
  try {
    const result = await dispatch(deleteTeacherPost(id));

    if (deleteTeacherPost.fulfilled.match(result)) {
      router.push('/dashboard/teacher/post-content'); // ✅ Adjust as needed
    } else {
      setError(result.payload || 'Failed to delete post');
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden overflow-y-auto">
      
      {/* Full-width flex container */}
      <div className="flex flex-col lg:flex-row w-full h-full">
        {/* Left: Image + Reviews */}
        <div className="w-full lg:w-1/3 bg-gray-100 flex flex-col items-center justify-center p-8">
          <Image
            src={post.teacherImage || '/default-teacher.png'}
            alt="Teacher"
            width={280}
            height={280}
            className="rounded-lg border object-cover"
          />
          <div className="mt-6 text-center text-gray-700 space-y-1">
            <div className="text-base font-semibold text-gray-800">Rating</div>
            <div className="text-yellow-500 text-xl">★★★★☆</div>
            <div className="text-sm text-gray-600">12 reviews</div>
          </div>
        </div>

        {/* Right: Course Details */}
        <div className="w-full lg:w-2/3 p-8 space-y-6 overflow-y-auto">
          <h1 className="text-4xl font-bold text-gray-800">{post.title}</h1>
          <p className="text-lg text-gray-700 leading-relaxed">{post.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-base">
            <div>
              <span className="font-semibold">Subjects:</span> {post.subjects?.join(', ')}
            </div>
            <div>
              <span className="font-semibold">Location:</span> {post.location}
            </div>
            <div>
              <span className="font-semibold">Language:</span> {post.language}
            </div>
            <div>
              <span className="font-semibold">Hourly Rate:</span> {post.hourlyRate} BDT/hr
            </div>
          </div>

          {post.youtubeLink && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Intro Video</h3>
              <iframe
                className="w-full aspect-video rounded-md border"
                src={`https://www.youtube.com/embed/${post.youtubeLink.split('v=')[1]}`}
                title="YouTube video"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          )}

          <div className="flex justify-end pt-6">
          <Link href={`/dashboard/posts/${post._id}/edit`}>
  <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base">
    Edit Post
  </button>
  
</Link>
<Link href={`/dashboard/teacher/post-content`}>
<button
  type="button"
  onClick={handleDelete}
  className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700"
>
  Delete Post
</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
