import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = { variant?: 'error' | 'success' | 'info' | 'warning'; children: ReactNode; className?: string };

const styles = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  success: 'border-success/30 bg-success/10 text-success',
  info: 'border-primary/30 bg-primary/10 text-primary',
  warning: 'border-warning/40 bg-warning/15 text-amber-800',
} as const;

export function Alert({ variant = 'info', children, className }: Props) {
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn('rounded-lg border px-3 py-2 text-sm', styles[variant], className)}>
      {children}
    </div>
  );
}
