import React from 'react';

export default function SelectedPill({ label, right, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-rose-500 text-white px-5 py-4 shadow-sm
                 flex items-center justify-between"
    >
      <span className="font-semibold">{label}</span>
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/20">
        {right ?? '✓'}
      </span>
    </button>
  );
}
