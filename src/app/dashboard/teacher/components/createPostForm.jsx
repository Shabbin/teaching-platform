'use client'
import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { teacherPostSchema } from '../../../../lib/zodSchemas/teacherPostSchema';
import { createTeacherPost, resetError } from '../../../redux/teacherPostSlice';

export default function CreatePostForm() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.teacherPosts);
  const [educationTree, setEducationTree] = useState(null);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/education-tree')
      .then((res) => setEducationTree(res.data))
      .catch(() => setEducationTree(null));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(teacherPostSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      educationSystem: '',
      board: '',
      level: '',
      subLevel: '',
      group: '',
      subjects: [],
      tags: [],
      location: '',
      language: '',
      hourlyRate: '',
      youtubeLink: '',
      videoFile: null,
     
    },
  });

  const educationSystem = watch('educationSystem');
  const board = watch('board');
  const level = watch('level');
  const group = watch('group');
  const subjects = watch('subjects') || [];
  const tags = watch('tags') || [];

  // Reset dependent fields when parent fields change
  useEffect(() => {
    setValue('board', '');
    setValue('level', '');
    setValue('subLevel', '');
    setValue('group', '');
    setValue('subjects', []);
    setValue('tags', []);
  }, [educationSystem, setValue]);

  useEffect(() => {
    if (
      educationSystem === 'University-Admission' &&
      ['Engineering', 'Medical', 'IBA'].includes(board)
    ) {
      setValue('level', '');
    } else {
      setValue('level', '');
      setValue('subLevel', '');
      setValue('subjects', []);
      setValue('tags', []);
    }
  }, [board, educationSystem, setValue]);

  useEffect(() => {
    setValue('subLevel', '');
    setValue('subjects', []);
  }, [level, setValue]);

  useEffect(() => {
    setValue('subjects', []);
  }, [group, setValue]);

  useEffect(() => {
    if (
      educationSystem === 'Entrance-Exams' &&
      educationTree?.['Entrance-Exams']
    ) {
      const parts = Object.keys(educationTree['Entrance-Exams']);
      if (parts.length > 0) {
        setValue('board', parts[0]); // Optional: you might want to remove auto select
      }
    }
  }, [educationSystem, educationTree, setValue]);

  const getBoards = useMemo(() => {
    if (!educationTree || !educationSystem) return [];

    if (educationSystem === 'Bangla-Medium' || educationSystem === 'GED') return [];

    if (educationSystem === 'BCS') return ['Preliminary', 'Written', 'Viva'];

    if (educationSystem === 'Entrance-Exams') {
      return Object.keys(educationTree['Entrance-Exams'] || {});
    }

    return Object.keys(educationTree[educationSystem] || {});
  }, [educationTree, educationSystem]);

  const getLevels = useMemo(() => {
    if (!educationTree || !educationSystem) return [];

    if (educationSystem === 'Entrance-Exams') return [];

    if (
      educationSystem === 'University-Admission' &&
      ['Engineering', 'Medical', 'IBA'].includes(board)
    ) {
      return [];
    }

    if (educationSystem === 'Bangla-Medium') {
      return Object.keys(educationTree[educationSystem] || {});
    }

    if (educationSystem === 'University-Admission' && board === 'Public-University') {
      return [];
    }

    return board ? Object.keys(educationTree[educationSystem]?.[board] || {}) : [];
  }, [educationTree, educationSystem, board]);

  const getGroups = useMemo(() => {
    if (educationSystem === 'Bangla-Medium') return ['Science', 'Commerce', 'Arts'];
    if (educationSystem === 'BCS') return ['General', 'Technical', 'Both'];
    return [];
  }, [educationSystem]);

  const getSubjects = useMemo(() => {
    if (!educationTree || !educationSystem) return [];

    if (educationSystem === 'Bangla-Medium') {
      return level && group
        ? Object.keys(educationTree[educationSystem]?.[level]?.[group] || {})
        : [];
    }

    if (educationSystem === 'GED') {
      return Object.keys(educationTree[educationSystem] || {});
    }

    if (educationSystem === 'University-Admission') {
      const data = educationTree[educationSystem]?.[board];
      if (!data) return [];
      if (board === 'Public-University') return data?.Units || [];
      if (['Engineering', 'Medical'].includes(board)) return data?.Subjects || [];
      if (board === 'IBA') return Object.keys(data || {});
    }

    if (educationSystem === 'BCS') {
      return board && group
        ? Object.keys(educationTree[educationSystem]?.[group]?.[board] || {})
        : [];
    }

    if (educationSystem === 'Entrance-Exams') {
      const partsObj = educationTree?.['Entrance-Exams']?.[board]?.Parts;
      return partsObj ? Object.keys(partsObj) : [];
    }

    return board && level
      ? Object.keys(educationTree[educationSystem]?.[board]?.[level] || {})
      : [];
  }, [educationTree, educationSystem, board, level, group]);

  const getTargetedUniversities = useMemo(() => {
    return educationSystem === 'University-Admission' && board
      ? educationTree?.[educationSystem]?.[board]?.Universities || []
      : [];
  }, [educationTree, educationSystem, board]);

  const showSubLevel = useMemo(() => {
    if (!educationSystem || !board || !level) return false;
    if (
      educationSystem === 'English-Medium' &&
      ((board === 'CIE' || board === 'Edexcel') && level === 'A_Level')
    )
      return true;

    if (
      educationSystem === 'English-Medium' &&
      board === 'IB' &&
      (level === 'SL' || level === 'HL')
    )
      return true;

    return false;
  }, [educationSystem, board, level]);

  function onSubjectsChange(e) {
    const selectedOptions = Array.from(e.target.selectedOptions).map((o) => o.value);
    if (selectedOptions.length <= 5) {
      setValue('subjects', selectedOptions, { shouldValidate: true });
    }
  }

  function onTagsChange(e) {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setValue('tags', selected, { shouldValidate: true });
  }

  // === NEW: Normalize arrays before dispatch ===
