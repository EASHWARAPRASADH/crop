import { format, isValid, parseISO } from 'date-fns';

/**
 * Attempts to format a value as dd/MM/yyyy if it looks like a date.
 * Handles Date objects, Excel serial numbers, and common date strings.
 */
export function formatIfDate(value: any, targetFormat: string = 'dd/MM/yyyy'): string {
  if (value === null || value === undefined) return '';

  // 1. If it's a Date object, format it directly
  if (value instanceof Date) {
    return isValid(value) ? format(value, targetFormat) : String(value);
  }

  // 2. If it's a number, it might be an Excel serial date (typical range for current dates)
  // 40000 is approx year 2009, 60000 is approx 2064
  if (typeof value === 'number' && value > 30000 && value < 70000) {
    try {
      // Excel epoch starts 1899-12-30
      const excelDate = new Date((value - 25569) * 86400 * 1000);
      if (isValid(excelDate)) return format(excelDate, targetFormat);
    } catch (e) {
      // ignore
    }
  }

  // 3. If it's a string, try to parse it
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    // Check if it's already in the target format to avoid redundant processing
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (dateRegex.test(trimmed)) return trimmed;

    // Try parsing as ISO
    try {
      const asIso = parseISO(trimmed);
      if (isValid(asIso) && asIso.getFullYear() > 1900) return format(asIso, targetFormat);
    } catch (e) {
      // ignore
    }

    // Attempt plain Date constructor (handles MANY common formats: "May 21, 2026", "2026-05-21", etc.)
    try {
      const asPlain = new Date(trimmed);
      if (isValid(asPlain) && asPlain.getFullYear() > 1900) {
         // Avoid false positives for pure numbers that Date handles as years/timestamps
         if (!/^\d+$/.test(trimmed) || (trimmed.length === 4 && parseInt(trimmed) > 1900 && parseInt(trimmed) < 2100)) {
           return format(asPlain, targetFormat);
         }
      }
    } catch (e) {
      // ignore
    }
  }

  return String(value);
}
