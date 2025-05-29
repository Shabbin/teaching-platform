'use client';

import { useSelector } from 'react-redux';
import { useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const SUBJECT_OPTIONS = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'English',
  'Economics', 'Computer Science', 'History', 'Geography', 'Programming'
];

export default function PostContentPage() {
  const profileImage = useSelector((state) => state.user.profileImage);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState('');

  const handleAddSubject = (subject) => {
    if (subjects.length < 5 && !subjects.includes(subject)) {
      setSubjects([...subjects, subject]);
    }
  };

  const handleRemoveSubject = (subject) => {
    setSubjects(subjects.filter((s) => s !== subject));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('language', language);
    formData.append('hourlyRate', hourlyRate);
    formData.append('youtubeLink', youtubeLink);
    formData.append('subjects', JSON.stringify(subjects));

    if (videoFile) {
      formData.append('videoFile', videoFile);
    }

    try {
      const res = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert('Post created successfully!');
        // Optionally clear form
        setTitle('');
        setDescription('');
        setSubjects([]);
        setLocation('');
        setLanguage('');
        setHourlyRate('');
        setYoutubeLink('');
        setVideoFile(null);
      } else {
        alert(data.message || 'Failed to create post');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-8">

        {/* Left Sidebar */}
        <div className="hidden lg:block">
          <div className="bg-white border rounded-xl p-4 text-center shadow-sm text-sm font-medium text-indigo-600">
            + Create Ad
          </div>
        </div>

        {/* Center Form */}
        <div className="bg-white rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create a New Ad</h2>

          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Title */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Expert Chemistry Tutor"
                className="w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write about your experience, what you offer, and your style"
                className="w-full bg-gray-100 rounded-lg px-4 py-2 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Subjects */}
            <div className="relative">
              <label className="block text-sm text-gray-600 mb-1">Subjects</label>
              <div
                className="w-full min-h-[50px] bg-gray-100 rounded-lg px-3 py-2 flex flex-wrap gap-2 cursor-pointer"
                onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
              >
                {subjects.map((subject) => (
                  <span
                    key={subject}
                    className="bg-indigo-100 text-indigo-700 text-sm px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSubject(subject);
                      }}
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                ))}
                {subjects.length === 0 && (
                  <span className="text-gray-400 text-sm">Click to select subjects</span>
                )}
              </div>
              {showSubjectDropdown && (
                <div className="absolute z-10 bg-white mt-2 w-full rounded-md shadow-lg max-h-48 overflow-y-auto border border-gray-200">
                  {SUBJECT_OPTIONS.map((subject) => (
                    <div
                      key={subject}
                      onClick={() => handleAddSubject(subject)}
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm flex justify-between"
                    >
                      {subject}
                      <FaPlus className="text-indigo-500 text-xs" />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Select up to 5 subjects.</p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Online / Dhaka"
                className="w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. English, Bangla"
                className="w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hourly Rate (USD)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="e.g. 25"
                className="w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Video File */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Upload a Demo Video</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
                className="w-full text-sm text-gray-500"
              />
            </div>

            {/* YouTube Link */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Or YouTube Link</label>
              <input
                type="url"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-2 rounded-lg transition"
            >
              Submit Ad
            </button>
          </form>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:flex flex-col items-center text-center bg-white p-6 shadow-sm self-start">
          <img
            src={profileImage || '/default-profile.png'}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-indigo-500"
          />
          <div className="mt-3 text-sm text-gray-600">Hourly Rate</div>
          <div className="text-xl font-semibold text-indigo-600">
            {hourlyRate ? `$${hourlyRate}` : '—'}
          </div>
        </div>

      </div>
    </div>
  );
}