const onSubmit = (data) => {
  console.log('--- Raw form data ---');
  console.log(data);

  const formData = new FormData();

  // Arrays
  (data.subjects || []).filter(Boolean).forEach(sub => {
    formData.append('subjects', sub);
    console.log('Appending subject:', sub);
  });
  (data.tags || []).filter(Boolean).forEach(tag => {
    formData.append('tags', tag);
    console.log('Appending tag:', tag);
  });

  // All other fields
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'subjects' || key === 'tags') return;

    if (key === 'videoFile') {
      if (value && value.length > 0) {
        formData.append('videoFile', value[0]);
        console.log('Appending videoFile:', value[0].name);
      } else {
        console.log('No video file selected.');
      }
    } else if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
      console.log(`Appending field: ${key} => ${value}`);
    }
  });

  // Debug FormData content
  console.log('--- Final FormData ---');
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  dispatch(createTeacherPost(formData))
    .unwrap()
    .then(() => {
      alert('Post created successfully');
      reset();
    })
    .catch(err => alert('Failed to create post: ' + err));
};




  dispatch(createTeacherPost(formData))
    .unwrap()
    .then(() => {
      alert('Post created successfully');
      reset();
    })
    .catch((err) => alert('Failed to create post: ' + err));
};

  // dispatch FormData directly
  dispatch(createTeacherPost(formData))
    .unwrap()
    .then(() => {
      alert('Post created successfully');
      reset();
    })
    .catch((err) => alert('Failed to create post: ' + err));



  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-3xl mx-auto p-6 bg-white rounded shadow space-y-4"
      encType="multipart/form-data"
    >
      {/* Title */}
      <div>
        <label className="font-semibold block">Title</label>
        <input {...register('title')} className="w-full border px-3 py-2 rounded" />
        {errors.title && <p className="text-red-600">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="font-semibold block">Description</label>
        <textarea {...register('description')} rows={4} className="w-full border px-3 py-2 rounded" />
        {errors.description && <p className="text-red-600">{errors.description.message}</p>}
      </div>

      {/* Education System */}
      <div>
        <label className="font-semibold block">Education System</label>
        <select {...register('educationSystem')} className="w-full border px-3 py-2 rounded">
          <option value="">Select</option>
          {educationTree &&
            Object.keys(educationTree).map((es) => (
              <option key={es} value={es}>
                {es}
              </option>
            ))}
        </select>
        {errors.educationSystem && <p className="text-red-600">{errors.educationSystem.message}</p>}
      </div>

      {/* Group */}
      {getGroups.length > 0 && (
        <div>
          <label className="font-semibold block">Group / Category</label>
          <select {...register('group')} className="w-full border px-3 py-2 rounded">
            <option value="">Select</option>
            {getGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {errors.group && <p className="text-red-600">{errors.group.message}</p>}
        </div>
      )}

      {/* Board */}
      {educationSystem !== 'Entrance-Exams' && getBoards.length > 0 && (
        <div>
          <label className="font-semibold block">Board / Track</label>
          <select {...register('board')} className="w-full border px-3 py-2 rounded">
            <option value="">Select</option>
            {getBoards.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {errors.board && <p className="text-red-600">{errors.board.message}</p>}
        </div>
      )}

      {/* Entrance-Exams Board */}
      {educationSystem === 'Entrance-Exams' && getBoards.length > 0 && (
        <div>
          <label className="font-semibold block">Exam</label>
          <select {...register('board')} className="w-full border px-3 py-2 rounded">
            <option value="">Select Exam</option>
            {getBoards.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>
          {errors.board && <p className="text-red-600">{errors.board.message}</p>}
        </div>
      )}

      {/* Level */}
      {getLevels.length > 0 && (
        <div>
          <label className="font-semibold block">Level</label>
          <select {...register('level')} className="w-full border px-3 py-2 rounded">
            <option value="">Select</option>
            {getLevels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          {errors.level && <p className="text-red-600">{errors.level.message}</p>}
        </div>
      )}

      {/* SubLevel */}
      {showSubLevel && (
        <div>
          <label className="font-semibold block">SubLevel</label>
          <select {...register('subLevel')} className="w-full border px-3 py-2 rounded">
            <option value="">Select</option>
            <option value="AS">AS</option>
            <option value="A2">A2</option>
            <option value="Both">Both</option>
          </select>
          {errors.subLevel && <p className="text-red-600">{errors.subLevel.message}</p>}
        </div>
      )}

      {/* Subjects */}
      {getSubjects.length > 0 && (
        <div>
          <label className="font-semibold block">Subjects (max 5)</label>
          <select
            multiple
            size={Math.min(5, getSubjects.length)}
            className="w-full border px-3 py-2 rounded"
            value={subjects}
            onChange={onSubjectsChange}
          >
            {getSubjects.map((sub) => (
              <option
                key={sub}
                value={sub}
                disabled={!subjects.includes(sub) && subjects.length >= 5}
              >
                {sub}
              </option>
            ))}
          </select>
          {errors.subjects && <p className="text-red-600">{errors.subjects.message}</p>}
        </div>
      )}

      {/* Targeted Universities */}
      {getTargetedUniversities.length > 0 && (
        <div>
          <label className="font-semibold block">Targeted Universities</label>
          <select
            multiple
            className="w-full border px-3 py-2 rounded"
            value={tags}
            onChange={onTagsChange}
          >
            {getTargetedUniversities.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          {errors.tags && <p className="text-red-600">{errors.tags.message}</p>}
        </div>
      )}

      {/* Hourly Rate */}
      <div>
        <label className="font-semibold block">Hourly Rate</label>
        <input
          type="number"
          {...register('hourlyRate')}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.hourlyRate && <p className="text-red-600">{errors.hourlyRate.message}</p>}
      </div>

      {/* Location */}
      <div>
        <label className="font-semibold block">Location</label>
        <input {...register('location')} className="w-full border px-3 py-2 rounded" />
      </div>

      {/* Language */}
      <div>
        <label className="font-semibold block">Language</label>
        <input {...register('language')} className="w-full border px-3 py-2 rounded" />
      </div>

      {/* YouTube Link */}
      <div>
        <label className="font-semibold block">YouTube Link</label>
        <input
          type="url"
          {...register('youtubeLink')}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.youtubeLink && <p className="text-red-600">{errors.youtubeLink.message}</p>}
      </div>

      {/* File Upload */}
      <div>
        <label className="font-semibold block">Video File (optional)</label>
       <input
  type="file"
  accept="video/*"
  onChange={(e) => setValue('videoFile', e.target.files)}
  className="w-full"
/>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading || isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
        {error && (
          <p
            className="text-red-600 mt-2 cursor-pointer"
            onClick={() => dispatch(resetError())}
            title="Click to dismiss"
          >
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
