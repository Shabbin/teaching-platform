// FullScreenWizard.jsx — original layout, scoped vars, no global side-effects
import React from "react";

export default function FullScreenWizard({ left, right }) {
  return (
    <div className="wizard-screen fixed inset-0 z-50 bg-[var(--surface)]">
      {/* Scoped ONLY to .wizard-screen so the rest of the app is untouched */}
      <style jsx global>{`
        .wizard-screen {
          /* Theme vars (scoped) */
          --brand: oklch(0.51 0.26 276.94);
          --brand-10: color-mix(in oklch, var(--brand) 10%, white);
          --brand-20: color-mix(in oklch, var(--brand) 20%, white);
          --ink: oklch(0.15 0.02 259);
          --muted: oklch(0.65 0.03 260);
          --surface: oklch(0.98 0.01 260);

          /* Prevent z-index bleed from the rest of the page */
          isolation: isolate;
        }

        /* Keep focus minimal on form controls INSIDE the wizard only */
        .wizard-screen select:focus,
        .wizard-screen input:focus,
        .wizard-screen textarea:focus,
        .wizard-screen button:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        /* If you need to hide your site chrome ONLY on this page,
           add a class to your site header/nav (e.g., .site-header/.site-nav)
           and uncomment these lines:
        .wizard-screen ~ .site-header,
        .wizard-screen ~ .site-nav { display: none !important; }
        */
      `}</style>

      <div className="grid h-full w-full grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
        {/* LEFT PANEL (unchanged) */}
        <aside className="relative hidden md:block overflow-hidden">
          <div className="absolute inset-0 bg-[var(--brand-10)]" />
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_-20%_-10%,var(--brand-20),transparent)]" />
          <div className="relative h-full w-full p-10 flex items-center">
            <div className="max-w-md text-[oklch(0.26_0.03_260)]">
              {left}
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL (unchanged) */}
        <main className="relative h-full overflow-y-auto">
          <div className="min-h-full">
            {right}
          </div>
        </main>
      </div>
    </div>
  );
}
