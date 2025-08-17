// Step1_EducationSystem.jsx — thin border, no pink/purple focus highlight
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

export default function Step1_EducationSystem({ editMode }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // shared styles to kill any colored focus ring/outline/shadow
  const baseSelect =
    "w-full px-3 py-2 rounded-lg border bg-white appearance-none " +
    "border-gray-200 hover:border-gray-300 " +
    "outline-none focus:outline-none focus:ring-0 focus:ring-transparent " +
    "focus:shadow-none focus:border-gray-300 " +
    "focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none " +
    "disabled:bg-gray-100";
  const noFocusFX = { outline: 'none', boxShadow: 'none' };

  return (
    <div className="space-y-4">
      <div>
        <select
          // use custom validate instead of native required to avoid browser pink highlight
          {...register('educationSystem', {
            validate: (v) => (v ? true : 'Education System is required'),
          })}
          className={baseSelect}
          style={noFocusFX}
          onFocus={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          disabled={editMode}
          defaultValue=""
          aria-invalid={!!errors.educationSystem}
        >
          {/* hidden + disabled placeholder */}
          <option value="" disabled hidden>
            Select Education System
          </option>

          {educationSystems.map((sys) => (
            <option key={sys} value={sys}>
              {sys}
            </option>
          ))}
        </select>

        {errors.educationSystem && (
          <p className="mt-2 text-sm text-red-600">{errors.educationSystem.message}</p>
        )}
      </div>
    </div>
  );
}
