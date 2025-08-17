// Step5_PostDetails.jsx
import React from 'react';
import dynamic from 'next/dynamic';
import { useFormContext, Controller } from 'react-hook-form';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    [{ align: [] }],
    ['clean'],
  ],
};

export default function Step5_PostDetails({ editMode }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <label className="block font-medium mb-1 text-gray-800">Title</label>
        <input
          type="text"
          placeholder="e.g., A-Level Physics Tutor – Exam Success"
          {...register('title', { required: 'Title is required' })}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      {/* Description (react-quill-new) */}
      <div>
        <label className="block font-medium mb-2 text-gray-800">Description</label>
        <div
          className="rounded-xl border border-gray-200 bg-white overflow-hidden
                     focus-within:ring-2 focus-within:ring-gray-300 focus-within:border-gray-300 transition
                     [&_.ql-toolbar]:!border-0 [&_.ql-toolbar]:!border-b [&_.ql-toolbar]:!border-gray-200
                     [&_.ql-container]:!border-0 [&_.ql-editor]:min-h-[180px]"
        >
          <Controller
            name="description"
            control={control}
            rules={{ required: 'Description is required' }}
            render={({ field }) => (
              <ReactQuill
                theme="snow"
                value={typeof field.value === 'string' ? field.value : ''}  // single source of truth
                onChange={(content, delta, source, editor) => {
                  // Use editor.getHTML() to avoid any oddities in content arg
                  field.onChange(editor.getHTML());
                }}
                onBlur={field.onBlur}
                modules={quillModules}
                placeholder="Describe your teaching style, experience, and what learners can expect…"
              />
            )}
          />
        </div>
        {errors.description && (
          <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Hourly Rate */}
      <div>
        <label className="block font-medium mb-1 text-gray-800">Hourly Rate (BDT)</label>
        <div className="flex items-stretch gap-2">
          <input
            type="number"
            min="1"
            step="1"
            placeholder="e.g., 500"
            {...register('hourlyRate', { required: 'Hourly Rate is required', min: 1 })}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
            aria-invalid={!!errors.hourlyRate}
          />
          <div className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 flex items-center">
            ৳ BDT
          </div>
        </div>
        {errors.hourlyRate && (
          <p className="mt-2 text-sm text-red-600">{errors.hourlyRate.message}</p>
        )}
      </div>
    </div>
  );
}
