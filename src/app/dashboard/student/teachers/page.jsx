'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Select from 'react-select';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, DollarSign, BookOpen, Star,
  Filter, X, ChevronRight, User, GraduationCap
} from 'lucide-react';
import API from '../../../../api/axios';
import { useSelector } from 'react-redux';

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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const user = useSelector((state) => state.auth?.user);

  // Custom polished theme for react-select
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#6366F1' : '#E2E8F0',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
      '&:hover': { borderColor: '#818CF8' },
      borderRadius: '1rem',
      padding: '4px',
      transition: 'all 0.2s ease',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#EEF2FF',
      borderRadius: '8px',
      border: '1px solid #C7D2FE',
    }),
    multiValueLabel: (base) => ({ ...base, color: '#4F46E5', fontWeight: 600 }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#6366F1',
      ':hover': { backgroundColor: '#4F46E5', color: 'white' },
      borderRadius: '0 8px 8px 0',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '1rem',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
      border: '1px solid #F1F5F9',
      padding: '8px',
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: '8px',
      backgroundColor: state.isSelected ? '#4F46E5' : state.isFocused ? '#F8FAFC' : 'transparent',
      color: state.isSelected ? 'white' : '#1E293B',
      cursor: 'pointer',
      marginBottom: '2px',
    }),
  };

  const imgUrl = (src) => {
    if (!src) return '';
    return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_BASE_URL}/${src}`;
  };

  const fetchAllTags = async () => {
    try {
      const { data } = await API.get('/posts');
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
      const { data } = await API.get(`/posts${query}`);
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
  }, []);

  useEffect(() => {
    fetchFilteredPosts();
  }, [selectedTags, searchQuery, location, mode, minPay, maxPay]);

  const tagOptions = allTags.map((tag) => ({ value: tag, label: tag }));

  // Process teachers logic
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
        rating: Math.floor(Math.random() * 5) + 1, // Placeholder mock data
        reviews: Math.floor(Math.random() * 100) + 1, // Placeholder mock data
      });
    } else {
      filteredSubjects.forEach((subj) => currentSubjects.add(subj));
      teacherMap.get(tId).subjects = currentSubjects;
    }
  });

  const teachers = Array.from(teacherMap.values()).sort((a, b) => b.rating - a.rating);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans text-slate-900">

      {/* Background Decor - Optimized for mobile */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="hidden md:block">
          <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-indigo-200/20 rounded-full blur-[100px]" />
          <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[100px]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm"
            >
              <GraduationCap size={14} /> Elite Tutors
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight"
            >
              Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Mentor.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 mt-4 max-w-xl text-lg leading-relaxed"
            >
              {user?.name ? `Welcome back, ${user.name}. ` : ''}
              Browse our curated list of expert educators tailored to your learning needs.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
              {teachers.length}
            </div>
            <div className="pr-4">
              <div className="text-xs text-slate-400 font-bold uppercase">Available</div>
              <div className="text-sm font-bold text-slate-800">Experts Found</div>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden w-full flex items-center justify-center gap-2 bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-indigo-200"
          >
            <Filter size={20} /> Show Filters
          </button>

          {/* Sidebar Filters */}
          <AnimatePresence>
            {(isMobileFilterOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
              <motion.aside
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className={`
                  fixed inset-0 z-50 bg-white/50 backdrop-blur-md lg:backdrop-blur-none lg:bg-transparent lg:static lg:w-80 lg:block p-6 lg:p-0
                  ${isMobileFilterOpen ? 'flex flex-col' : 'hidden'}
                `}
              >
                <div className="lg:hidden flex justify-end mb-4">
                  <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 bg-slate-100 rounded-full">
                    <X size={24} className="text-slate-600" />
                  </button>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-200/40 rounded-3xl p-6 space-y-8 sticky top-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Search size={14} /> Search
                    </h3>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Name or keyword..."
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 pl-10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Search className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <BookOpen size={14} /> Subjects
                    </h3>
                    <Select
                      isMulti
                      options={tagOptions}
                      value={selectedTags}
                      onChange={setSelectedTags}
                      placeholder="Select subjects..."
                      styles={selectStyles}
                      className="text-sm font-medium"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MapPin size={14} /> Location
                    </h3>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="City or Area"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 pl-10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                      <MapPin className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <DollarSign size={14} /> Hourly Rate
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="relative w-full">
                        <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">MIN</span>
                        <input
                          type="number"
                          className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-3 py-3 pl-10 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          value={minPay}
                          onChange={(e) => setMinPay(e.target.value)}
                        />
                      </div>
                      <div className="text-slate-300">-</div>
                      <div className="relative w-full">
                        <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">MAX</span>
                        <input
                          type="number"
                          className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-3 py-3 pl-10 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          value={maxPay}
                          onChange={(e) => setMaxPay(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reset Button (Optional, can be added) */}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTags([]);
                      setLocation('');
                      setMinPay('');
                      setMaxPay('');
                    }}
                    className="w-full py-3 text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 w-full min-h-[500px]">
            {loading ? (
              <div className="grid grid-cols-1 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
                    <Skeleton variant="circular" width={100} height={100} className="rounded-2xl" />
                    <div className="flex-1 space-y-4">
                      <Skeleton variant="text" height={40} width="60%" />
                      <Skeleton variant="text" height={20} width="40%" />
                      <div className="flex gap-2">
                        <Skeleton variant="rectangular" width={80} height={30} className="rounded-lg" />
                        <Skeleton variant="rectangular" width={80} height={30} className="rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : teachers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-center"
              >
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <Search size={48} className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No teachers found</h3>
                <p className="text-slate-500 max-w-sm">
                  We couldn't find any tutors matching your filters. Try adjusting your search query or tags.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {teachers.map(({ teacher, subjects, hourlyRate, location, rating, reviews }, index) => (
                  <motion.div
                    key={teacher._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : index * 0.05
                    }}
                    className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 transition-all group relative overflow-hidden"
                  >
                    {/* Hover Gradient Border Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      {/* Avatar Section */}
                      <div className="relative shrink-0">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-4 ring-slate-50 shadow-inner">
                          <Avatar
                            alt={teacher.name}
                            src={imgUrl(teacher.profileImage)}
                            sx={{ width: '100%', height: '100%' }}
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-3 -right-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
                          <div className="flex flex-col items-center justify-center bg-indigo-50 rounded-lg px-2 py-1">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase leading-none">Rate</span>
                            <span className="text-sm font-bold text-indigo-700">
                              {rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                              {teacher.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-slate-400" />
                                {location || 'Remote / Online'}
                              </span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="flex items-center gap-1.5">
                                <User size={14} className="text-slate-400" />
                                {reviews} Review{reviews !== 1 && 's'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-slate-900 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <DollarSign size={16} className="text-slate-400" />
                            <span className="text-lg font-bold">{hourlyRate}</span>
                            <span className="text-xs text-slate-400 font-bold uppercase">/ hr</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {[...subjects].map((subj, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-white border border-slate-100 text-slate-600 text-xs font-bold rounded-lg shadow-sm group-hover:border-indigo-100 group-hover:text-indigo-600 group-hover:bg-indigo-50/50 transition-all"
                            >
                              {subj}
                            </span>
                          ))}
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end">
                          <Link
                            href={
                              selectedTags.length > 0
                                ? `/teachers/${teacher._id}/posts?${selectedTags
                                  .map((tag) => `subject=${encodeURIComponent(tag.value)}`)
                                  .join('&')}`
                                : `/teachers/${teacher._id}/posts`
                            }
                            className="w-full md:w-auto"
                          >
                            <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition-all">
                              View Full Profile <ChevronRight size={16} />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTeachers;
