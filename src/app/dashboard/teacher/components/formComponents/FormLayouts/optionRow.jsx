import React from 'react';

export default function OptionRow({ label, meta, rightIcon = '+', onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4
                 flex items-center justify-between shadow-sm
                 hover:shadow-md hover:bg-white transition disabled:opacity-50"
    >
      <div>
        <div className="font-semibold text-gray-900">{label}</div>
        {meta ? <div className="text-sm text-gray-500 mt-0.5">{meta}</div> : null}
      </div>
      <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
        {rightIcon}
      </div>
    </button>
  );
}
