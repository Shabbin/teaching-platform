'use client';

import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { Video } from "lucide-react";
import Link from 'next/link';

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
  const [loadingForm, setLoadingForm] = useState(true);
  const [loadingAds, setLoadingAds] = useState(true);

  const mediaAds = [
    {
      _id: "1",
      title: "Public University Male/Lady Tutor Wanted at Savar Radio Colony TNT Gate",
      class: "Class: 9",
      subject: "Sub: Only English",
      days: "Days: 4",
      salary: "Salary: 3000",
      code: "Savar9engML.Tud1023",
      contact: "sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222",
    },
    {
      _id: "2",
      title: "👔 Buet/Du Male Tutor Wanted at Sadarghat Near Kotowali Thana Bikrompur Garden City",
      class: "Class: 10",
      subject: "Sub: Phy+Chem+Biology",
      days: "Days: 4",
      salary: "Salary: 7000",
      code: "Sadarghat10sciM.Tud1021",
      contact: "sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222",
    },
    // ... remaining ads
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingForm(false);
      setLoadingAds(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

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
    if (videoFile) formData.append('videoFile', videoFile);

    try {
      const res = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert('Post created successfully!');
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
          {loadingForm ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded w-full"></div>
              ))}
              <div className="h-10 bg-indigo-300 rounded w-1/3"></div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create a New Ad</h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Title */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-100 rounded-lg px-4 py-2" placeholder="e.g. Expert Chemistry Tutor" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-100 rounded-lg px-4 py-2 min-h-[100px]" placeholder="Write about your experience..." />
                </div>

                {/* Subjects */}
                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Subjects</label>
                  <div onClick={() => setShowSubjectDropdown(!showSubjectDropdown)} className="w-full bg-gray-100 rounded-lg px-3 py-2 flex flex-wrap gap-2 cursor-pointer">
                    {subjects.map((subject) => (
                      <span key={subject} className="bg-indigo-100 text-indigo-700 text-sm px-2 py-1 rounded-full flex items-center gap-1">
                        {subject}
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveSubject(subject); }}><FaTimes className="text-xs" /></button>
                      </span>
                    ))}
                    {subjects.length === 0 && <span className="text-gray-400 text-sm">Click to select subjects</span>}
                  </div>
                  {showSubjectDropdown && (
                    <div className="absolute z-10 bg-white mt-2 w-full rounded-md shadow-lg max-h-48 overflow-y-auto border border-gray-200">
                      {SUBJECT_OPTIONS.map((subject) => (
                        <div key={subject} onClick={() => handleAddSubject(subject)} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm flex justify-between">
                          {subject}
                          <FaPlus className="text-indigo-500 text-xs" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location, Language, Hourly Rate, Video, YouTube */}
                <div><label className="block text-sm text-gray-600 mb-1">Location</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-gray-100 rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Language</label><input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-gray-100 rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Hourly Rate (USD)</label><input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="w-full bg-gray-100 rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Upload a Demo Video</label><input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Or YouTube Link</label><input type="url" value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} className="w-full bg-gray-100 rounded-lg px-4 py-2" /></div>

                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Submit Ad</button>
              </form>
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:flex flex-col gap-6 self-start">
          {/* Profile Card */}
          <div className="flex flex-col items-center bg-white p-6 shadow-sm rounded-md">
            {loadingForm ? (
              <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
            ) : (
              <img src={profileImage || "/default-profile.png"} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-indigo-500" />
            )}
            <div className="mt-3 text-sm text-gray-600">Hourly Rate</div>
            <div className="text-xl font-semibold text-indigo-600">{hourlyRate ? `$${hourlyRate}` : "—"}</div>
          </div>

          {/* Tuition Media Ads */}
          <div className="w-full bg-white shadow rounded-2xl p-4 sm:p-6 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-blue-600"><Video className="inline w-5 h-5 mr-2" />Tuition Media Ads</h2>
              <Link href="/dashboard/teacher/media-tuitions" passHref>
                <button className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm">+ Media</button>
              </Link>
            </div>

            {loadingAds ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-100 h-24 rounded-md"></div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1 custom-scroll">
                {mediaAds.map((ad) => (
                  <div key={ad._id} className="bg-gray-50 border rounded-xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800">{ad.title}</h3>
                    <p className="text-sm text-gray-600">{ad.class}</p>
                    <p className="text-sm text-gray-600">{ad.subject}</p>
                    <p className="text-sm text-gray-600">{ad.days}</p>
                    <p className="text-sm text-gray-600">{ad.salary}</p>
                    <p className="text-sm text-gray-600">Code: {ad.code}</p>
                    <p className="text-sm text-gray-600 mt-1">{ad.contact}</p>
                    <button className="mt-3 w-full bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700 text-sm">Apply</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
