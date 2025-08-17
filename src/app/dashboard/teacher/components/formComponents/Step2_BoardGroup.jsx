// Step2_BoardGroup.jsx — thin gray borders + no pink/purple focus highlight
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step2_BoardGroup({ educationTree, editMode }) {
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
    return <p className="text-gray-500 text-sm">Please select an education system first.</p>;
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
    if (!['English-Medium', 'University-Admission', 'Entrance-Exams', 'BCS'].includes(educationSystem)) {
      setValue('board', '');
    }
  }, [educationSystem, setValue]);

  // Always reset board on educationSystem change
  useEffect(() => {
    setValue('board', '');
  }, [educationSystem, setValue]);

  // shared styles that kill any colored focus ring/outline/shadow
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
      {/* BOARD (no label; placeholder disabled + hidden) */}
      {boardsOptions.length > 0 && (
        <div>
          <select
            {...register('board', { validate: (v) => (v ? true : 'Board is required') })}
            className={baseSelect}
            style={noFocusFX}
            onFocus={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            disabled={editMode && educationSystem !== 'Bangla-Medium'}
            aria-invalid={!!errors.board}
            defaultValue=""
          >
            <option value="" disabled hidden>
              Select Board
            </option>
            {boardsOptions.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>
          {errors.board && <p className="mt-2 text-sm text-red-600">{errors.board.message}</p>}
        </div>
      )}

      {/* GROUP (keep label) */}
      {groupsOptions.length > 0 && (
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-800">Group</label>
          <select
            {...register('group', { validate: (v) => (v ? true : 'Group is required') })}
            className={baseSelect}
            style={noFocusFX}
            onFocus={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            disabled={editMode && educationSystem !== 'Bangla-Medium'}
            aria-invalid={!!errors.group}
            defaultValue=""
          >
            <option value="" disabled hidden>
              Select Group
            </option>
            {groupsOptions.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          {errors.group && <p className="mt-2 text-sm text-red-600">{errors.group.message}</p>}
        </div>
      )}

      {educationSystem === 'GED' && (
        <p className="text-gray-500 text-sm">No board or group needed for GED.</p>
      )}
    </div>
  );
}
