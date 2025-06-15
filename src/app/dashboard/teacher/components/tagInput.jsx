
'use client';
import React, { useState } from 'react';

const TagInput = ({ label, selected, setSelected, options = [], maxTags = 10 }) => {
  const [input, setInput] = useState('');

  const handleAdd = (tag) => {
    if (selected.includes(tag) || selected.length >= maxTags) return;
    setSelected([...selected, tag]);
    setInput('');
  };

  const handleRemove = (tag) => {
    setSelected(selected.filter(t => t !== tag));
  };

  const handleInputChange = (e) => setInput(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      handleAdd(input.trim());
      e.preventDefault();
    }
  };

  return (
    <div className="form-control w-full mb-4">
      <label className="label"><span className="label-text">{label}</span></label>
      {options.length > 0 ? (
        <select
          className="select select-bordered w-full mb-2"
          onChange={(e) => handleAdd(e.target.value)}
          defaultValue=""
        >
          <option disabled value="">Choose...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="input input-bordered w-full mb-2"
          placeholder="Type and press Enter"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {selected.map(tag => (
          <div key={tag} className="badge badge-primary gap-2">
            {tag}
            <button type="button" onClick={() => handleRemove(tag)} className="ml-1">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagInput;
