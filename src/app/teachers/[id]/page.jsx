'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import API, { absUrl } from '../../../api/axios'; // ← env-driven axios (adjust path if needed)

const TeacherProfilePage = () => {
  const { id } = useParams();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    API.get(`/teachers/${id}/profile`)
      .then((res) => {
        setTeacherData(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch teacher profile:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6">Loading profile...</p>;
  if (!teacherData || !teacherData.teacher)
    return <p className="p-6 text-red-600">Teacher not found</p>;

  const { teacher, posts = [] } = teacherData;

  const profileImg = teacher.profileImage
    ? absUrl(String(teacher.profileImage).replace(/\\/g, '/'))
    : '/default-avatar.png';

  const skills = Array.isArray(teacher.skills)
    ? teacher.skills
    : (typeof teacher.skills === 'string' && teacher.skills.split(',').map(s => s.trim()).filter(Boolean)) || [];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 space-y-8">

        {/* Profile Header */}
        <div className="flex items-center gap-6">
          <Image
            src={profileImg}
            alt={teacher.name || 'Teacher Profile'}
            width={90}
            height={90}
            className="rounded-full object-cover border"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{teacher.name}</h1>
            <p className="text-gray-600">{teacher.email}</p>
            <p className="text-sm text-gray-500">📍 {teacher.location || 'Location not provided'}</p>
          </div>
        </div>

        {/* Bio */}
        {teacher.bio && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">🧾 Bio</h2>
            <p className="text-gray-700 leading-relaxed">{teacher.bio}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">🧠 Skills</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tuition Posts */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">📚 Tuition Posts</h2>
          {posts.length === 0 ? (
            <p className="text-gray-500">No posts available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="border border-gray-200 bg-gray-50 p-5 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                    {typeof post.description === 'string' ? post.description : ''}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {(Array.isArray(post.subjects) ? post.subjects : (post.subject ? [post.subject] : []))
                      .map((subj, idx) => (
                        <span
                          key={`${post._id}-subj-${idx}`}
                          className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                        >
                          {subj}
                        </span>
                      ))}
                  </div>

                  <div className="mt-3 text-sm space-y-1 text-gray-700">
                    {post.hourlyRate != null && (
                      <p><strong>Rate:</strong> ৳{post.hourlyRate}/hr</p>
                    )}
                    {post.language && <p><strong>Language:</strong> {post.language}</p>}
                    {post.mode && <p><strong>Mode:</strong> {post.mode}</p>}
                  </div>
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
