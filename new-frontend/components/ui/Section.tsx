/**
 * Componente Section para estructura consistente
 */
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { layoutConfig, type LayoutWidth } from '@/lib/config/layout';
import { cn } from '@/lib/utils';
import type { SectionProps } from '@/types';

interface ExtendedSectionProps extends SectionProps {
  background?: 'dark' | 'darker' | 'transparent';
  containerClassName?: string;
  width?: LayoutWidth;
  showDivider?: boolean;
}

export const Section: React.FC<ExtendedSectionProps> = ({
  id,
  className,
  background = 'dark',
  containerClassName,
  width = 'base',
  showDivider = true,
  children,
}) => {
  const bgClasses = {
    dark: 'bg-black',
    darker: 'bg-zinc-950',
    transparent: 'bg-transparent',
  };

  return (
    <section
      id={id}
      className={cn(
        'relative isolate scroll-mt-24 sm:scroll-mt-32 py-32 sm:py-40 lg:py-48 xl:py-56 mt-24 sm:mt-32 lg:mt-40 first:mt-0',
        bgClasses[background],
        className
      )}
    >
      <div
        className={cn(
          layoutConfig.base,
          layoutConfig.widths[width],
          'flex w-full flex-col items-center gap-16 sm:gap-20 lg:gap-24 xl:gap-28',
          containerClassName
        )}
      >
        {children}
      </div>
      {showDivider && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent sm:inset-x-12 lg:inset-x-24"
        />
      )}
    </section>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

const headerAlignClasses = {
  left: 'text-left self-start',
  center: 'text-center self-center',
  right: 'text-right self-end',
} as const;

const descriptionAlignClasses = {
  left: 'mx-0 text-left',
  center: 'mx-auto text-center',
  right: 'ml-auto text-right',
} as const;

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  description,
  align = 'center',
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn('w-full max-w-4xl space-y-4 sm:space-y-5', headerAlignClasses[align], className)}
    >
      {subtitle && (
        <p className="text-xs sm:text-sm md:text-base text-gray-400 uppercase tracking-widest mb-2 sm:mb-3 md:mb-4">
          {subtitle}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl leading-relaxed px-4 sm:px-0',
            descriptionAlignClasses[align]
          )}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
};
