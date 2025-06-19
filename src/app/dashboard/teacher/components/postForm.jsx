'use client';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import GeneralPostForm from './GeneralPostForm';
import TopicPostForm from './TopicPostForm';
import TagInput from './TagInput';
import { createTeacherPost } from '../../../redux/teacherPostSlice';

const SUBJECT_OPTIONS = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'English',
  'Economics', 'Computer Science', 'History', 'Geography', 'Programming'
];

const CreatePostForm = ({ onPostCreated }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.teacherPosts);
  const [postType, setPostType] = useState('general');

  const [subjects, setSubjects] = useState([]);
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [errors, setErrors] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [syllabusTag, setSyllabusTag] = useState('');
  const [targetStudents, setTargetStudents] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState([{ week: 1, title: '', description: '' }]);

  const resetAllFields = () => {
    setSubjects([]); setLocation(''); setLanguage('');
    setHourlyRate(''); setYoutubeLink('');
    setErrors({}); setTitle(''); setDescription('');
    setTopicTitle(''); setSyllabusTag(''); setTargetStudents([]);
    setWeeklyPlan([{ week: 1, title: '', description: '' }]);
  };

  const handleTopicChange = (field, value) => {
    switch (field) {
      case 'topicTitle': setTopicTitle(value); break;
      case 'syllabusTag': setSyllabusTag(value); break;
      case 'targetStudents': setTargetStudents(value); break;
      case 'weeklyPlan': setWeeklyPlan(value); break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (subjects.length === 0) newErrors.subjects = 'Select at least one subject';
    if (!hourlyRate || hourlyRate <= 0) newErrors.hourlyRate = 'Hourly rate must be positive';

    if (postType === 'general') {
      if (!title.trim()) newErrors.title = 'Title is required';
      if (!description.trim()) newErrors.description = 'Description is required';
    } else {
      if (!topicTitle.trim()) newErrors.topicTitle = 'Topic title is required';
      weeklyPlan.forEach((week, i) => {
        if (!week.title.trim()) newErrors[`weekTitle${i}`] = 'Week title is required';
        if (!week.description.trim()) newErrors[`weekDesc${i}`] = 'Week description is required';
      });
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    let postData = {
      postType,
      subjects,
      location,
      language,
      hourlyRate: Number(hourlyRate),
      youtubeLink,
    };

    if (postType === 'general') {
      postData = { ...postData, title, description };
    } else {
      postData = {
        ...postData,
        title: topicTitle,
        description: '',
        topicDetails: {
          topicTitle,
          syllabusTag,
          studentTypes: targetStudents,
          weeklyPlan,
        },
      };
    }

    try {
      const result = await dispatch(createTeacherPost(postData));
      if (createTeacherPost.fulfilled.match(result)) {
        onPostCreated(result.payload);
        resetAllFields();
      } else {
        setErrors({ submit: result.payload || 'Failed to create post' });
      }
    } catch {
      setErrors({ submit: 'Something went wrong. Try again later.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl p-8 space-y-6 border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-gray-800">📣 Create a New Tuition Post</h2>

      {/* Post Type Selector */}
      <div className="flex justify-center gap-6">
        {['general', 'topic'].map((type) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="postType"
              value={type}
              checked={postType === type}
              onChange={() => {
                setPostType(type);
                resetAllFields();
              }}
              className="radio radio-primary"
            />
            <span className="font-medium capitalize">{type} Post</span>
          </label>
        ))}
      </div>

      {/* Shared Inputs */}
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📚 Subjects (max 5)</label>
          <div className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
            <TagInput
              options={SUBJECT_OPTIONS}
              selected={subjects}
              setSelected={setSubjects}
              maxTags={5}
            />
          </div>
          {errors.subjects && (
            <p className="text-red-500 text-sm mt-1">{errors.subjects}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Click to select from predefined subjects.</p>
        </div>

        <input
          className="input input-bordered w-full"
          placeholder="📍 Location (e.g., Dhaka, Online)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          className="input input-bordered w-full"
          placeholder="🌐 Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        />
        <input
          type="number"
          className="input input-bordered w-full"
          placeholder="💸 Hourly Rate (in BDT)"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
        />
        {errors.hourlyRate && <p className="text-red-500 text-sm">{errors.hourlyRate}</p>}

        <input
          className="input input-bordered w-full"
          placeholder="🎥 YouTube Link (optional)"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
        />
      </div>

      {/* Post Type-Specific Fields */}
      {postType === 'general' ? (
        <GeneralPostForm
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          subjects={subjects}
          setSubjects={setSubjects}
          location={location}
          setLocation={setLocation}
          language={language}
          setLanguage={setLanguage}
          hourlyRate={hourlyRate}
          setHourlyRate={setHourlyRate}
          youtubeLink={youtubeLink}
          setYoutubeLink={setYoutubeLink}
          errors={errors}
        />
      ) : (
        <TopicPostForm
          sharedData={{ topicTitle, syllabusTag, targetStudents, weeklyPlan }}
          onChange={handleTopicChange}
          subjects={subjects}
          location={location}
          language={language}
          hourlyRate={hourlyRate}
          youtubeLink={youtubeLink}
          setErrors={setErrors}
          errors={errors}
        />
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`btn btn-primary w-full py-3 text-lg font-semibold ${loading ? 'loading' : ''}`}
      >
        {loading ? 'Posting...' : '🚀 Submit Post'}
      </button>

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-md text-center mt-4 font-semibold">
          {errors.submit}
        </div>
      )}
    </form>
  );
};

export default CreatePostForm;
