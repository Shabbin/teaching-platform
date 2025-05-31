'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';

const ViewTeachers = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/posts')
      .then((res) => {
        setPosts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching posts:', err);
        setLoading(false);
      });
  }, []);

  // Group by unique teacher ID
  const teachersMap = {};
  posts.forEach(post => {
    const id = post.teacher._id;
    if (!teachersMap[id]) {
      teachersMap[id] = {
        ...post.teacher,
        hourlyRate: post.hourlyRate,
        samplePost: post
      };
    }
  });
  const teachers = Object.values(teachersMap);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">🎓 Available Teachers</h1>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <div key={teacher._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center space-x-4">
                <Image
                  src={teacher.profileImage}
                  alt={teacher.name}
                  width={60}
                  height={60}
                  className="rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold">{teacher.name}</h3>
                  <p className="text-sm text-gray-600">{teacher.samplePost.location}</p>
                </div>
              </div>

              <p className="mt-3 text-gray-700 line-clamp-2">{teacher.samplePost.description}</p>
              <p className="text-sm text-blue-600 font-semibold mt-2">
                ৳{teacher.samplePost.hourlyRate}/hr
              </p>

              <Link href={`/teacher/${teacher._id}`}>
                <button className="mt-4 w-full bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700">
                  View Profile
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewTeachers;
