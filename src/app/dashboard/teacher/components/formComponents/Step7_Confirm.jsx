import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step7_Confirm({ onBack, onFinalSubmit, isSubmitting }) {
  const { getValues } = useFormContext();
  const data = getValues();

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Please review your post</h3>

      <div className="mb-4 space-y-2 text-sm">
        <p>
          <strong>Education System:</strong> {data.educationSystem}
        </p>

        {data.board && (
          <p>
            <strong>Board:</strong> {data.board}
          </p>
        )}

        {data.group && (
          <p>
            <strong>Group:</strong> {data.group}
          </p>
        )}

        {data.level && (
          <p>
            <strong>Level:</strong> {data.level}
          </p>
        )}

        {data.subLevel && (
          <p>
            <strong>Sub Level:</strong> {data.subLevel}
          </p>
        )}

        {data.subjects && data.subjects.length > 0 && (
          <p>
            <strong>Subjects:</strong> {data.subjects.join(', ')}
          </p>
        )}

        <p>
          <strong>Title:</strong> {data.title}
        </p>

        <p>
          <strong>Description:</strong> {data.description}
        </p>

        <p>
          <strong>Hourly Rate:</strong> BDT {data.hourlyRate}
        </p>

        {data.location && (
          <p>
            <strong>Location:</strong> {data.location}
          </p>
        )}

        {data.language && (
          <p>
            <strong>Language:</strong> {data.language}
          </p>
        )}

        {data.youtubeLink && (
          <p>
            <strong>YouTube Link:</strong>{' '}
            <a
              href={data.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {data.youtubeLink}
            </a>
          </p>
        )}

        {data.videoFile && data.videoFile.length > 0 && (
          <p>
            <strong>Video File:</strong> {data.videoFile[0].name}
          </p>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onFinalSubmit}
          disabled={isSubmitting}
          className={`px-4 py-2 rounded text-white ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
