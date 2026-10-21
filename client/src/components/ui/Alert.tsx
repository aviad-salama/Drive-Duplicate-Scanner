import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const alertVariants = cva('rounded-xl border p-4', {
  variants: {
    variant: {
      error: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50',
      success: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50',
      info: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-900/50',
    },
  },
  defaultVariants: { variant: 'info' },
});

interface AlertProps extends VariantProps<typeof alertVariants> {
  children: ReactNode;
  className?: string;
}

export function Alert({ children, variant = 'info', className = '' }: AlertProps) {
  return <div className={cn(alertVariants({ variant }), className)}>{children}</div>;
}
