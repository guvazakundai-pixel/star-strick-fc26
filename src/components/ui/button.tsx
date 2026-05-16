'use client';
import { cn } from '@/lib/utils/cn';
import { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg'; loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
  <button ref={ref} disabled={disabled || loading} className={cn(
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 disabled:opacity-50 disabled:cursor-not-allowed',
    { 'bg-gradient-to-r from-neon-purple to-neon-purple-dark text-white hover:opacity-90 neon-glow-purple': variant === 'primary',
      'glass glass-hover text-foreground': variant === 'secondary',
      'bg-transparent text-foreground hover:bg-white/5': variant === 'ghost',
      'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
      'border border-glass-border text-foreground hover:border-neon-purple/50 hover:bg-white/5': variant === 'outline',
    }, { 'text-xs px-3 py-1.5': size === 'sm', 'text-sm px-4 py-2': size === 'md', 'text-base px-6 py-3': size === 'lg' }, className
  )} {...props}>
    {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Loading...</span> : children}
  </button>
));
Button.displayName = 'Button';
export { Button };
