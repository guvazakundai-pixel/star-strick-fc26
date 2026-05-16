'use client';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';

interface Tab { id: string; label: string; icon?: React.ReactNode; }

export function Tabs({ tabs, defaultTab, onChange, children, className }: { tabs: Tab[]; defaultTab?: string; onChange?: (id: string) => void; children: (activeTab: string) => React.ReactNode; className?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  return <div className={className}>
    <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-4 overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => { setActiveTab(tab.id); onChange?.(tab.id); }}
          className={cn('flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap', activeTab === tab.id ? 'bg-neon-purple/20 text-neon-purple' : 'text-muted hover:text-foreground hover:bg-white/5')}>
          {tab.icon}{tab.label}
        </button>
      ))}
    </div>
    {children(activeTab)}
  </div>;
}
