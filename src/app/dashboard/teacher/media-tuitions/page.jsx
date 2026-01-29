"use client"
import React, { useState, useEffect } from 'react';
import MediaTuitionCard from '../../components/MediaTuitionCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, MapPin, CreditCard, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

const sampleTuitions = Array.from({ length: 60 }, (_, i) => {
  const locations = ['Dhanmondi', 'Uttara', 'Savar', 'Banani', 'Mirpur', 'Gulshan'];
  const subjects = ['English', 'Math', 'Physics', 'Chemistry', 'Biology'];
  const modes = ['Online', 'Offline'];
  const location = locations[i % locations.length];
  const subject = subjects[i % subjects.length];
  const mode = modes[i % 2];

  return {
    title: `${subject} Tutor Needed at ${location}`,
    class: `${6 + (i % 6)}`,
    subject,
    days: `${3 + (i % 3)}`,
    salary: `${3000 + (i * 50)}`,
    code: `${location}${i + 1}TudCode`,
    contact: `0189007${8000 + i}`,
    mode,
    location
  };
});

const MediaTuitionsPage = () => {
  const [filters, setFilters] = useState({
    subject: '',
    location: '',
    mode: '',
    minSalary: '',
    maxSalary: ''
  });
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timeout);
  }, []);

  const filtered = sampleTuitions.filter(tuition => {
    const { subject, location, mode, minSalary, maxSalary } = filters;
    return (
      (!subject || tuition.subject.toLowerCase().includes(subject.toLowerCase())) &&
      (!location || tuition.location.toLowerCase().includes(location.toLowerCase())) &&
      (!mode || tuition.mode === mode) &&
      (!minSalary || parseInt(tuition.salary) >= parseInt(minSalary)) &&
      (!maxSalary || parseInt(tuition.salary) <= parseInt(maxSalary))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'highest') return parseInt(b.salary) - parseInt(a.salary);
    if (sort === 'lowest') return parseInt(a.salary) - parseInt(b.salary);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / postsPerPage);
  const paginated = sorted.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const InputWrapper = ({ icon: Icon, children }) => (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon size={18} />
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/50 px-6 py-12 md:py-20">
      {/* Legendary Background (Light Edition) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-indigo-500/5 blur-[180px] rounded-full animate-pulse transition-opacity duration-1000"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-500/5 blur-[150px] rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-multiply"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-[0.2em] text-xs mb-4"
          >
            <div className="w-12 h-[1px] bg-indigo-200"></div>
            Tuition Exchange
          </motion.div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-black text-slate-900 leading-tight"
              >
                Media <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Tuitions</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-slate-500 max-w-xl text-lg font-medium"
              >
                Browse through premium tuition opportunities. Use the advanced filters to find the perfect match for your expertise.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-slate-200 p-2 rounded-2xl shadow-sm"
            >
              <div className="pl-4 pr-2 text-slate-400 text-xs font-black uppercase tracking-widest hidden sm:block">Sort By</div>
              <select
                className="bg-slate-50 border-none text-slate-800 text-sm font-bold py-2 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer outline-none transition-all"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="latest">Latest First</option>
                <option value="highest">Highest Salary</option>
                <option value="lowest">Lowest Salary</option>
              </select>
            </motion.div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Filter */}
          <aside className="lg:col-span-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24 bg-white/70 backdrop-blur-3xl border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <SlidersHorizontal size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Advanced Filter</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Subject</label>
                  <InputWrapper icon={Search}>
                    <input
                      type="text"
                      placeholder="e.g. Physics"
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white rounded-2xl py-3 pl-12 pr-4 text-slate-800 text-sm font-bold placeholder:text-slate-400 outline-none transition-all shadow-inner"
                      value={filters.subject}
                      onChange={e => {
                        setFilters({ ...filters, subject: e.target.value });
                        setCurrentPage(1);
                      }}
                    />
                  </InputWrapper>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Location</label>
                  <InputWrapper icon={MapPin}>
                    <input
                      type="text"
                      placeholder="e.g. Dhanmondi"
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white rounded-2xl py-3 pl-12 pr-4 text-slate-800 text-sm font-bold placeholder:text-slate-400 outline-none transition-all shadow-inner"
                      value={filters.location}
                      onChange={e => {
                        setFilters({ ...filters, location: e.target.value });
                        setCurrentPage(1);
                      }}
                    />
                  </InputWrapper>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Teaching Mode</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white rounded-2xl py-3 px-4 text-slate-800 text-sm font-bold outline-none transition-all cursor-pointer shadow-inner"
                    value={filters.mode}
                    onChange={e => {
                      setFilters({ ...filters, mode: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Modes</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Salary Range (Monthly)</label>
                  <div className="space-y-3">
                    <InputWrapper icon={CreditCard}>
                      <input
                        type="number"
                        placeholder="Min ৳"
                        className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white rounded-2xl py-3 pl-12 pr-4 text-slate-800 text-sm font-bold placeholder:text-slate-400 outline-none transition-all shadow-inner"
                        value={filters.minSalary}
                        onChange={e => {
                          setFilters({ ...filters, minSalary: e.target.value });
                          setCurrentPage(1);
                        }}
                      />
                    </InputWrapper>
                    <InputWrapper icon={CreditCard}>
                      <input
                        type="number"
                        placeholder="Max ৳"
                        className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white rounded-2xl py-3 pl-12 pr-4 text-slate-800 text-sm font-bold placeholder:text-slate-400 outline-none transition-all shadow-inner"
                        value={filters.maxSalary}
                        onChange={e => {
                          setFilters({ ...filters, maxSalary: e.target.value });
                          setCurrentPage(1);
                        }}
                      />
                    </InputWrapper>
                  </div>
                </div>

                <button
                  onClick={() => setFilters({ subject: '', location: '', mode: '', minSalary: '', maxSalary: '' })}
                  className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 hover:text-slate-700"
                >
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          </aside>

          {/* Tuition Cards Section */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {loading ? (
                <div key="loading" className="space-y-6">
                  {Array(3).fill({}).map((_, i) => <MediaTuitionCard key={i} loading={true} />)}
                </div>
              ) : paginated.length > 0 ? (
                <motion.div
                  key="content"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.1 } }
                  }}
                  className="space-y-6"
                >
                  {paginated.map((tuition, i) => <MediaTuitionCard key={i} tuition={tuition} />)}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-12 py-8 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-lg shadow-slate-200/50">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-30"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => {
                          if (i + 1 === 1 || i + 1 === totalPages || Math.abs(currentPage - (i + 1)) <= 1) {
                            return (
                              <button
                                key={i}
                                onClick={() => handlePageChange(i + 1)}
                                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                    : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                  }`}
                              >
                                {i + 1}
                              </button>
                            );
                          }
                          if (Math.abs(currentPage - (i + 1)) === 2) {
                            return <span key={i} className="text-slate-300 font-bold self-end mb-2">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-30"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-slate-100 rounded-[3rem] p-32 text-center shadow-sm"
                >
                  <Filter className="mx-auto text-slate-200 mb-6" size={64} />
                  <p className="text-slate-900 font-black text-2xl mb-2">No matches found</p>
                  <p className="text-slate-500 font-medium">Try adjusting your filters to find more tuitions.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 15s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
};

export default MediaTuitionsPage;
