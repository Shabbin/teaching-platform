// Step4_SubjectsTags.jsx — thinner, light borders like Step5; logic unchanged
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step4_SubjectsTags({ educationTree, editMode }) {
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext();

  const educationSystem = watch('educationSystem');
  const board = watch('board');
  const level = watch('level');
  const group = watch('group');
  const subLevel = watch('subLevel');

  const [subjectsOptions, setSubjectsOptions] = useState([]);

  useEffect(() => {
    let subjects = [];
    try {
      if (educationSystem === 'English-Medium' && board && level) {
        const subjData = educationTree['English-Medium'][board]?.[level] || {};
        subjects = Object.keys(subjData);
      } else if (educationSystem === 'Bangla-Medium' && level && group) {
        const groupSubjects = educationTree['Bangla-Medium']?.[level]?.[group];
        subjects = groupSubjects ? Object.keys(groupSubjects) : [];
      } else if (educationSystem === 'University-Admission' && board) {
        const data = educationTree['University-Admission'][board];
        if (!data) subjects = [];
        else if (board === 'Public-University') subjects = data?.Units || [];
        else if (['Engineering', 'Medical'].includes(board)) subjects = data?.Subjects || [];
        else if (board === 'IBA') subjects = Object.keys(data || {});
      } else if (educationSystem === 'GED') {
        subjects = Object.keys(educationTree['GED'] || {});
      } else if (educationSystem === 'Entrance-Exams' && board) {
        const examData = educationTree['Entrance-Exams'][board];
        subjects = Array.isArray(examData) ? examData : Object.keys(examData || {});
      } else if (educationSystem === 'BCS' && board && group) {
        const bcsSubjects = educationTree['BCS']?.[group]?.[board];
        subjects = Array.isArray(bcsSubjects) ? bcsSubjects : Object.keys(bcsSubjects || {});
      }
    } catch {
      subjects = [];
    }

    setSubjectsOptions(subjects);
    // reset WITHOUT validation so no error shows on entry
    setValue('subjects', [], { shouldValidate: false, shouldDirty: false, shouldTouch: false });
    clearErrors('subjects');
  }, [educationSystem, board, level, group, subLevel, educationTree, setValue, clearErrors]);

  const selectedSubjects = watch('subjects') || [];

  // edit-mode rules (unchanged)
  let isSubjectEditable = false;
  if (editMode) {
    if (educationSystem === 'English-Medium') {
      if (board === 'CIE' || board === 'Edexcel') isSubjectEditable = true;
      else if (board === 'IB') isSubjectEditable = true;
    } else if (educationSystem === 'Bangla-Medium') {
      isSubjectEditable = true;
    } else if (educationSystem === 'University-Admission') {
      isSubjectEditable = ['Engineering', 'Medical', 'IBA'].includes(board);
    } else if (educationSystem === 'GED' || educationSystem === 'Entrance-Exams') {
      isSubjectEditable = true;
    }
  } else {
    isSubjectEditable = true; // create mode
  }

  const MAX = 5;
  const atLimit = selectedSubjects.length >= MAX;

  const toggleSubject = (subject) => {
    if (!isSubjectEditable) return;
    const isSelected = selectedSubjects.includes(subject);

    if (isSelected) {
      const next = selectedSubjects.filter((s) => s !== subject);
      setValue('subjects', next, { shouldValidate: false, shouldDirty: true });
    } else {
      if (atLimit) return;
      const next = [...selectedSubjects, subject];
      setValue('subjects', next, { shouldValidate: false, shouldDirty: true });
    }
  };

  return (
    <div className="space-y-3">
      {/* Count only (e.g., 0/5 selected) */}
      <div className="flex items-center justify-end">
        <span className="text-xs text-gray-500">
          {selectedSubjects.length}/{MAX} selected
        </span>
      </div>

      {subjectsOptions.length === 0 && (
        <p className="text-gray-500 text-sm">No subjects available for the selected options.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto rounded-lg border bg-white p-2 border-gray-200">
        {subjectsOptions.map((subject) => {
          const selected = selectedSubjects.includes(subject);
          const disabled = !isSubjectEditable || (!selected && atLimit);

          return (
            <button
              type="button"
              key={subject}
              onClick={() => toggleSubject(subject)}
              disabled={disabled}
              aria-pressed={selected}
              className={`px-2.5 py-1.5 rounded-md border text-[13px] leading-5 transition
                ${selected
                  ? 'bg-[var(--brand)] border-[var(--brand)] text-white'
                  : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}
                ${disabled && !selected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {subject}
            </button>
          );
        })}
      </div>

      {/* Shows ONLY after Next triggers validation */}
      {errors.subjects && (
        <p className="text-sm text-red-600">Select at least one subject.</p>
      )}
    </div>
  );
}
