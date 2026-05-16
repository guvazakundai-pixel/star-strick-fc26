'use client';
import { cn } from '@/lib/utils/cn';

export function Loading({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <div className={cn('flex items-center justify-center', className)}>
    <div className={cn('border-2 border-white/10 border-t-neon-purple rounded-full animate-spin', { 'w-4 h-4': size === 'sm', 'w-8 h-8': size === 'md', 'w-12 h-12': size === 'lg' })} />
  </div>;
}

export function PageLoading() {
  return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4"><Loading size="lg" /><p className="text-muted text-sm animate-pulse">Loading...</p></div>;
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && <div className="mb-4 text-muted">{icon}</div>}
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    {description && <p className="text-sm text-muted mb-4 max-w-md">{description}</p>}
    {action}
  </div>;
}
