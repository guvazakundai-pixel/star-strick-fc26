"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Tab = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
};

export function AnimatedTabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  sticky = false,
}: {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  sticky?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
    if (activeEl) {
      setIndicatorStyle({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    }
  }, [activeTab]);

  return (
    <div className={`${sticky ? "sticky-tabs" : ""} ${className}`}>
      <div ref={containerRef} className="tab-bar relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            data-active={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className="tab-item flex items-center gap-2 text-[12px] sm:text-[13px] px-3 sm:px-5 py-3"
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[9px] font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-accent rounded-full"
          layout
          layoutId="tab-indicator"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            boxShadow: "0 0 12px rgba(0,255,133,0.50)",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      </div>
    </div>
  );
}

export function TabContent({
  id,
  activeTab,
  children,
  className = "",
}: {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      {activeTab === id && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MobileTabScroll({
  tabs,
  activeTab,
  onChange,
  className = "",
}: {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`tab-scroll flex gap-1 overflow-x-auto bc-no-scrollbar pb-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 ${
            activeTab === tab.id
              ? "bg-accent text-bg"
              : "bg-surface-2 text-muted-soft border border-border hover:border-border-strong"
          }`}
        >
          <span className="flex items-center gap-1.5">
            {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-0.5 px-1 py-0.5 rounded-full bg-white/20 text-[8px] font-bold">
                {tab.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
