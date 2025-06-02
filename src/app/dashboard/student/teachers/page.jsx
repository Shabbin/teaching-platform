'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import Select from 'react-select';

const ViewTeachers = () => {
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;

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

  const fetchFilteredPosts = async () => {
    try {
      setLoading(true);
      const cleanedTags = selectedTags.map(opt => opt.value);
      const query = cleanedTags.length
        ? '?' + cleanedTags.map(tag => `subject=${encodeURIComponent(tag)}`).join('&')
        : '';
      const res = await axios.get(`http://localhost:5000/api/posts${query}`);
      setPosts(res.data);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTags();
    fetchFilteredPosts();
  }, []);

  useEffect(() => {
    fetchFilteredPosts();
  }, [selectedTags]);

  const tagOptions = allTags.map(tag => ({
    value: tag,
    label: tag
  }));

  // Pagination
  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = posts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const teachersMap = {};
  currentPosts.forEach(post => {
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
      <h1 className="text-2xl font-bold mb-6 text-gray-800">🎓 Browse Available Teachers</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sticky Filter Sidebar */}
        <div className="w-full lg:w-1/4 lg:sticky top-6 h-fit">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filter Teachers</h2>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Subjects</label>
              <Select
                isMulti
                options={tagOptions}
                value={selectedTags}
                onChange={setSelectedTags}
                placeholder="Select subjects..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Topic (optional)</label>
              <input
                type="text"
                placeholder="Enter a specific topic..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Teachers List */}
        <div className="w-full lg:w-3/4">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : teachers.length === 0 ? (
            <p className="text-red-500">No teachers found with selected filters.</p>
          ) : (
            <>
              <div className="flex flex-col gap-6 mb-6">
                {teachers.map(teacher => (
                  <div key={teacher._id} className="bg-white rounded-2xl shadow p-6 hover:shadow-lg w-full">
                    <div className="flex items-start gap-6">
                      <Image
                        src={teacher.profileImage}
                        alt={teacher.name}
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-blue-100"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-gray-800">{teacher.name}</h3>
                          <div className="text-sm text-blue-600 font-semibold">
                            ৳{teacher.samplePost.hourlyRate} / hour
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{teacher.samplePost.location}</p>
                        <p className="text-gray-600 mb-2 line-clamp-3">{teacher.samplePost.description}</p>

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

                        <Link href={`/teachers/${teacher._id}`}>
                          <button className="mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                            View Profile
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Previous
                </button>
                <span className="text-gray-700 font-semibold">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTeachers;
