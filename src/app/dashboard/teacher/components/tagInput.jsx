'use client';
import React, { useState, useRef, useEffect } from 'react';

const TagInput = ({ options, selected = [], setSelected, maxTags = 5 }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  const handleSelect = (option) => {
    if (selected.includes(option) || selected.length >= maxTags) return;
    setSelected([...selected, option]);
    setDropdownOpen(false);
  };

  const handleRemove = (tag) => {
    setSelected(selected.filter((s) => s !== tag));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative mb-4">
      {/* Label above field */}
      <label className="block text-sm font-semibold mb-1 text-gray-700">
        Click to select subjects (max {maxTags})
      </label>

      {/* Tag display and input box */}
      <div
        onClick={() => {
          if (selected.length < maxTags) setDropdownOpen(!dropdownOpen);
        }}
        className={`w-full border rounded-md px-3 py-2 bg-white min-h-[44px] flex flex-wrap items-center gap-2 cursor-pointer transition-all ${
          selected.length >= maxTags ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
      >
        {selected.length === 0 && (
          <span className="text-gray-400">No subjects selected</span>
        )}
        {selected.map((tag) => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(tag);
              }}
              className="text-sm font-bold hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Dropdown */}
      {dropdownOpen && selected.length < maxTags && (
        <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-md mt-1 max-h-60 overflow-y-auto animate-fade-in">
          {options.filter((opt) => !selected.includes(opt)).map((opt) => (
            <li
              key={opt}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer transition-all"
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </li>
          ))}
          {options.filter((opt) => !selected.includes(opt)).length === 0 && (
            <li className="px-4 py-2 text-gray-400">No more options</li>
          )}
        </ul>
      )}

      {/* Fade-in animation */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.15s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TagInput;
