'use client';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg border-none cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:   'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow',
        secondary: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow',
        danger:    'bg-red-500 text-white hover:bg-red-600 shadow-sm',
        ghost:     'bg-transparent text-gray-600 hover:bg-gray-100',
        outline:   'bg-transparent text-primary-600 border border-primary-600 hover:bg-primary-50',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
      fullWidth: {
        true:  'w-full',
        false: 'w-auto',
      },
      loading: {
        true:  'opacity-70 pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      variant:   'primary',
      size:      'md',
      fullWidth: false,
      loading:   false,
    },
  },
);

type ButtonProps = Readonly<
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    fullWidth?: boolean;
  }
>;

export function Button({
  className,
  variant,
  size,
  fullWidth,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth, loading }), className)}
      disabled={disabled || !!loading}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
