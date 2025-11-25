import { format, parse, isValid, differenceInDays } from 'date-fns';

/**
 * Generate timestamp-based ID: YYYYMMDDHHMMSS
 */
export function generateTimestampId(date: Date = new Date()): string {
  return format(date, 'yyyyMMddHHmmss');
}

/**
 * Generate date-based ID: YYYYMMDD
 */
export function generateDateId(date: Date = new Date()): string {
  return format(date, 'yyyyMMdd');
}

/**
 * Format date for display: YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Format date only: YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format date for full display: November 25, 2025
 */
export function formatDateFull(date: Date): string {
  return format(date, 'MMMM dd, yyyy');
}

/**
 * Parse date from YYYY-MM-DD format
 */
export function parseDate(dateStr: string): Date | null {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Parse date from YYYYMMDD format
 */
export function parseDateId(dateId: string): Date | null {
  try {
    const parsed = parse(dateId, 'yyyyMMdd', new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Get journal file path components
 */
export function getJournalPathComponents(date: Date): {
  year: string;
  month: string;
  fileName: string;
} {
  return {
    year: format(date, 'yyyy'),
    month: format(date, 'MM'),
    fileName: `${format(date, 'yyyyMMdd')}.md`,
  };
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  return Math.abs(differenceInDays(date1, date2));
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return format(date1, 'yyyyMMdd') === format(date2, 'yyyyMMdd');
}

/**
 * Get yesterday's date
 */
export function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}
