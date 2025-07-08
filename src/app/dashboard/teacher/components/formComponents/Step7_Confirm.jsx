import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step7_Confirm({ onBack, isSubmitting, onFinalSubmit }) {
  const { getValues, handleSubmit } = useFormContext();
  const formData = getValues();

  const entriesToShow = Object.entries(formData).filter(([key, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  });

  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase());
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-bold mb-4 text-blue-700">🎯 Review & Confirm Your Post</h2>
      <div className="divide-y divide-gray-200">
        {entriesToShow.map(([key, value]) => (
          <div key={key} className="py-3 grid grid-cols-12 gap-4">
            <div className="col-span-4 font-semibold text-gray-600">{formatKey(key)}</div>
            <div className="col-span-8 text-gray-800 whitespace-pre-wrap break-words">
              {Array.isArray(value) ? value.join(', ') : value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleSubmit(onFinalSubmit)}
          disabled={isSubmitting}
          className={`px-4 py-2 rounded text-white ${
            isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
        </button>
      </div>
    </div>
  );
}
