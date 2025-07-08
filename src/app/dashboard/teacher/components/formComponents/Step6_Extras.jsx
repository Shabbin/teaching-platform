import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step6_Extras({ onNext, onBack, editMode }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div>
      <label className="block font-medium mb-1">Location (Optional)</label>
      <input
        type="text"
        {...register('location')}
        className="border p-2 rounded w-full mb-2"
      />

      <label className="block font-medium mb-1">Language (Optional)</label>
      <input
        type="text"
        {...register('language')}
        className="border p-2 rounded w-full mb-2"
      />

      <label className="block font-medium mb-1">YouTube Link (Optional)</label>
      <input
        type="url"
        {...register('youtubeLink')}
        className="border p-2 rounded w-full mb-2"
      />

      <label className="block font-medium mb-1">Upload Video (Optional)</label>
      <input
        type="file"
        {...register('file')}
        className="border p-2 rounded w-full mb-2"
        accept="video/*"
      />

      <div className="flex justify-between mt-4">
        <button type="button" onClick={onBack} className="px-4 py-2 bg-gray-300 rounded">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded">
          Next →
        </button>
      </div>
    </div>
  );
}
