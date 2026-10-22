import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'danger' | 'teal';
  className?: string;
}

const variants = {
  neutral: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700',
  success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
  danger: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50',
  teal: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-900',
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-bold ${variants[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
}
