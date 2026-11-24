import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TIMEZONE } from '@/lib/constants';

/** Merge Tailwind classes (shadcn convention). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Today's date (YYYY-MM-DD) in East Africa Time, regardless of device timezone. */
export function todayEAT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** Format a date-only (YYYY-MM-DD) or ISO timestamp in Kiswahili. */
export function formatDateSw(value: string): string {
  const dateOnly = value.length === 10;
  return new Date(value).toLocaleDateString('sw-TZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: dateOnly ? 'UTC' : TIMEZONE,
  });
}

export function formatDateTimeSw(value: string): string {
  return new Date(value).toLocaleString('sw-TZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  });
}

/** Normalize a Tanzanian phone number to 2557XXXXXXXX / 2556XXXXXXXX, or null if invalid. */
export function normalizeTzPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('255')) return digits;
  if (digits.length === 10 && digits.startsWith('0')) return `255${digits.slice(1)}`;
  if (digits.length === 9) return `255${digits}`;
  return null;
}

export function percent(score: number, max: number): number {
  if (!max) return 0;
  return Math.round((score / max) * 1000) / 10;
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}
