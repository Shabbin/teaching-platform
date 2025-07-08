import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step5_PostDetails({ onNext, onBack }) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();

  return (
    <div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Title</label>
        <input
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 5, message: 'Title must be at least 5 characters' },
          })}
          className="border p-2 rounded w-full"
          placeholder="Enter post title"
        />
        {errors.title && <p className="text-red-600">{errors.title.message}</p>}
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Description</label>
        <textarea
          {...register('description', {
            required: 'Description is required',
            minLength: { value: 10, message: 'Description must be at least 10 characters' },
          })}
          className="border p-2 rounded w-full"
          rows={4}
          placeholder="Write a detailed description"
        />
        {errors.description && <p className="text-red-600">{errors.description.message}</p>}
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Hourly Rate</label>
        <input
          type="number"
          {...register('hourlyRate', {
            required: 'Hourly rate is required',
            min: { value: 0, message: 'Hourly rate must be positive' },
          })}
          className="border p-2 rounded w-full"
          placeholder="Enter hourly rate"
        />
        {errors.hourlyRate && <p className="text-red-600">{errors.hourlyRate.message}</p>}
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
