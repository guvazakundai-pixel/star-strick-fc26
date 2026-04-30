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
        className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 mb-4"
      >
        {tabs.map((t) => {
          const on = active === t;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t)}
              className={
                "shrink-0 inline-flex items-center rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider transition " +
                (on
                  ? "border-neon/60 bg-neon/10 text-neon"
                  : "border-br/70 bg-s1/60 text-muted hover:text-text hover:border-br")
              }
            >
              {t}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{panels[active]}</div>
    </>
  );
}
