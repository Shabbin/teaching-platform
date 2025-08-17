// Step3_LevelSubLevel.jsx — thin gray focus, no pink/purple/blue outline
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step3_LevelSubLevel({ educationTree, editMode }) {
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

  // reset on deps change
  useEffect(() => {
    setValue('level', '');
    setValue('subLevel', '');
  }, [educationSystem, board, group, setValue]);

  const showSubLevel =
    educationSystem === 'English-Medium' &&
    (board === 'CIE' || board === 'Edexcel') &&
    level === 'A_Level';

  // editability
  let isLevelEditable = true;
  if (editMode) {
    if (educationSystem === 'English-Medium') {
      if (board === 'IB') isLevelEditable = true;
      else if (board === 'CIE' || board === 'Edexcel') isLevelEditable = true;
      else isLevelEditable = false;
    } else if (educationSystem === 'Bangla-Medium') {
      isLevelEditable = true;
    } else if (educationSystem === 'University-Admission') {
      isLevelEditable = board === 'Public-University';
    } else {
      isLevelEditable = false;
    }
  }

  // one class to rule out any focus effects (ring/outline/shadow)
  const baseSelect =
    "w-full px-3 py-2 rounded-lg border bg-white appearance-none " +
    "border-gray-200 hover:border-gray-300 " +
    "outline-none focus:outline-none focus:ring-0 focus:ring-transparent " +
    "focus:shadow-none focus:border-gray-300 " +
    "focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none " +
    "disabled:bg-gray-100";

  // inline kill-switch for any plugin box-shadows (Tailwind forms/DaisyUI, etc.)
  const noFocusFX = {
    outline: 'none',
    boxShadow: 'none',
  };

  return (
    <div className="space-y-4">
      {/* LEVEL */}
      {levelsOptions.length > 0 ? (
        <div>
          <select
            {...register('level', { validate: (v) => (v ? true : 'Level is required') })}
            className={baseSelect}
            style={noFocusFX}
            onFocus={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            disabled={!isLevelEditable}
            aria-invalid={!!errors.level}
            defaultValue=""
          >
            <option value="" disabled hidden>
              Select Level
            </option>
            {levelsOptions.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
          {errors.level && <p className="mt-2 text-sm text-red-600">{errors.level.message}</p>}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No level selection needed.</p>
      )}

      {/* SUB LEVEL */}
      {showSubLevel && (
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-800">Sub Level (optional)</label>
          <select
            {...register('subLevel')}
            className={baseSelect}
            style={noFocusFX}
            onFocus={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            aria-invalid={false}
            defaultValue=""
          >
            <option value="" disabled hidden>
              Select Sub Level
            </option>
            <option value="AS_Level">AS Level</option>
            <option value="A_Level">A Level</option>
            {/* <option value="Both">Both</option> */}
          </select>
        </div>
      )}
    </div>
  );
}
