import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md', ...props }: CardProps) {
  const paddingClass = padding !== 'none' ? `card-padding-${padding}` : '';
  return (
    <div className={`card ${paddingClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
