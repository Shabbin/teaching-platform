'use client';
import React, { useEffect, useRef, useState } from 'react';

const TagInput = ({ label, selected, setSelected, options = [], maxTags = 5 }) => {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setInput('');
  }, [selected]);

  const handleAdd = (value) => {
    if (!value || selected.includes(value) || selected.length >= maxTags) return;
    setSelected([...selected, value]);
    setInput('');
    setShowDropdown(false);
  };

  const handleRemove = (tag) => {
    setSelected(selected.filter((t) => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(input.trim());
    }
  };

  const handleFocus = () => {
    if (selected.length < maxTags) {
      setShowDropdown(true);
    }
  };

  const filteredOptions = options.filter(
    (option) =>
      option.toLowerCase().includes(input.toLowerCase()) &&
      !selected.includes(option)
  );

  return (
    <div ref={wrapperRef} className="mb-4 relative z-20">
      <label className="block text-sm font-medium mb-1">{label}</label>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((tag) => (
          <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
            {tag}
            <button
              type="button"
              className="ml-1 text-red-600"
              onClick={() => handleRemove(tag)}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input box */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onFocus={handleFocus}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Type and press enter (max ${maxTags})`}
        className="input input-bordered w-full"
        disabled={selected.length >= maxTags}
      />

      {/* Dropdown */}
      {showDropdown && filteredOptions.length > 0 && selected.length < maxTags && (
        <ul className="absolute bg-white border border-gray-300 rounded shadow mt-1 w-full max-h-40 overflow-auto">
          {filteredOptions.map((option) => (
            <li
              key={option}
              className="px-3 py-1 cursor-pointer hover:bg-blue-100"
              onClick={() => handleAdd(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagInput;
