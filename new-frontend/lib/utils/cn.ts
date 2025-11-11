/**
 * Utilidad para combinar clases de Tailwind de manera segura
 * Evita conflictos y duplicados usando clsx y tailwind-merge
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
