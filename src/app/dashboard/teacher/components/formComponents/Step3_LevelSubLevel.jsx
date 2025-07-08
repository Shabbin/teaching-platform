import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step3_LevelSubLevel({ educationTree, onNext, onBack }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const educationSystem = watch('educationSystem');
  const board = watch('board');
  const group = watch('group');
  const level = watch('level');
  const subLevel = watch('subLevel');

  // Determine levels based on education system + board or group
  let levelsOptions = [];

  if (educationSystem === 'English-Medium' && board) {
    levelsOptions = Object.keys(educationTree['English-Medium'][board] || {});
  } else if (educationSystem === 'Bangla-Medium' && group) {
    levelsOptions = Object.keys(educationTree['Bangla-Medium'] || {});
    // Usually levels like SSC, HSC, etc
  } else if (educationSystem === 'University-Admission' && board === 'Public-University') {
    levelsOptions = Object.keys(educationTree['University-Admission'][board] || {});
  } else {
    // No levels for GED, Entrance-Exams, BCS, or University-Admission (except Public-University)
  }

  // Reset subLevel and level when dependencies change
  useEffect(() => {
    setValue('level', '');
    setValue('subLevel', '');
  }, [educationSystem, board, group]);

  // SubLevel only for English-Medium with A_Level board = CIE or Edexcel and level = A_Level
  const showSubLevel =
    educationSystem === 'English-Medium' &&
    (board === 'CIE' || board === 'Edexcel') &&
    level === 'A_Level';

  return (
    <div>
      {levelsOptions.length > 0 ? (
        <>
          <label className="block font-medium mb-1">Level</label>
          <select {...register('level', { required: 'Level is required' })} className="border p-2 rounded w-full mb-2">
            <option value="">-- Select Level --</option>
            {levelsOptions.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
          {errors.level && <p className="text-red-600">{errors.level.message}</p>}
        </>
      ) : (
        <p>No level selection needed.</p>
      )}

      {showSubLevel && (
        <>
          <label className="block font-medium mb-1">Sub Level (optional)</label>
          <select {...register('subLevel')} className="border p-2 rounded w-full mb-2">
            <option value="">-- Select Sub Level --</option>
            <option value="AS_Level">AS Level</option>
            <option value="A_Level">A Level</option>
            <option value="Both">Both</option>
          </select>
        </>
      )}

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
