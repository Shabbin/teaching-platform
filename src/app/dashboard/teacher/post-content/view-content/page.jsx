'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Edit3, Trash2, Users, X, Eye,
  BookOpen, Sparkles, Filter, Search,
  MoreHorizontal, ArrowRight, GraduationCap,
  LayoutGrid, List, Plus, AlertCircle
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostById } from '../../../../redux/postViewEventSlice';
import DOMPurify from 'isomorphic-dompurify';
import API from '../../../../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyPostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const dispatch = useDispatch();
  const { posts: postsWithViews } = useSelector((state) => state.postViewEvents);

  // Fetch my posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get('/posts/mine');
        setPosts(res.data);

        // Fetch full detail for each post (to populate redux with viewsCount)
        res.data.forEach((post) => {
          dispatch(fetchPostById(post._id));
        });
      } catch (err) {
        if (err.response?.status === 401) {
          setError('You must be logged in to view posts.');
        } else {
          setError(err.message || 'Error fetching posts');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [dispatch]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.subjects?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [posts, searchTerm]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/posts/${deleteTarget}`);
      setPosts((prev) => prev.filter((post) => post._id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 relative overflow-x-hidden">

      {/* Animated Mesh Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 blur-[120px] rounded-full animate-pulse transition-all duration-1000"></div>
      </div>

      {/* Premium Banner */}
      <div className="bg-slate-900 text-white pb-32 pt-16 rounded-b-[3.5rem] relative overflow-hidden shadow-2xl shadow-indigo-900/10">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-[-50%] right-[-20%] w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-[0.2em] text-xs mb-3"
            >
              <Sparkles size={14} className="animate-pulse" /> Content Management
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black mb-4 tracking-tight"
            >
              Your Subject <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Library</span>
            </motion.h1>
            <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
              Curate and manage the educational content you provide to your students.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"
          >
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search subjects or titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>
            <Link href="/dashboard/teacher/post-content">
              <button className="h-full px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group whitespace-nowrap">
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Create New
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-5 bg-red-50/50 backdrop-blur-xl border border-red-100 text-red-700 rounded-3xl flex items-center gap-4 shadow-xl"
          >
            <div className="p-3 bg-red-100 rounded-2xl text-red-600">
              <AlertCircle size={24} />
            </div>
            <p className="font-bold text-lg">{error}</p>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-white rounded-[2.5rem] shadow-xl animate-pulse border border-white/50"></div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-2xl text-center py-24 rounded-[3rem] shadow-2xl border border-white/50"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={40} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No Content Found</h3>
            <p className="text-slate-500 text-lg max-w-xs mx-auto mb-8 font-medium">
              Start sharing your knowledge by creating your very first post.
            </p>
            <Link href="/dashboard/teacher/post-content">
              <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all transform hover:scale-105 active:scale-95">
                Get Started
              </button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredPosts.map((post) => {
              const viewsCount = postsWithViews[post._id]?.viewsCount || 0;
              const enrollments = Math.floor(Math.random() * 5) + 3; // randomized for demo
              const cleanDesc = DOMPurify.sanitize(post.description || '', {
                USE_PROFILES: { html: true },
              });

              return (
                <motion.div
                  key={post._id}
                  variants={cardVariants}
                  className="group bg-white/90 backdrop-blur-xl border border-white p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-200/40 transition-all duration-500 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors duration-500"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform duration-500">
                        <GraduationCap size={24} />
                      </div>
                      <div className="flex gap-1">
                        <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {post.educationSystem || 'System'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                      {post.title}
                    </h3>

                    <div
                      className="text-slate-500 text-sm mb-6 leading-relaxed line-clamp-3 font-medium opacity-80"
                      dangerouslySetInnerHTML={{ __html: cleanDesc }}
                    />

                    <div className="flex flex-wrap gap-2 mb-6">
                      {post.subjects?.slice(0, 3).map((sub, i) => (
                        <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-tight">
                          {sub}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 mb-8 py-4 border-y border-slate-50">
                      <div className="flex items-center gap-2 group/stat">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover/stat:text-indigo-500 transition-colors">
                          <Eye size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800">{viewsCount}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 group/stat">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover/stat:text-blue-500 transition-colors">
                          <Users size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800">{enrollments}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-3 relative z-10">
                    <Link href={`/dashboard/posts/${post._id}`} className="col-span-1">
                      <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95">
                        View
                      </button>
                    </Link>
                    <Link href={`/dashboard/posts/${post._id}/edit`} className="col-span-1">
                      <button className="w-full py-3 bg-white border border-slate-100 text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200/20 active:scale-95">
                        <Edit3 size={14} /> Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(post._id)}
                      className="w-full py-3 bg-white border border-rose-100 text-rose-500 rounded-xl font-bold text-xs hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200/10 active:scale-95"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal - Premium Redesign */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 flex items-center justify-center z-[1001] p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 relative border border-white/50 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mb-6 mx-auto">
                  <Trash2 size={32} />
                </div>

                <h2 className="text-3xl font-black text-slate-900 mb-4 text-center">Confirm Deletion</h2>
                <p className="text-slate-500 text-center text-lg mb-8 font-medium leading-relaxed">
                  Are you sure you want to remove this project? This action is permanent and cannot be undone.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all active:scale-95"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Keep Content
                  </button>
                  <button
                    disabled={deleting}
                    onClick={handleDelete}
                    className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {deleting ? 'Removing...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scrollbar CSS */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        ::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
