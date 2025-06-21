'use client';
import React from 'react';

const GeneralPostForm = ({
  title,
  setTitle,
  description,
  setDescription,
  subjects,
  setSubjects,
  location,
  setLocation,
  language,
  setLanguage,
  hourlyRate,
  setHourlyRate,
  youtubeLink,
  setYoutubeLink,
  errors,
}) => {
  return (
    <div>
      {/* Title */}
      <div className="mb-4">
        <label className="block font-semibold mb-1" htmlFor="title">Title</label>
        <input
  type="text"
  className="input input-bordered w-full"
  placeholder="Post title (e.g., 'Crash Course on Physics')"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>
<p className="text-xs text-gray-400 mt-1">
  Tip: Include your subject tag (like "Physics") in the title for better matching.
</p>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block font-semibold mb-1" htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea textarea-bordered w-full"
          placeholder="Write a detailed description"
          rows={4}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>
    </div>
  );
};

export default GeneralPostForm;
