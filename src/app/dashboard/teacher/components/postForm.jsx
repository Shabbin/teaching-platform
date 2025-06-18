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

  // Shared fields
  const [subjects, setSubjects] = useState([]);
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [errors, setErrors] = useState({});

  // General post fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Topic post fields
  const [topicTitle, setTopicTitle] = useState('');
  const [syllabusTag, setSyllabusTag] = useState('');
  const [targetStudents, setTargetStudents] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState([{ week: 1, title: '', description: '' }]);

  const resetAllFields = () => {
    setSubjects([]);
    setLocation('');
    setLanguage('');
    setHourlyRate('');
    setYoutubeLink('');
    setErrors({});
    setTitle('');
    setDescription('');
    setTopicTitle('');
    setSyllabusTag('');
    setTargetStudents([]);
    setWeeklyPlan([{ week: 1, title: '', description: '' }]);
  };

  const handleTopicChange = (field, value) => {
    switch (field) {
      case 'topicTitle': setTopicTitle(value); break;
      case 'syllabusTag': setSyllabusTag(value); break;
      case 'targetStudents': setTargetStudents(value); break;
      case 'weeklyPlan': setWeeklyPlan(value); break;
      default: break;
    }
  };

  const sharedFields = (
    <>
      <TagInput
        label="Subjects (max 5)"
        options={SUBJECT_OPTIONS}
        selected={subjects}
        setSelected={setSubjects}
        maxTags={5}
      />
      {errors.subjects && <p className="text-red-500 text-sm">{errors.subjects}</p>}

      <input
        className="input input-bordered w-full mb-2"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <input
        className="input input-bordered w-full mb-2"
        placeholder="Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      />
      <input
        type="number"
        className="input input-bordered w-full mb-2"
        placeholder="Hourly Rate"
        value={hourlyRate}
        onChange={(e) => setHourlyRate(e.target.value)}
      />
      {errors.hourlyRate && <p className="text-red-500 text-sm">{errors.hourlyRate}</p>}

      <input
        className="input input-bordered w-full mb-2"
        placeholder="YouTube Link"
        value={youtubeLink}
        onChange={(e) => setYoutubeLink(e.target.value)}
      />
    </>
  );

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
    <form className="card bg-base-100 shadow-lg p-6 w-full max-w-3xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold mb-4">Create New Post</h2>

      {/* Post Type Toggle */}
      <div className="mb-4 flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="postType"
            value="general"
            checked={postType === 'general'}
            onChange={() => {
              setPostType('general');
              resetAllFields();
            }}
          />
          General Post
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="postType"
            value="topic"
            checked={postType === 'topic'}
            onChange={() => {
              setPostType('topic');
              resetAllFields();
            }}
          />
          Topic Post
        </label>
      </div>

      {sharedFields}

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

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className={`btn btn-primary w-full mt-6 ${loading ? 'loading' : ''}`}
      >
        {loading ? 'Creating...' : 'Create Post'}
      </button>

      {/* Submission error */}
      {errors.submit && (
        <p className="text-red-600 mt-4 text-center font-semibold">{errors.submit}</p>
      )}
    </form>
  );
};

export default CreatePostForm;
