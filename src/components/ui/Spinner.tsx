'use client';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  readonly size?: number;
  readonly className?: string;
}

export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <div
      className={cn('rounded-full border-2 border-primary-200 border-t-primary-600 flex-shrink-0 animate-spin', className)}
      style={{ width: size, height: size }}
    />
  );
}

interface PageSpinnerProps {
  readonly children?: React.ReactNode;
  readonly className?: string;
}

export function PageSpinner({ children, className }: PageSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center h-[300px] gap-3', className)}>
      {children ?? <Spinner size={36} />}
    </div>
  );
}
