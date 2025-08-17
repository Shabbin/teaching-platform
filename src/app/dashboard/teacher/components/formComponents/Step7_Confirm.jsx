// Step7_Confirm.jsx
import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step7_Confirm() {
  const { getValues } = useFormContext();
  const data = getValues();

  const Row = ({ label, children }) => (
    <div className="flex items-start gap-4 py-2 border-b last:border-b-0 border-gray-100">
      <div className="w-40 shrink-0 text-sm font-medium text-gray-600">{label}</div>
      <div className="flex-1 text-sm text-gray-800 break-words">{children}</div>
    </div>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="p-4">
        {data.educationSystem && <Row label="Education System">{data.educationSystem}</Row>}
        {data.board && <Row label="Board">{data.board}</Row>}
        {data.group && <Row label="Group">{data.group}</Row>}
        {data.level && <Row label="Level">{data.level}</Row>}
        {data.subLevel && <Row label="Sub Level">{data.subLevel}</Row>}
        {Array.isArray(data.subjects) && data.subjects.length > 0 && (
          <Row label="Subjects">{data.subjects.join(', ')}</Row>
        )}
        {data.title && <Row label="Title">{data.title}</Row>}
        {data.description && (
          <Row label="Description">
            {/* If you used a rich text editor, this is HTML */}
            <div
              className="text-sm leading-6"
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          </Row>
        )}
        {data.hourlyRate && <Row label="Hourly Rate">BDT {data.hourlyRate}</Row>}
        {data.location && <Row label="Location">{data.location}</Row>}
        {data.language && <Row label="Language">{data.language}</Row>}
        {data.youtubeLink && (
          <Row label="YouTube Link">
            <a
              href={data.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {data.youtubeLink}
            </a>
          </Row>
        )}
        {data.videoFile && data.videoFile.length > 0 && (
          <Row label="Video File">{data.videoFile[0]?.name}</Row>
        )}
      </div>
    </div>
  );
}
