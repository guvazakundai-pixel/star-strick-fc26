"use client";

import { useState, type ReactNode } from "react";

export function Tabs<T extends string>({
  tabs,
  initial,
  panels,
}: {
  tabs: readonly T[];
  initial?: T;
  panels: Record<T, ReactNode>;
}) {
  const [active, setActive] = useState<T>(initial ?? tabs[0]);
  return (
    <>
      <div
        role="tablist"
        className="mb-5 -mx-4 sm:mx-0 px-4 sm:px-0 border-b border-border overflow-x-auto"
      >
        <div className="flex items-center gap-6 min-w-max">
          {tabs.map((t) => {
            const on = active === t;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(t)}
                className={
                  "shrink-0 -mb-px border-b-2 py-2.5 text-[13px] font-medium tracking-wide transition " +
                  (on
                    ? "border-accent text-ink"
                    : "border-transparent text-muted hover:text-ink-soft")
                }
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
      <div role="tabpanel">{panels[active]}</div>
    </>
  );
}
