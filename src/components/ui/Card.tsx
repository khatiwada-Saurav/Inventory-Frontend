'use client';
import React from 'react';
import { cn } from '@/lib/utils';

// ── Card ──────────────────────────────────────────────────────────────────────

type CardProps = Readonly<React.HTMLAttributes<HTMLDivElement>>;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-white rounded-xl shadow-card p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ── CardHeader ────────────────────────────────────────────────────────────────

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('flex items-center justify-between mb-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ── CardTitle ─────────────────────────────────────────────────────────────────

type HeadingProps = Readonly<React.HTMLAttributes<HTMLHeadingElement>>;

export function CardTitle({ className, children, ...props }: HeadingProps) {
  return (
    <h2 className={cn('text-base font-semibold text-gray-900', className)} {...props}>
      {children}
    </h2>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

type StatCardProps = Readonly<
  React.HTMLAttributes<HTMLDivElement> & { color?: string }
>;

export function StatCard({ color = '#4F46E5', className, children, style, ...props }: StatCardProps) {
  return (
    <div
      className={cn('bg-white rounded-xl p-5 shadow-card flex flex-col gap-2 border-l-4', className)}
      style={{ borderLeftColor: color, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

// ── StatLabel ─────────────────────────────────────────────────────────────────

type PProps = Readonly<React.HTMLAttributes<HTMLParagraphElement>>;

export function StatLabel({ className, children, ...props }: PProps) {
  return (
    <p className={cn('text-xs font-semibold text-gray-500 uppercase tracking-wider', className)} {...props}>
      {children}
    </p>
  );
}

// ── StatValue ─────────────────────────────────────────────────────────────────

export function StatValue({ className, children, ...props }: PProps) {
  return (
    <p className={cn('text-3xl font-bold text-gray-900 leading-none', className)} {...props}>
      {children}
    </p>
  );
}
