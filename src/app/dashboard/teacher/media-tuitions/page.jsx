// pages/media-tuitions.jsx
'use client';

import React, { useState, useEffect } from 'react';
import MediaTuitionCard from '../../components/MediaTuitionCard';

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
  const postsPerPage = 20;

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1000);
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
    if (sort === 'latest') return 0;
    if (sort === 'highest') return parseInt(b.salary) - parseInt(a.salary);
    if (sort === 'lowest') return parseInt(a.salary) - parseInt(b.salary);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / postsPerPage);
  const paginated = sorted.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Sidebar Filter */}
        <div className="bg-white shadow-sm rounded-xl p-6 col-span-1 self-start sticky top-8 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-center">🎯 Filter Tuitions</h2>

          <div className="form-control mb-4">
            <input
              type="text"
              placeholder="Subject"
              className="input input-bordered bg-base-100"
              value={filters.subject}
              onChange={e => {
                setFilters({ ...filters, subject: e.target.value });
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="form-control mb-4">
            <input
              type="text"
              placeholder="Location"
              className="input input-bordered bg-base-100"
              value={filters.location}
              onChange={e => {
                setFilters({ ...filters, location: e.target.value });
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="form-control mb-4">
            <select
              className="select select-bordered bg-base-100"
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

          <div className="form-control mb-4">
            <input
              type="number"
              placeholder="Min Salary"
              className="input input-bordered bg-base-100"
              value={filters.minSalary}
              onChange={e => {
                setFilters({ ...filters, minSalary: e.target.value });
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="form-control">
            <input
              type="number"
              placeholder="Max Salary"
              className="input input-bordered bg-base-100"
              value={filters.maxSalary}
              onChange={e => {
                setFilters({ ...filters, maxSalary: e.target.value });
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Tuition Cards Section */}
        <div className="col-span-1 md:col-span-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2 md:mb-0">Sort by</h2>
              <select
                className="select select-sm bg-base-100"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="latest">Latest</option>
                <option value="highest">Highest Salary</option>
                <option value="lowest">Lowest Salary</option>
              </select>
            </div>
          </div>

          {loading
            ? Array(postsPerPage).fill({}).map((_, i) => <MediaTuitionCard key={i} loading={true} />)
            : paginated.length > 0
              ? paginated.map((tuition, i) => <MediaTuitionCard key={i} tuition={tuition} />)
              : <p className="text-center text-gray-500">No tuitions match your filters.</p>
          }

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MediaTuitionsPage;
