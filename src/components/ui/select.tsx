'use client';
import { cn } from '@/lib/utils/cn';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; options: { value: string; label: string }[]; }
const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, error, id, options, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label htmlFor={id} className="text-sm font-medium text-foreground/80">{label}</label>}
    <select ref={ref} id={id} className={cn('w-full bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-sm text-foreground transition focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/30', error && 'border-red-500', className)} {...props}>
      {options.map((opt) => <option key={opt.value} value={opt.value} className="bg-card-bg">{opt.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));
Select.displayName = 'Select';
export { Select };
