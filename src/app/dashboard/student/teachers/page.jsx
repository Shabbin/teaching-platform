'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Select from 'react-select';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';

const ViewTeachers = () => {
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [mode, setMode] = useState('');
  const [minPay, setMinPay] = useState('');
  const [maxPay, setMaxPay] = useState('');
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
      const queryParams = [];

      cleanedTags.forEach(tag => queryParams.push(`subject=${encodeURIComponent(tag)}`));
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      if (location) queryParams.push(`location=${encodeURIComponent(location)}`);
      if (mode) queryParams.push(`mode=${encodeURIComponent(mode)}`);
      if (minPay) queryParams.push(`minPay=${minPay}`);
      if (maxPay) queryParams.push(`maxPay=${maxPay}`);

      const query = queryParams.length ? `?${queryParams.join('&')}` : '';
      const res = await axios.get(`http://localhost:5000/api/posts${query}`);
      setPosts(res.data);
      setCurrentPage(1);
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
  }, [selectedTags, searchQuery, location, mode, minPay, maxPay]);

  const tagOptions = allTags.map(tag => ({ value: tag, label: tag }));

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
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">🎓 Browse Available Teachers</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter Sidebar */}
        <div className="w-full lg:w-1/4 lg:sticky top-6 h-fit">
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">🔍 Filter Teachers</h2>

            <input
              type="text"
              placeholder="Search by name or topic..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
              <Select
                isMulti
                options={tagOptions}
                value={selectedTags}
                onChange={setSelectedTags}
                placeholder="Select subjects..."
              />
            </div>

            <input
              type="text"
              placeholder="Location"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />

            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={mode}
              onChange={e => setMode(e.target.value)}
            >
              <option value="">All Modes</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min Pay"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                value={minPay}
                onChange={e => setMinPay(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max Pay"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                value={maxPay}
                onChange={e => setMaxPay(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Teachers Display */}
        <div className="w-full lg:w-3/4">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 20 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow p-6 w-full flex items-start gap-6">
                  <Skeleton variant="circular" width={80} height={80} />
                  <div className="flex-1 space-y-3">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="90%" />
                    <Skeleton variant="rectangular" height={32} width={100} />
                  </div>
                </div>
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <p className="text-red-500">No teachers found with selected filters.</p>
          ) : (
            <>
              <div className="flex flex-col gap-6 mb-6">
                {teachers.map(teacher => (
                  <div key={teacher._id} className="bg-white rounded-2xl shadow p-6 w-full hover:shadow-lg">
                    <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
                      <Avatar
                        alt={teacher.name}
                        src={teacher.profileImage}
                        sx={{ width: 80, height: 80 }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-gray-800">{teacher.name}</h3>
                          <div className="text-sm text-blue-600 font-semibold">
                            ৳{teacher.samplePost.hourlyRate} / hour
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{teacher.samplePost.location}</p>
                        <p className="text-gray-600 mb-2 line-clamp-3">{teacher.samplePost.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {teacher.samplePost.subjects.map((subj, i) => (
                            <span key={i} className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">
                              #{subj}
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
              <div className="flex justify-center items-center gap-4 flex-wrap">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Previous
                </button>
                <span className="text-gray-700 font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
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
