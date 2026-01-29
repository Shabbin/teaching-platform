"use client"
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import API from '../../../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, MailCheck, User,
  MapPin, Clock, ArrowRight, Loader2
} from 'lucide-react';

export default function RequestsPage() {
  const router = useRouter();
  const userInfo = useSelector((state) => state.user.userInfo);
  const teacherId = userInfo?.id || userInfo?._id;

  const [requests, setRequests] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacherId) {
      setError('You must be logged in as a teacher.');
      return;
    }

    async function fetchRequests() {
      setError(null);
      setLoading(true);
      try {
        const res = await API.get('/teacher-requests');
        setRequests(res.data || []);
      } catch (err) {
        setError(err.normalizedMessage || err.message || 'Failed to fetch requests');
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [teacherId]);

  async function updateRequestStatus(id, action) {
    setError(null);
    setLoadingIds((prev) => [...prev, id]);

    try {
      const res = await API.post(`/teacher-requests/${id}/${action}`, {});
      const data = res.data;

      if (action === 'approve' && data?.threadId) {
        router.push(`/dashboard/teacher/messenger/${data.threadId}`);
      }

      setRequests((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
        )
      );
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Failed to update request');
    } finally {
      setLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
    }
  }

  if (!teacherId) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">
      Please log in as a teacher.
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 px-6 py-12 md:py-20">
      {/* Legendary Background - Optimized for mobile */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="hidden md:block">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse transition-opacity duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
        </div>
        <div className="absolute top-1/2 left-1/3 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-indigo-400 font-black uppercase tracking-[0.2em] text-xs mb-4"
          >
            <div className="w-12 h-[1px] bg-indigo-500/50"></div>
            Portal Requests
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white leading-tight"
          >
            Tuition <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Inquiries</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-400 max-w-xl text-lg font-medium"
          >
            Review and manage student requests for your courses. Start a conversation with approved candidates instantly.
          </motion.p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-4">
            <Loader2 className="animate-spin" size={48} />
            <p className="font-bold uppercase tracking-widest text-xs">Fetching Requests...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2rem] text-center">
            <XCircle className="mx-auto text-rose-500 mb-4" size={48} />
            <p className="text-white font-black text-xl mb-2">Something went wrong</p>
            <p className="text-rose-400 font-medium">{error}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white/[0.03] backdrop-blur-md md:backdrop-blur-3xl border border-white/10 p-12 md:p-20 rounded-[3rem] text-center">
            <MailCheck className="mx-auto text-slate-700 mb-6" size={64} />
            <p className="text-white font-black text-2xl mb-2">No Requests Yet</p>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">When students inquire about your courses, they'll appear right here.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid gap-6"
          >
            {requests.map((req) => {
              const isLoading = loadingIds.includes(req._id);
              return (
                <motion.div
                  key={req._id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.98 },
                    visible: { opacity: 1, y: 0, scale: 1 }
                  }}
                  className="group relative bg-white/[0.03] backdrop-blur-md md:backdrop-blur-2xl border border-white/5 hover:border-indigo-500/30 rounded-[2.5rem] p-6 md:p-8 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <User size={28} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{req.studentName}</h3>
                          <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-widest mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-orange-500' : req.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {req.status}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-slate-400">
                          <div className="bg-white/5 p-2 rounded-lg"><Clock size={16} /></div>
                          <span className="text-sm font-bold">Topic: <span className="text-white">{req.topic || 'General Inquiry'}</span></span>
                        </div>
                        {req.location && (
                          <div className="flex items-center gap-3 text-slate-400">
                            <div className="bg-white/5 p-2 rounded-lg"><MapPin size={16} /></div>
                            <span className="text-sm font-bold">{req.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateRequestStatus(req._id, 'reject')}
                            disabled={isLoading}
                            className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-xs uppercase tracking-[0.15em] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-all disabled:opacity-50"
                          >
                            {isLoading ? 'Wait...' : 'Ignore'}
                          </button>
                          <button
                            onClick={() => updateRequestStatus(req._id, 'approve')}
                            disabled={isLoading}
                            className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.15em] flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transform active:scale-95 disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            {isLoading ? 'Starting...' : 'Approve & Chat'}
                          </button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle size={14} /> Approved
                        </div>
                      )}
                      {req.status === 'rejected' && (
                        <div className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                          <XCircle size={14} /> Rejected
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}
