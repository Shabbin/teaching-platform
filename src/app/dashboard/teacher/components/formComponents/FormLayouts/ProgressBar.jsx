import React from "react";

export default function ProgressSteps({ steps, currentStep }) {
  return (
    <div className="w-full px-4 py-6">
      <div className="relative flex justify-between items-center">
        {/* line behind */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-[color-mix(in_oklch,var(--brand)_15%,white)] -translate-y-1/2" />
        {/* line filled */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-[var(--brand)] -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, i) => {
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={i} className="relative flex flex-col items-center w-full">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full z-10 border-2 transition-all duration-300 ${
                  isActive
                    ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                    : "bg-white border-[color-mix(in_oklch,var(--brand)_20%,black)] text-[var(--muted)]"
                }`}
              >
                {isActive ? "✓" : i + 1}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center ${
                  isCurrent ? "text-[var(--brand)]" : "text-[var(--muted)]"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
