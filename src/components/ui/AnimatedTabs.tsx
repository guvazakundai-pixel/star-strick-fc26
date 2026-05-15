"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type TabsProps<T extends string> = {
  tabs: readonly T[];
  initial?: T;
  panels: Record<T, ReactNode>;
  className?: string;
};

export function AnimatedTabs<T extends string>({ tabs, initial, panels, className = "" }: TabsProps<T>) {
  const [active, setActive] = useState<T>(initial ?? tabs[0]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Map<T, HTMLButtonElement>>(new Map());

  const updateIndicator = useCallback(() => {
    const el = tabRefs.current.get(active);
    const parent = tabsRef.current;
    if (el && parent) {
      const parentRect = parent.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({
        left: elRect.left - parentRect.left,
        width: elRect.width,
      });
    }
  }, [active]);

  useEffect(() => {
    updateIndicator();
    const observer = new ResizeObserver(updateIndicator);
    if (tabsRef.current) observer.observe(tabsRef.current);
    return () => observer.disconnect();
  }, [updateIndicator]);

  return (
    <div className={className}>
      <div
        ref={tabsRef}
        role="tablist"
        className="relative mb-5 -mx-4 sm:mx-0 px-4 sm:px-0 border-b border-border-faint overflow-x-auto tab-scroll"
      >
        <div className="relative flex items-center gap-6 min-w-max">
          {tabs.map((t) => {
            const on = active === t;
            return (
              <button
                key={t}
                ref={(el) => { if (el) tabRefs.current.set(t, el); }}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(t)}
                className={
                  "tab-item shrink-0 " +
                  (on ? "text-ink" : "text-muted-soft hover:text-ink-soft")
                }
              >
                {t}
              </button>
            );
          })}
          <div
            aria-hidden
            className="absolute bottom-0 h-[2px] rounded-full"
            style={{
              left: indicator.left,
              width: indicator.width,
              background: "var(--accent)",
              boxShadow: "0 0 12px rgba(0,255,133,0.50)",
              transition: "left 380ms cubic-bezier(0.22, 1, 0.36, 1), width 380ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
      </div>
      <div role="tabpanel" className="page-enter">{panels[active]}</div>
    </div>
  );
}