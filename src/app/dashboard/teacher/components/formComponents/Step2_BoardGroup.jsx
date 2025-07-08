import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step2_BoardGroup({ educationTree, onNext, onBack, editMode }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const educationSystem = watch('educationSystem');

  let boardsOptions = [];
  let groupsOptions = [];

  if (!educationSystem) {
    return <p>Please select an education system first.</p>;
  }

  if (educationSystem === 'English-Medium') {
    boardsOptions = Object.keys(educationTree['English-Medium'] || {});
  } else if (educationSystem === 'Bangla-Medium') {
    groupsOptions = ['Science', 'Commerce', 'Arts'];
  } else if (educationSystem === 'University-Admission') {
    boardsOptions = Object.keys(educationTree['University-Admission'] || {});
  } else if (educationSystem === 'GED') {
    boardsOptions = [];
    groupsOptions = [];
  } else if (educationSystem === 'Entrance-Exams') {
    boardsOptions = Object.keys(educationTree['Entrance-Exams'] || {});
  } else if (educationSystem === 'BCS') {
    boardsOptions = Object.keys(educationTree['BCS'] || {});
    groupsOptions = ['General', 'Technical', 'Both'];
  }

  // Clear group if educationSystem changes to one that doesn't need it
  useEffect(() => {
    if (!['Bangla-Medium', 'BCS'].includes(educationSystem)) {
      setValue('group', '');
    }
  }, [educationSystem, setValue]);

  // Clear board if educationSystem changes to one that doesn't need it
  useEffect(() => {
    if (
      ![
        'English-Medium',
        'University-Admission',
        'Entrance-Exams',
        'BCS',
      ].includes(educationSystem)
    ) {
      setValue('board', '');
    }
  }, [educationSystem, setValue]);

  // Always reset board on educationSystem change
  useEffect(() => {
    setValue('board', '');
  }, [educationSystem, setValue]);

  return (
    <div>
      {boardsOptions.length > 0 && (
        <>
          <label className="block font-medium mb-1">Board</label>
          <select
            {...register('board', { required: 'Board is required' })}
            className="border p-2 rounded w-full mb-2"
            disabled={editMode && educationSystem !== 'Bangla-Medium'} // disable except for Bangla-Medium
          >
            <option value="">-- Select Board --</option>
            {boardsOptions.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>
          {errors.board && <p className="text-red-600">{errors.board.message}</p>}
        </>
      )}

      {groupsOptions.length > 0 && (
        <>
          <label className="block font-medium mb-1">Group</label>
          <select
            {...register('group', { required: 'Group is required' })}
            className="border p-2 rounded w-full mb-2"
            disabled={editMode && educationSystem !== 'Bangla-Medium'} // only enable editing group for Bangla-Medium
          >
            <option value="">-- Select Group --</option>
            {groupsOptions.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          {errors.group && <p className="text-red-600">{errors.group.message}</p>}
        </>
      )}

      {educationSystem === 'GED' && <p className="mb-2">No board or group needed for GED</p>}

      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              ['English-Medium', 'University-Admission', 'Entrance-Exams', 'BCS'].includes(
                educationSystem
              ) &&
              !watch('board')
            ) {
              alert('Please select a board.');
              return;
            }
            if (['Bangla-Medium', 'BCS'].includes(educationSystem) && !watch('group')) {
              alert('Please select a group.');
              return;
            }
            onNext();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
