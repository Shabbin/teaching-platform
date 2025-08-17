// Step6_Extras.jsx
import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step6_Extras({ editMode }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Location */}
      <div>
        <label className="block font-medium mb-1 text-gray-800">Location</label>
        <input
          type="text"
          placeholder="e.g., Dhaka, Mirpur"
          {...register('location')}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
        />
        {errors.location && (
          <p className="mt-2 text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>

      {/* Language */}
      <div>
        <label className="block font-medium mb-1 text-gray-800">Language</label>
        <input
          type="text"
          placeholder="e.g., Bangla, English"
          {...register('language')}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
        />
        {errors.language && (
          <p className="mt-2 text-sm text-red-600">{errors.language.message}</p>
        )}
      </div>

      {/* YouTube Link */}
      <div>
        <label className="block font-medium mb-1 text-gray-800">YouTube Link</label>
        <input
          type="url"
          placeholder="https://youtube.com/..."
          {...register('youtubeLink')}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
        />
        {errors.youtubeLink && (
          <p className="mt-2 text-sm text-red-600">{errors.youtubeLink.message}</p>
        )}
      </div>

      {/* Upload Video */}
      <div>
        <label className="block font-medium mb-1 text-gray-800">Upload Video</label>
        <input
          type="file"
          accept="video/*"
          {...register('videoFile')}
          className="w-full rounded-xl border border-gray-200 bg-white
                     file:mr-3 file:px-4 file:py-2 file:border-0 file:rounded-lg file:bg-gray-100 file:text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
        />
        <p className="mt-2 text-xs text-gray-500">Optional. Max size depends on server limits.</p>
        {errors.videoFile && (
          <p className="mt-2 text-sm text-red-600">{errors.videoFile.message}</p>
        )}
      </div>
    </div>
  );
}
