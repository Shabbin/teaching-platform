'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';

const ViewTeachers = () => {
  const [allTags, setAllTags] = useState([]); // preserve all tags
  const [selectedTags, setSelectedTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all available tags only once
  const fetchAllTags = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/posts');
      const tagSet = new Set();
      res.data.forEach(post => {
        if (Array.isArray(post.subjects)) {
          post.subjects.forEach(sub => tagSet.add(sub));
        }
      });
      setAllTags([...tagSet]);
    } catch (err) {
      console.error('Failed to fetch all tags:', err);
    }
  };

  // Fetch filtered posts based on selected tags
  const fetchFilteredPosts = async () => {
    try {
      setLoading(true);
      const query = selectedTags.length
        ? '?' + selectedTags.map(tag => `tag=${encodeURIComponent(tag)}`).join('&')
        : '';
      const res = await axios.get(`http://localhost:5000/api/posts${query}`);
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTags();       // get all tags once
    fetchFilteredPosts(); // initial post load
  }, []);

  useEffect(() => {
    fetchFilteredPosts(); // re-fetch when tags change
  }, [selectedTags]);

  const handleTagClick = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const teachersMap = {};
  posts.forEach(post => {
    const id = post.teacher._id;
    if (!teachersMap[id]) {
      teachersMap[id] = {
        ...post.teacher,
        samplePost: post
      };
    }
  });
  const teachers = Object.values(teachersMap);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">🎓 Browse Available Teachers</h1>

      {/* Filter Tags */}
      <div className="mb-6 flex flex-wrap gap-2">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`px-3 py-1 text-sm rounded-full border transition ${
              selectedTags.includes(tag)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-100'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : teachers.length === 0 ? (
        <p className="text-red-500">No teachers found with selected filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map(teacher => (
            <div key={teacher._id} className="bg-white rounded-2xl shadow p-6 hover:shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={teacher.profileImage}
                  alt={teacher.name}
                  width={70}
                  height={70}
                  className="rounded-full object-cover border-2 border-blue-100"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{teacher.name}</h3>
                  <p className="text-sm text-gray-500">{teacher.samplePost.location}</p>
                </div>
              </div>

              <p className="text-gray-600 mb-2 line-clamp-2">{teacher.samplePost.description}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {teacher.samplePost.subjects.map((subject, i) => (
                  <span
                    key={i}
                    className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full"
                  >
                    #{subject}
                  </span>
                ))}
              </div>

              <div className="text-sm text-blue-600 font-semibold mb-4">
                ৳{teacher.samplePost.hourlyRate} / hour
              </div>

              <Link href={`/teachers/${teacher._id}`}>
                <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
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
