'use client';
import React, { useState } from 'react';
import TagInput from './TagInput';

const STUDENT_TYPE_OPTIONS = [
  'Weak in Subject',
  'Needs Exam Prep',
  'Wants Advanced Topics',
  'Needs Homework Help',
];

const TopicPostForm = ({
  sharedData = {},
  onChange,
  subjects,
  location,
  language,
  hourlyRate,
  youtubeLink,
  setErrors,
}) => {
  // Local validation errors (optional)
  const [localErrors, setLocalErrors] = useState({});

  const updateWeeklyPlanItem = (index, field, value) => {
    const updated = [...sharedData.weeklyPlan];
    updated[index][field] = value;
    onChange('weeklyPlan', updated);
  };

  const addWeek = () => {
    const newWeek = {
      week: sharedData.weeklyPlan.length + 1,
      title: '',
      description: '',
    };
    onChange('weeklyPlan', [...sharedData.weeklyPlan, newWeek]);
  };

  return (
    <div>
      {/* Topic Title */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Topic Title</label>
        <input
          value={sharedData.topicTitle || ''}
          onChange={(e) => onChange('topicTitle', e.target.value)}
          placeholder="e.g. Stoichiometry Fundamentals"
          className="input input-bordered w-full"
        />
        {localErrors.topicTitle && (
          <p className="text-red-500 text-sm">{localErrors.topicTitle}</p>
        )}
      </div>

      {/* Syllabus Tag */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Syllabus Tag</label>
        <input
          value={sharedData.syllabusTag || ''}
          onChange={(e) => onChange('syllabusTag', e.target.value)}
          placeholder="e.g. O'Level Chemistry 504"
          className="input input-bordered w-full"
        />
      </div>

      {/* Student Types */}
      <TagInput
        label="Target Student Types"
        options={STUDENT_TYPE_OPTIONS}
        selected={sharedData.targetStudents || []}
        setSelected={(val) => onChange('targetStudents', val)}
      />

      {/* Weekly Plan */}
      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-3">Weekly Plan</h3>
        {sharedData.weeklyPlan.map((week, i) => (
          <div key={i} className="mb-4 border p-4 rounded-md">
            <p className="font-semibold mb-1">Week {week.week}</p>
            <input
              value={week.title}
              onChange={(e) => updateWeeklyPlanItem(i, 'title', e.target.value)}
              placeholder="Week Title"
              className="input input-bordered w-full mb-1"
            />
            {localErrors[`weekTitle${i}`] && (
              <p className="text-red-500 text-sm">{localErrors[`weekTitle${i}`]}</p>
            )}
            <textarea
              value={week.description}
              onChange={(e) => updateWeeklyPlanItem(i, 'description', e.target.value)}
              placeholder="Week Description"
              className="textarea textarea-bordered w-full"
            />
            {localErrors[`weekDesc${i}`] && (
              <p className="text-red-500 text-sm">{localErrors[`weekDesc${i}`]}</p>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addWeek}
          className="btn btn-outline btn-secondary mt-2"
        >
          + Add Week
        </button>
      </div>
    </div>
  );
};

export default TopicPostForm;
