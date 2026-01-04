import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getCurrentSeason(): 'spring-summer' | 'fall-winter' {
  const month = new Date().getMonth() + 1; // 1-12
  // Spring/Summer: March (3) through August (8)
  // Fall/Winter: September (9) through February (2)
  return month >= 3 && month <= 8 ? 'spring-summer' : 'fall-winter';
}
