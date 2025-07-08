import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step6_Extras({ onNext, onBack }) {
  const { register } = useFormContext();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Additional Information (Optional)</h2>

      <div className="mb-4">
        <label className="block font-medium mb-1">Location</label>
        <input {...register('location')} className="border p-2 rounded w-full" />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Language</label>
        <input {...register('language')} className="border p-2 rounded w-full" />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">YouTube Link</label>
        <input {...register('youtubeLink')} className="border p-2 rounded w-full" />
      </div>

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
