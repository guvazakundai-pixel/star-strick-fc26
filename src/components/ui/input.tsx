'use client';
import { cn } from '@/lib/utils/cn';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label htmlFor={id} className="text-sm font-medium text-foreground/80">{label}</label>}
    <input ref={ref} id={id} className={cn('w-full bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted transition-all duration-200 focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/30', error && 'border-red-500', className)} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));
Input.displayName = 'Input';
export { Input };
