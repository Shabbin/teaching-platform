import React from "react";

export default function HelperBlock({ title, children, icon = "😊" }) {
  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur p-7 shadow-sm border border-[color-mix(in_oklch,var(--brand)_8%,black)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl leading-none">{icon}</div>
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
          {title}
        </h3>
      </div>
      <div className="text-sm md:text-base leading-6 text-[var(--muted)]">
        {children}
      </div>
    </div>
  );
}
