import React from "react";

export default function StepActions({ onBack, onNext, onSubmit, isLast, loading, nextDisabled }) {
  return (
    <div className="sticky bottom-0 mt-8 pt-4 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/65">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 h-12 rounded-full border text-[var(--ink)] border-[color-mix(in_oklch,var(--brand)_18%,black)] hover:bg-[var(--surface)]"
        >
          Go back
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="px-8 h-12 rounded-full bg-[var(--brand)] text-white font-semibold disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || loading}
            className="px-8 h-12 rounded-full bg-[var(--brand)] text-white font-semibold disabled:opacity-60"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
