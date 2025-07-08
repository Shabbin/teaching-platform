'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { updateTeacherPost } from '../../../redux/teacherPostSlice';
import { teacherPostSchema } from '../../../../lib/zodSchemas/teacherPostSchema';

export default function EditPostForm({ post, postId, educationTree, onSuccess }) {
  const dispatch = useDispatch();
  const [subjectOptions, setSubjectOptions] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(teacherPostSchema),
    defaultValues: post,
  });

  const educationSystem = watch('educationSystem');
  const board = watch('board');
  const group = watch('group');
  const level = watch('level');
  const subLevel = watch('subLevel');
  const selectedSubjects = watch('subjects') || [];

  // Dynamically get allowed subjects from educationTree when dependencies change
  useEffect(() => {
    let subjects = [];

    try {
      if (educationSystem === 'English-Medium' && board && level) {
        subjects = Object.keys(educationTree?.['English-Medium']?.[board]?.[level] || {});
      } else if (educationSystem === 'Bangla-Medium' && level && group) {
        subjects = Object.keys(educationTree?.['Bangla-Medium']?.[level]?.[group] || {});
      } else if (educationSystem === 'University-Admission' && board) {
        const data = educationTree?.['University-Admission']?.[board];
        if (!data) subjects = [];
        else if (board === 'Public-University') subjects = data?.Units || [];
        else if (['Engineering', 'Medical'].includes(board)) subjects = data?.Subjects || [];
        else if (board === 'IBA') subjects = Object.keys(data || {});
      } else if (educationSystem === 'GED') {
        subjects = Object.keys(educationTree?.['GED'] || {});
      } else if (educationSystem === 'Entrance-Exams' && board) {
        const parts = educationTree?.['Entrance-Exams']?.[board];
        subjects = Array.isArray(parts) ? parts : Object.keys(parts || {});
      } else if (educationSystem === 'BCS' && board && group) {
        const data = educationTree?.['BCS']?.[group]?.[board];
        subjects = Array.isArray(data) ? data : Object.keys(data || {});
      }
    } catch {
      subjects = [];
    }

    setSubjectOptions(subjects || []);

    // Filter post subjects so only valid subjects remain, update form value
    if (post?.subjects?.length) {
      const filtered = post.subjects.filter((s) => subjects.includes(s));
      setValue('subjects', filtered, { shouldValidate: true, shouldDirty: true });
    }
  }, [educationSystem, board, level, group, subLevel, educationTree, post?.subjects, setValue]);

  // Toggle subject selection in the form value array
  const toggleSubject = (subject) => {
    let updated;
    if (selectedSubjects.includes(subject)) {
      updated = selectedSubjects.filter((s) => s !== subject);
    } else {
      if (selectedSubjects.length >= 5) return;
      updated = [...selectedSubjects, subject];
    }
    setValue('subjects', updated, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      const result = await dispatch(updateTeacherPost({ id: postId, updatedData: data }));
      if (updateTeacherPost.fulfilled.match(result)) {
        onSuccess();
      } else {
        alert(result.payload || 'Failed to update post');
      }
    } catch (err) {
      alert(err.message || 'Update failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Education System</label>
          <input {...register('educationSystem')} disabled className="w-full bg-gray-100 p-2 border rounded" />
        </div>
        {board && (
          <div>
            <label className="block mb-1 font-medium">Board</label>
            <input {...register('board')} disabled className="w-full bg-gray-100 p-2 border rounded" />
          </div>
        )}
        {group && (
          <div>
            <label className="block mb-1 font-medium">Group</label>
            <input {...register('group')} disabled className="w-full bg-gray-100 p-2 border rounded" />
          </div>
        )}
        {level && (
          <div>
            <label className="block mb-1 font-medium">Level</label>
            <input {...register('level')} disabled className="w-full bg-gray-100 p-2 border rounded" />
          </div>
        )}
        {subLevel && (
          <div>
            <label className="block mb-1 font-medium">SubLevel</label>
            <input {...register('subLevel')} disabled className="w-full bg-gray-100 p-2 border rounded" />
          </div>
        )}
      </div>

      <div>
        <label className="block font-medium mb-1">Subjects (Max 5)</label>
        {subjectOptions.length === 0 ? (
          <p className="text-sm text-gray-500">No subjects available for current selection.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjectOptions.map((subject) => (
              <span
                key={subject}
                onClick={() => toggleSubject(subject)}
                className={`cursor-pointer px-3 py-1 border rounded ${
                  selectedSubjects.includes(subject) ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                {subject}
              </span>
            ))}
          </div>
        )}
        {errors.subjects && <p className="text-red-600">{errors.subjects.message}</p>}
      </div>

      {/* Common editable fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input {...register('title')} className="w-full p-2 border rounded" />
          {errors.title && <p className="text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block font-medium mb-1">Hourly Rate</label>
          <input type="number" {...register('hourlyRate')} className="w-full p-2 border rounded" />
          {errors.hourlyRate && <p className="text-red-600">{errors.hourlyRate.message}</p>}
        </div>
      </div>

      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea {...register('description')} rows={4} className="w-full p-2 border rounded" />
        {errors.description && <p className="text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Location</label>
          <input {...register('location')} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">Language</label>
          <input {...register('language')} className="w-full p-2 border rounded" />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-medium mb-1">YouTube Link</label>
          <input {...register('youtubeLink')} className="w-full p-2 border rounded" />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded disabled:opacity-50"
        >
          {isSubmitting ? 'Updating...' : 'Update Post'}
        </button>
      </div>
    </form>
  );
}
