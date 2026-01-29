"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Clock, CreditCard, Phone, Globe, ArrowRight } from 'lucide-react';

const MediaTuitionCard = ({ tuition, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-[2rem] p-8 animate-pulse mb-6 h-64 shadow-sm">
        <div className="h-8 w-3/4 bg-slate-100 rounded-xl mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-1/2 bg-slate-50 rounded-lg" />
          <div className="h-4 w-1/3 bg-slate-50 rounded-lg" />
        </div>
      </div>
    );
  }

  const Stat = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 text-slate-600 group/stat">
      <div className="p-2 bg-slate-100 rounded-xl group-hover/stat:bg-indigo-50 group-hover/stat:text-indigo-600 transition-colors duration-300">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white border border-slate-100 hover:border-indigo-200 rounded-[2.5rem] p-8 transition-all duration-500 mb-6 overflow-hidden shadow-xl shadow-slate-200/40 hover:shadow-indigo-500/10"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${tuition.mode === 'Online' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
              {tuition.mode}
            </span>
            <span className="text-slate-200 font-bold text-xs uppercase tracking-widest">•</span>
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{tuition.code}</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-500 mb-6 leading-tight">
            {tuition.title}
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            <Stat icon={User} label="Class" value={tuition.class} />
            <Stat icon={Globe} label="Subject" value={tuition.subject} />
            <Stat icon={Clock} label="Days/Week" value={tuition.days} />
            <Stat icon={MapPin} label="Location" value={tuition.location} />
            <Stat icon={CreditCard} label="Salary" value={`৳${tuition.salary}`} />
            <Stat icon={Phone} label="Contact" value={tuition.contact} />
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <button className="group/btn relative px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl overflow-hidden transition-all shadow-xl shadow-slate-900/10 hover:shadow-indigo-600/20 active:scale-95">
            <span className="relative z-10 flex items-center gap-2">
              Apply Now <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MediaTuitionCard;
