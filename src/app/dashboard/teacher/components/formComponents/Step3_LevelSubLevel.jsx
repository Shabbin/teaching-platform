import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step3_LevelSubLevel({ educationTree, onNext, onBack, editMode }) {
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

  let levelsOptions = [];

  if (educationSystem === 'English-Medium' && board) {
    levelsOptions = Object.keys(educationTree['English-Medium'][board] || {});
  } else if (educationSystem === 'Bangla-Medium' && group) {
    levelsOptions = Object.keys(educationTree['Bangla-Medium'] || {});
  } else if (educationSystem === 'University-Admission' && board === 'Public-University') {
    levelsOptions = Object.keys(educationTree['University-Admission'][board] || {});
  }

  // Reset level and subLevel on educationSystem/board/group change
  useEffect(() => {
    setValue('level', '');
    setValue('subLevel', '');
  }, [educationSystem, board, group, setValue]);

  // Show subLevel select only for English-Medium A_Level CIE/Edexcel
  const showSubLevel =
    educationSystem === 'English-Medium' &&
    (board === 'CIE' || board === 'Edexcel') &&
    level === 'A_Level';

  // Determine if level select is editable based on your rules:
  let isLevelEditable = true;

  if (editMode) {
    if (educationSystem === 'English-Medium') {
      if (board === 'IB') {
        isLevelEditable = true; // level editable
      } else if (board === 'CIE' || board === 'Edexcel') {
        isLevelEditable = true; // level editable (for A_Level)
      } else {
        isLevelEditable = false; // O_Level level fixed
      }
    } else if (educationSystem === 'Bangla-Medium') {
      isLevelEditable = true; // can change SSC or HSC
    } else if (educationSystem === 'University-Admission') {
      if (board === 'Public-University') {
        isLevelEditable = true; // units editable
      } else {
        isLevelEditable = false; // other boards no level editing
      }
    } else {
      isLevelEditable = false; // GED, Entrance-Exams, BCS no level editing
    }
  }

  return (
    <div>
      {levelsOptions.length > 0 ? (
        <>
          <label className="block font-medium mb-1">Level</label>
          <select
            {...register('level', { required: 'Level is required' })}
            className="border p-2 rounded w-full mb-2"
            disabled={!isLevelEditable}
          >
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
          <select
            {...register('subLevel')}
            className="border p-2 rounded w-full mb-2"
            disabled={editMode ? false : false} // always enable editing subLevel for A_Level in English-Medium
          >
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
