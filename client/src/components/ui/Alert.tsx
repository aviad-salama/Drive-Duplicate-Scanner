import type { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  variant?: 'error' | 'success' | 'info';
  className?: string;
}

const variants = {
  error: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50',
  success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
  info: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-900/50',
};

export function Alert({ children, variant = 'info', className = '' }: AlertProps) {
  return (
    <div className={`rounded-xl border p-4 ${variants[variant]} ${className}`.trim()}>
      {children}
    </div>
  );
}