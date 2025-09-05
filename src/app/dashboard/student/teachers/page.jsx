'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Select from 'react-select';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import { Star, StarBorder } from '@mui/icons-material';
import API from '../../../../api/axios'; // ← adjust the relative path if needed

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

  // Indigo-first theme for react-select
  const selectTheme = (theme) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary: '#4F46E5',      // indigo-600
      primary25: '#EEF2FF',    // indigo-50
      primary50: '#E0E7FF',    // indigo-100
      neutral20: '#E5E7EB',
      neutral30: '#A5B4FC',
    },
  });

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#A5B4FC' : '#E5E7EB',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(99,102,241,0.30)' : 'none',
      '&:hover': { borderColor: '#A5B4FC' },
      borderRadius: '0.5rem',
      minHeight: '2.5rem',
    }),
    multiValue: (base) => ({ ...base, backgroundColor: '#EEF2FF', borderRadius: '9999px' }),
    multiValueLabel: (base) => ({ ...base, color: '#4338CA', fontWeight: 500 }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#6366F1',
      ':hover': { backgroundColor: '#E0E7FF', color: '#4338CA' },
      borderRadius: '9999px',
    }),
    option: (base, state) => ({ ...base, fontWeight: state.isSelected ? 600 : 400 }),
  };

  // Normalize image (support relative paths coming from backend)
  const imgUrl = (src) => {
    if (!src) return '';
    return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${src}`;
  };

  const fetchAllTags = async () => {
    try {
      const { data } = await API.get('/posts'); // env-driven
      const tagSet = new Set();
      data.forEach((post) => {
        if (Array.isArray(post.subjects)) {
          post.subjects.forEach((sub) => tagSet.add(sub));
        }
      });
      setAllTags([...tagSet]);
    } catch (err) {
      console.error('Failed to fetch tags:', err?.response?.data || err.message);
    }
  };

  const fetchFilteredPosts = async () => {
    try {
      setLoading(true);
      const cleanedTags = selectedTags.map((opt) => opt.value);
      const queryParams = [];

      cleanedTags.forEach((tag) => queryParams.push(`subject=${encodeURIComponent(tag)}`));
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      if (location) queryParams.push(`location=${encodeURIComponent(location)}`);
      if (mode) queryParams.push(`mode=${encodeURIComponent(mode)}`);
      if (minPay) queryParams.push(`minPay=${minPay}`);
      if (maxPay) queryParams.push(`maxPay=${maxPay}`);

      const query = queryParams.length ? `?${queryParams.join('&')}` : '';
      const { data } = await API.get(`/posts${query}`); // env-driven
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTags();
    fetchFilteredPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchFilteredPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags, searchQuery, location, mode, minPay, maxPay]);

  const tagOptions = allTags.map((tag) => ({ value: tag, label: tag }));

  // Build teacher cards from posts
  const teacherMap = new Map();
  posts.forEach((post) => {
    const tId = post.teacher?._id;
    if (!tId) return;

    const currentSubjects = teacherMap.get(tId)?.subjects || new Set();
    const filteredSubjects =
      selectedTags.length > 0
        ? post.subjects.filter((s) => selectedTags.some((tag) => tag.value === s))
        : post.subjects;

    if (!filteredSubjects || filteredSubjects.length === 0) return;

    if (!teacherMap.has(tId)) {
      teacherMap.set(tId, {
        teacher: post.teacher,
        subjects: new Set(filteredSubjects),
        hourlyRate: post.hourlyRate,
        location: post.location,
        // Dummy ratings/reviews
        rating: Math.floor(Math.random() * 5) + 1,
        reviews: Math.floor(Math.random() * 20) + 1,
      });
    } else {
      filteredSubjects.forEach((subj) => currentSubjects.add(subj));
      teacherMap.get(tId).subjects = currentSubjects;
    }
  });

  // Convert Map to array and sort by rating descending
  const teachers = Array.from(teacherMap.values()).sort((a, b) => b.rating - a.rating);

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters */}
        <div className="w-full lg:w-1/4 lg:sticky top-6 h-fit">
          <div className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100">
              <span className="text-sm font-semibold">🔍 Filter Teachers</span>
            </div>

            <input
              type="text"
              placeholder="Search by name or topic..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
              <Select
                isMulti
                options={tagOptions}
                value={selectedTags}
                onChange={setSelectedTags}
                placeholder="Select subjects..."
                theme={selectTheme}
                styles={selectStyles}
              />
            </div>

            <input
              type="text"
              placeholder="Location"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min Pay"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                value={minPay}
                onChange={(e) => setMinPay(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max Pay"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                value={maxPay}
                onChange={(e) => setMaxPay(e.target.value)}
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
              {teachers.map(({ teacher, subjects, hourlyRate, location, rating, reviews }) => (
                <div
                  key={teacher._id}
                  className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
                    <Avatar
                      alt={teacher.name}
                      src={imgUrl(teacher.profileImage)}
                      sx={{ width: 80, height: 80 }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xl font-semibold text-gray-900">{teacher.name}</h3>
                        <div className="text-sm font-semibold text-indigo-700">৳{hourlyRate} / hr</div>
                      </div>

                      {/* Ratings */}
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) =>
                          i < rating ? (
                            <Star key={i} className="text-yellow-400" fontSize="small" />
                          ) : (
                            <StarBorder key={i} className="text-gray-300" fontSize="small" />
                          )
                        )}
                        <span className="text-sm text-gray-600 ml-2">({reviews} reviews)</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {[...subjects].map((subj, i) => (
                          <span
                            key={i}
                            className="bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 text-sm px-2 py-0.5 rounded-full"
                          >
                            #{subj}
                          </span>
                        ))}
                      </div>

                      <Link
                        href={
                          selectedTags.length > 0
                            ? `/teachers/${teacher._id}/posts?${selectedTags
                                .map((tag) => `subject=${encodeURIComponent(tag.value)}`)
                                .join('&')}`
                            : `/teachers/${teacher._id}/posts`
                        }
                      >
                        <button
                          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-2 px-4 rounded-md
                                     hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                        >
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
