import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step5_PostDetails({ onNext, onBack, editMode }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div>
      <label className="block font-medium mb-1">Title</label>
      <input
        type="text"
        {...register('title', { required: 'Title is required' })}
        className="border p-2 rounded w-full mb-2"
      />
      {errors.title && <p className="text-red-600">{errors.title.message}</p>}

      <label className="block font-medium mb-1">Description</label>
      <textarea
        {...register('description', { required: 'Description is required' })}
        className="border p-2 rounded w-full mb-2"
        rows={5}
      />
      {errors.description && <p className="text-red-600">{errors.description.message}</p>}

      <label className="block font-medium mb-1">Hourly Rate (BDT)</label>
      <input
        type="number"
        {...register('hourlyRate', { required: 'Hourly Rate is required', min: 1 })}
        className="border p-2 rounded w-full mb-2"
        min="1"
      />
      {errors.hourlyRate && <p className="text-red-600">{errors.hourlyRate.message}</p>}

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
