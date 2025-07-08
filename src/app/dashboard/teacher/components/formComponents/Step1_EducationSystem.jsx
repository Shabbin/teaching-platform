import React from 'react';
import { useFormContext } from 'react-hook-form';

const educationSystems = [
  'English-Medium',
  'Bangla-Medium',
  'University-Admission',
  'GED',
  'Entrance-Exams',
  'BCS',
];

export default function Step1_EducationSystem({ onNext }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const selected = watch('educationSystem');

  return (
    <div>
      <label className="block font-medium mb-1">Select Education System</label>
      <select {...register('educationSystem', { required: 'Education System is required' })} className="border p-2 rounded w-full mb-2">
        <option value="">-- Select --</option>
        {educationSystems.map((sys) => (
          <option key={sys} value={sys}>
            {sys}
          </option>
        ))}
      </select>
      {errors.educationSystem && <p className="text-red-600">{errors.educationSystem.message}</p>}

      <button
        type="button"
        onClick={onNext}
        disabled={!selected}
        className={`mt-4 px-4 py-2 rounded text-white ${selected ? 'bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`}
      >
        Next →
      </button>
    </div>
  );
}
