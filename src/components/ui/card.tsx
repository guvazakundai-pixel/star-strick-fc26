'use client';
import { cn } from '@/lib/utils/cn';
import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> { hover?: boolean; glow?: boolean; }
const Card = forwardRef<HTMLDivElement, CardProps>(({ className, hover, glow, children, ...props }, ref) => (
  <div ref={ref} className={cn('bg-card-bg border border-glass-border rounded-xl p-4 transition-all duration-200', hover && 'hover:bg-card-hover hover:border-neon-purple/30 cursor-pointer', glow && 'neon-glow-purple', className)} {...props}>{children}</div>
));
Card.displayName = 'Card';

const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('flex items-center justify-between mb-3', className)} {...props} />;
const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn('text-lg font-semibold', className)} {...props} />;
const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => <p className={cn('text-sm text-muted', className)} {...props} />;
const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('', className)} {...props} />;

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
