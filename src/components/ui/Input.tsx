'use client';
import React from 'react';
import { cn } from '@/lib/utils';

// ── Shared ────────────────────────────────────────────────────────────────────

const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';
const errorClass = 'text-xs text-red-500 mt-1';

const baseField =
  'w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white outline-none transition-all duration-200 placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500';

const fieldBorder = (hasError?: boolean) =>
  hasError
    ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
    : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

// ── Input ─────────────────────────────────────────────────────────────────────

type InputProps = Readonly<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
>;

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col">
      {label && <label className={labelClass}>{label}</label>}
      <input className={cn(baseField, fieldBorder(!!error), className)} {...props} />
      {error && <span className={errorClass}>{error}</span>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────

type SelectProps = Readonly<
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
    children: React.ReactNode;
  }
>;

export function Select({ label, error, children, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col">
      {label && <label className={labelClass}>{label}</label>}
      <select className={cn(baseField, fieldBorder(!!error), 'cursor-pointer', className)} {...props}>
        {children}
      </select>
      {error && <span className={errorClass}>{error}</span>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────

type TextareaProps = Readonly<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
  }
>;

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col">
      {label && <label className={labelClass}>{label}</label>}
      <textarea
        className={cn(baseField, fieldBorder(!!error), 'resize-vertical min-h-[80px]', className)}
        {...props}
      />
      {error && <span className={errorClass}>{error}</span>}
    </div>
  );
}
