import React from "react";

export default function StepTitle({ prefix, highlight }) {
  return (
    <h1 className="text-[28px] md:text-[40px] font-extrabold tracking-tight mb-6">
      <span className="text-[var(--ink)]">{prefix} </span>
      <span className="text-[var(--brand)]">{highlight}</span>
    </h1>
  );
}
