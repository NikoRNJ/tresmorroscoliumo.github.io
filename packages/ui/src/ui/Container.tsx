import { cn } from '@core/lib/utils/cn';
import { HTMLAttributes } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Container({ className, size = 'lg', children, ...props }: ContainerProps) {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
  };

  return (
    <div className={cn(sizes[size], 'mx-auto px-4 sm:px-6 lg:px-8', className)} {...props}>
      {children}
    </div>
  );
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  dark?: boolean;
}

export function Section({ className, padding = 'lg', dark = false, children, ...props }: SectionProps) {
  const paddings = {
    none: '',
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-16',
    lg: 'py-16 md:py-24',
  };

  return (
    <section
      className={cn(paddings[padding], dark && 'bg-dark-900', className)}
      {...props}
    >
      {children}
    </section>
  );
}
