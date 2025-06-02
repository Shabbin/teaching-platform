'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';

const TeacherProfilePage = () => {
  const { id } = useParams();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    axios.get(`http://localhost:5000/api/teachers/${id}/profile`)
      .then((res) => {
        setTeacherData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch teacher profile:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="p-6">Loading profile...</p>;

  if (!teacherData) return <p className="p-6 text-red-600">Teacher not found</p>;

  const { teacher, posts } = teacherData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 space-y-6">

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <Image
            src={teacher.profileImage || '/default-profile.png'}
            alt={teacher.name}
            width={80}
            height={80}
            className="rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold">{teacher.name}</h1>
            <p className="text-gray-600 text-sm">{teacher.email}</p>
            <p className="text-sm text-gray-500">📍 {teacher.location || 'Location not provided'}</p>
          </div>
        </div>

        {/* Bio */}
        {teacher.bio && (
          <div>
            <h2 className="text-lg font-semibold">🧾 Bio</h2>
            <p className="text-gray-700 mt-1">{teacher.bio}</p>
          </div>
        )}

        {/* Skills */}
        {teacher.skills && teacher.skills.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold">🧠 Skills</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              {teacher.skills.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        <div>
          <h2 className="text-lg font-semibold">📚 Tuition Posts</h2>
          {posts.length === 0 ? (
            <p className="text-sm text-gray-500 mt-1">No posts available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {posts.map((post) => (
                <div key={post._id} className="border p-4 rounded shadow-sm bg-gray-50">
                  <h3 className="text-lg font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{post.description}</p>
                  <p className="text-sm mt-2"><strong>Subjects:</strong> {post.subjects.join(', ')}</p>

                  <p className="text-sm"><strong>Rate:</strong> ৳{post.hourlyRate}/hr</p>
                  <p className="text-sm"><strong>Language:</strong> {post.language}</p>
                  <p className="text-sm"><strong>Mode:</strong> {post.location}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TeacherProfilePage;
