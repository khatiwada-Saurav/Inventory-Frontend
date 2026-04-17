'use client';
import { cn } from '@/lib/utils';

interface Meta {
  readonly current_page: number;
  readonly last_page: number;
  readonly per_page: number;
  readonly total: number;
}

interface PaginationProps {
  readonly meta: Meta;
  readonly onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { current_page, last_page, total, per_page } = meta;
  const from = (current_page - 1) * per_page + 1;
  const to   = Math.min(current_page * per_page, total);

  const pages = Array.from({ length: last_page }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === last_page || Math.abs(p - current_page) <= 2,
  );

  const btnBase =
    'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center justify-between mt-5 flex-wrap gap-2">
      <p className="text-xs text-gray-500">
        Showing <span className="font-semibold text-gray-700">{from}–{to}</span> of{' '}
        <span className="font-semibold text-gray-700">{total}</span> results
      </p>
      <div className="flex gap-1">
        <button
          className={cn(btnBase, 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')}
          disabled={current_page === 1}
          onClick={() => onPageChange(current_page - 1)}
        >
          ‹ Prev
        </button>
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const showDots = prev && p - prev > 1;
          return (
            <span key={p} className="flex gap-1">
              {showDots && (
                <button disabled className={cn(btnBase, 'border-gray-200 bg-white text-gray-400')}>
                  …
                </button>
              )}
              <button
                className={cn(
                  btnBase,
                  p === current_page
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                )}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </span>
          );
        })}
        <button
          className={cn(btnBase, 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')}
          disabled={current_page === last_page}
          onClick={() => onPageChange(current_page + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
