// client/src/components/ui/Card.tsx
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, padding = 'md', className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 shadow-sm transition-colors dark:border-slate-700 ${paddingStyles[padding]} ${className}`.trim()}>
      {children}
    </div>
  );
}