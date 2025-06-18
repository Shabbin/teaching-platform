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
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input input-bordered w-full"
          placeholder="Post title"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
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
