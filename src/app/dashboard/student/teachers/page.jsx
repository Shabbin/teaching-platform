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

  // Fetch all tags from all posts
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
      console.error('Failed to fetch tags:', err);
    }
  };

  // Fetch all posts based on filters
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

  // Group unique teachers from posts
  const teacherMap = new Map();

  posts.forEach(post => {
    const tId = post.teacher._id;
    const currentSubjects = teacherMap.get(tId)?.subjects || new Set();

    const filteredSubjects = selectedTags.length > 0
      ? post.subjects.filter(s => selectedTags.some(tag => tag.value === s))
      : post.subjects;

    if (filteredSubjects.length === 0) return;

    if (!teacherMap.has(tId)) {
      teacherMap.set(tId, {
        teacher: post.teacher,
        subjects: new Set(filteredSubjects),
        hourlyRate: post.hourlyRate,
        location: post.location,
        language: post.language,
      });
    } else {
      filteredSubjects.forEach(subj => currentSubjects.add(subj));
      teacherMap.get(tId).subjects = currentSubjects;
    }
  });

  const teachers = Array.from(teacherMap.values());

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">🎓 Browse Available Teachers</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters */}
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

        {/* Teacher Cards */}
        <div className="w-full lg:w-3/4">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow p-6 flex gap-6">
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
            <p className="text-red-500">No matching teachers found.</p>
          ) : (
            <div className="space-y-6">
              {teachers.map(({ teacher, subjects, hourlyRate, location, language }) => (
                <div
                  key={teacher._id}
                  className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition"
                >
                  <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
                    <Avatar
                      alt={teacher.name}
                      src={teacher.profileImage}
                      sx={{ width: 80, height: 80 }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xl font-semibold text-gray-800">{teacher.name}</h3>
                        <div className="text-sm text-blue-600 font-semibold">৳{hourlyRate} / hr</div>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">📍 {location}</p>
                      <p className="text-sm text-gray-500 mb-2">💬 {language || 'Language not specified'}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[...subjects].map((subj, i) => (
                          <span key={i} className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">
                            #{subj}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={
                          selectedTags.length > 0
  ? `/teachers/${teacher._id}/posts?${selectedTags.map(tag => `subject=${encodeURIComponent(tag.value)}`).join('&')}`
  : `/teachers/${teacher._id}/posts`
                        }
                      >
                        <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                          View Posts
                        </button>
                      </Link>
                    </div>
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

export default ViewTeachers;
