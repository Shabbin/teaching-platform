'use client';
import React from 'react';

const KeywordTooltip = ({ visible, keywords, onSelect, anchorRef }) => {
  if (!visible || !keywords || keywords.length === 0) return null;

  const rect = anchorRef?.current?.getBoundingClientRect();

  return (
    <div
      className="absolute z-30 bg-yellow-100 border border-yellow-300 rounded-xl shadow-md p-3 text-sm"
      style={{
        top: rect?.top - 70 + window.scrollY,
        left: rect?.left + window.scrollX,
        width: rect?.width,
        maxWidth: 400,
      }}
    >
      <div className="font-semibold text-yellow-800 mb-2">💡 Suggested keywords</div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((word, idx) => (
          <span
            key={idx}
            onClick={() => onSelect(word)}
            className="cursor-pointer px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded-full text-yellow-900 transition"
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
};

export default KeywordTooltip;
