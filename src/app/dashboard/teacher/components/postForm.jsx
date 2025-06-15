
'use client';
import React, { useState } from 'react';
import TagInput from './TagInput';

const SUBJECT_OPTIONS = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'English',
  'Economics', 'Computer Science', 'History', 'Geography', 'Programming'
];

const CreatePostForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [topics, setTopics] = useState([]);
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      title, description, subjects, syllabus, topics,
      location, language, hourlyRate, youtubeLink
    };

  const token = localStorage.getItem('token'); // or get it from Redux

const response = await fetch('http://localhost:5000/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(formData),
});
    const data = await response.json();
    if (!response.ok) alert(data.message || 'Failed to create post');
    else alert('Post created successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl p-6 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="input input-bordered w-full mb-4" required />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="textarea textarea-bordered w-full mb-4" required />
      <TagInput label="Subjects (max 5)" options={SUBJECT_OPTIONS} selected={subjects} setSelected={setSubjects} maxTags={5} />
      <TagInput label="Syllabus" selected={syllabus} setSelected={setSyllabus} />
      <TagInput label="Topics" selected={topics} setSelected={setTopics} />
      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="input input-bordered w-full mb-4" />
      <input value={language} onChange={e => setLanguage(e.target.value)} placeholder="Language" className="input input-bordered w-full mb-4" />
      <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="Hourly Rate" className="input input-bordered w-full mb-4" required />
      <input value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} placeholder="YouTube Link" className="input input-bordered w-full mb-4" />
      <button type="submit" className="btn btn-primary w-full">Submit</button>
    </form>
  );
};

export default CreatePostForm;
