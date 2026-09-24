import { format, formatDistance, startOfMonth, endOfMonth } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function formatCurrency(
  amount: number,
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatDate(date: Date | Timestamp, fmt: string = 'dd MMM yyyy'): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return format(d, fmt);
}

export function formatRelativeDate(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return formatDistance(d, new Date(), { addSuffix: true });
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthRange(month: string): { start: Date; end: Date } {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function toFirestoreTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function clsx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function percentageOf(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
