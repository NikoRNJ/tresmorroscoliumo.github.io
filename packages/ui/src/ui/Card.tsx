import { cn } from '@core/lib/utils/cn'
import { HTMLAttributes } from 'react'
import Image from 'next/image'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-dark-900 rounded-xl overflow-hidden shadow-2xl',
        hover && 'hover:shadow-primary-500/20 transition-all duration-300 hover:-translate-y-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-500 hover:scale-110"
        style={{ objectPosition: 'center 85%' }}
        sizes="(max-width: 1024px) 100vw, 33vw"
        priority={false}
      />
    </div>
  )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-2xl font-bold text-white mb-2', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-gray-400 text-sm', className)} {...props}>
      {children}
    </p>
  );
}
