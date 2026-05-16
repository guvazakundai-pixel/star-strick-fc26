'use client';
import { cn } from '@/lib/utils/cn';

export function Badge({ variant = 'default', size = 'sm', children, className }: { variant?: 'default' | 'purple' | 'green' | 'yellow' | 'red' | 'blue'; size?: 'sm' | 'md'; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center font-medium rounded-full', {
    'bg-white/10 text-foreground': variant === 'default', 'bg-neon-purple/20 text-neon-purple': variant === 'purple',
    'bg-electric-green/20 text-electric-green': variant === 'green', 'bg-yellow-500/20 text-yellow-400': variant === 'yellow',
    'bg-red-500/20 text-red-400': variant === 'red', 'bg-blue-500/20 text-blue-400': variant === 'blue',
  }, { 'text-xs px-2 py-0.5': size === 'sm', 'text-sm px-3 py-1': size === 'md' }, className)}>{children}</span>;
}
