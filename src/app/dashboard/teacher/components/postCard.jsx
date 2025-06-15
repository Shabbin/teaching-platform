// components/TeacherPostCard.jsx
'use client';
import Link from 'next/link';

const TeacherPostCard = ({ post }) => {
  return (
    <Link href={`/dashboard/posts/${post._id}`}>
      <div className="border rounded-lg p-4 shadow-md hover:shadow-xl transition">
        <h2 className="text-xl font-semibold">{post.title}</h2>
        <p className="text-sm text-gray-600 mb-1">Subject: {post.subjects?.join(', ')}</p>
        <p className="text-sm text-gray-600 mb-1">Location: {post.location}</p>
        <p className="text-sm text-gray-600 mb-1">Language: {post.language}</p>
        <p className="text-sm text-gray-800 mb-1">Rate: {post.hourlyRate} BDT/hr</p>
      </div>
    </Link>
  );
};

export default TeacherPostCard;
