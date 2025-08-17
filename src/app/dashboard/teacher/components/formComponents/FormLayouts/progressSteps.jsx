import React from "react";

export default function ProgressSteps({ steps = [], currentStep = 0 }) {
  if (!steps.length) return null;
  const total = steps.length;
  const pctLine = (currentStep / Math.max(total - 1, 1)) * 100;   // line fill
  const pctBar  = ((currentStep + 1) / total) * 100;               // mobile bar

  return (
    <div className="w-full py-4">
      {/* Desktop / tablet: full stepper */}
      <div className="hidden md:block">
        <div className="relative">
          {/* base track */}
          <div className="absolute left-0 top-1/2 w-full h-1 rounded-full -translate-y-1/2 bg-[color-mix(in_oklch,var(--brand)_20%,white)]" />
          {/* progress track */}
          <div
            className="absolute left-0 top-1/2 h-1 rounded-full -translate-y-1/2 bg-[var(--brand)] transition-all duration-500"
            style={{ width: `${pctLine}%` }}
          />
          <div className="flex items-center">
            {steps.map((s, i) => {
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={i} className="relative flex flex-col items-center flex-1 text-center px-1">
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-full border-2 z-10 transition-all duration-300 ${
                      isActive
                        ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                        : "bg-white border-[color-mix(in_oklch,var(--brand)_30%,black)] text-[var(--muted)]"
                    }`}
                  >
                    {isActive ? "✓" : i + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium truncate max-w-[120px] ${
                      isCurrent ? "text-[var(--brand)]" : "text-[var(--muted)]"
                    }`}
                    title={s.label}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: compact bar + current label */}
      <div className="md:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--ink)]">Step {currentStep + 1} / {total}</span>
          <span className="text-[var(--muted)] truncate max-w-[55%]">{steps[currentStep]?.label}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[color-mix(in_oklch,var(--brand)_20%,white)] overflow-hidden">
          <div className="h-full bg-[var(--brand)] transition-all duration-500" style={{ width: `${pctBar}%` }} />
        </div>
      </div>
    </div>
  );
}
