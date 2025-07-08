import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step4_SubjectsTags({ educationTree, onNext, onBack, editMode }) {
  const {
    register,
    watch,
    setValue,
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
    setValue('subjects', []); // reset subjects on dependencies change
  }, [educationSystem, board, level, group, subLevel, educationTree, setValue]);

  const selectedSubjects = watch('subjects') || [];

  // Define when subjects are editable
  let isSubjectEditable = false;

  if (editMode) {
    if (educationSystem === 'English-Medium') {
      if (board === 'CIE' || board === 'Edexcel') {
        // For A_Level: sublevel + subjects editable
        if (level === 'A_Level') {
          isSubjectEditable = true;
        } else if (level === 'O_Level') {
          isSubjectEditable = true;
        }
      } else if (board === 'IB') {
        // IB level and subjects editable (handled elsewhere)
        isSubjectEditable = true;
      }
    } else if (educationSystem === 'Bangla-Medium') {
      isSubjectEditable = true; // subjects editable when level/group changes
    } else if (educationSystem === 'University-Admission') {
      if (board === 'Public-University') {
        isSubjectEditable = false; // only units editable (handled in level step)
      } else if (['Engineering', 'Medical', 'IBA'].includes(board)) {
        isSubjectEditable = true;
      }
    } else if (educationSystem === 'GED' || educationSystem === 'Entrance-Exams') {
      isSubjectEditable = true;
    }
  } else {
    // Create mode subjects are always editable
    isSubjectEditable = true;
  }

  const toggleSubject = (subject) => {
    if (!isSubjectEditable) return;
    let newSubjects;
    if (selectedSubjects.includes(subject)) {
      newSubjects = selectedSubjects.filter((s) => s !== subject);
    } else {
      if (selectedSubjects.length >= 5) return; // max 5
      newSubjects = [...selectedSubjects, subject];
    }
    setValue('subjects', newSubjects, { shouldValidate: true });
  };

  return (
    <div>
      <p className="mb-2 font-medium">Select up to 5 Subjects</p>

      {subjectsOptions.length === 0 && <p>No subjects available for selected options.</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto border rounded p-2 mb-4">
        {subjectsOptions.map((subject) => (
          <label
            key={subject}
            className={`cursor-pointer border px-3 py-1 rounded ${
              selectedSubjects.includes(subject) ? 'bg-blue-600 text-white' : ''
            } ${!isSubjectEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              value={subject}
              checked={selectedSubjects.includes(subject)}
              onChange={() => toggleSubject(subject)}
              className="mr-2"
              disabled={!isSubjectEditable}
            />
            {subject}
          </label>
        ))}
      </div>
      {errors.subjects && <p className="text-red-600">{errors.subjects.message}</p>}

      <div className="flex justify-between mt-4">
        <button type="button" onClick={onBack} className="px-4 py-2 bg-gray-300 rounded">
          ← Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedSubjects.length === 0) {
              alert('Please select at least one subject.');
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
