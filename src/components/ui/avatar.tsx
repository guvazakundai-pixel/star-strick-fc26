'use client';
import { cn } from '@/lib/utils/cn';

export function Avatar({ src, name, size = 'md', className }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return <div className={cn('rounded-full bg-gradient-to-br from-neon-purple to-electric-green flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0', { 'w-8 h-8 text-xs': size === 'sm', 'w-10 h-10 text-sm': size === 'md', 'w-14 h-14 text-lg': size === 'lg' }, className)}>
    {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
  </div>;
}
