'use client';
import React from 'react';
import { cn } from '@/lib/utils';

type DivProps   = Readonly<React.HTMLAttributes<HTMLDivElement>>;
type TableElProps = Readonly<React.TableHTMLAttributes<HTMLTableElement>>;
type TheadProps = Readonly<React.HTMLAttributes<HTMLTableSectionElement>>;
type TbodyProps = Readonly<React.HTMLAttributes<HTMLTableSectionElement>>;
type TrProps    = Readonly<React.HTMLAttributes<HTMLTableRowElement>>;
type ThProps    = Readonly<React.ThHTMLAttributes<HTMLTableCellElement>>;
type TdProps    = Readonly<React.TdHTMLAttributes<HTMLTableCellElement>>;

export function TableWrapper({ className, children, ...props }: DivProps) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)} {...props}>
      {children}
    </div>
  );
}

export function Table({ className, children, ...props }: TableElProps) {
  return (
    <table className={cn('w-full border-collapse text-sm', className)} {...props}>
      {children}
    </table>
  );
}

export function Thead({ className, children, ...props }: TheadProps) {
  return (
    <thead className={cn('bg-gray-50 border-b border-gray-200', className)} {...props}>
      {children}
    </thead>
  );
}

export function Tbody({ className, children, ...props }: TbodyProps) {
  return (
    <tbody className={cn('divide-y divide-gray-50', className)} {...props}>
      {children}
    </tbody>
  );
}

export function Tr({ className, children, ...props }: TrProps) {
  return (
    <tr className={cn('hover:bg-gray-50/70 transition-colors', className)} {...props}>
      {children}
    </tr>
  );
}

export function Th({ className, children, ...props }: ThProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }: TdProps) {
  return (
    <td className={cn('px-4 py-3 text-gray-700 align-middle', className)} {...props}>
      {children}
    </td>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────

const badgeVariants: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  danger:  'bg-red-50 text-red-700 ring-1 ring-red-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  info:    'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  default: 'bg-gray-100 text-gray-600',
};

type BadgeProps = Readonly<
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  }
>;

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
