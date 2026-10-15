import type {
  ElementType, HTMLAttributes, JSX, ReactNode,
} from 'react';

interface TitleProps {
  level?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}

export function Title({ level = 2, children, className = '' }: TitleProps) {
  const baseStyle = 'font-bold text-gray-800 dark:text-slate-100';
  const sizes = {
    1: 'text-3xl',
    2: 'text-2xl',
    3: 'text-lg',
    4: 'text-base',
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag className={`${baseStyle} ${sizes[level]} ${className}`.trim()}>{children}</Tag>;
}

interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {
  variant?: 'default' | 'dimmed' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'base' | 'lg';
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

export function Text({
  variant = 'default',
  size = 'base',
  as: Tag = 'p',
  children,
  className = '',
  ...props
}: TextProps) {
  const variants = {
    default: 'text-gray-800 dark:text-slate-200',
    dimmed: 'text-gray-500 dark:text-slate-400',
    danger: 'text-red-500 dark:text-red-400',
    success: 'text-emerald-600 dark:text-emerald-400',
  };

  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  return (
    <Tag className={`${variants[variant]} ${sizes[size]} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}
