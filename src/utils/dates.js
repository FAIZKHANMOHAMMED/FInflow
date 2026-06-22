/**
 * dates.js — Timezone-safe date utilities
 * Problem: new Date("2026-06-01") parses as UTC midnight, which in IST (+5:30)
 * becomes May 31 23:30 — showing the wrong date. We always use LOCAL time.
 */
import { format, isToday, isYesterday, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Serialize a Date object to a LOCAL ISO string (not UTC).
 * e.g. 2026-06-01T20:00:00  (no Z suffix, no timezone conversion)
 */
export const toLocalISO = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/**
 * Parse a local ISO string back to a Date object correctly.
 * Works for both "2026-06-01" and "2026-06-01T20:00:00"
 */
export const parseLocalISO = (str) => {
  if (!str) return new Date();
  // If no time component, append midnight to prevent UTC shift
  const s = str.includes('T') ? str : `${str}T00:00:00`;
  // Parse without Z so JS treats it as local time
  return new Date(s);
};

/** Get today's local date as "YYYY-MM-DD" for <input type="date"> */
export const todayDateString = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** Get current local datetime-local string for <input type="datetime-local"> */
export const nowDateTimeLocalString = () => {
  return toLocalISO(new Date()).slice(0, 16); // "YYYY-MM-DDTHH:MM"
};

/** Format a date string for display */
export const formatDisplayDate = (dateStr) => {
  const d = parseLocalISO(dateStr);
  if (isToday(d))     return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, yyyy · h:mm a');
};

/** Format date for grouping (date header in list) */
export const formatGroupDate = (dateStr) => {
  const d = parseLocalISO(dateStr);
  if (isToday(d))     return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d, yyyy');
};

/** Format date as short string */
export const formatShortDate = (dateStr) => {
  const d = parseLocalISO(dateStr);
  return format(d, 'MMM d');
};

/** Format month label */
export const formatMonth = (dateStr) => {
  const d = parseLocalISO(dateStr);
  return format(d, 'MMM yyyy');
};

/**
 * Returns true if the date string is in the FUTURE (after now).
 */
export const isFutureDate = (dateStr) => {
  const d = parseLocalISO(dateStr);
  return d > new Date();
};

/** Get the "YYYY-MM-DD" part of a date string */
export const datePart = (dateStr) => dateStr.slice(0, 10);

/** Get last N months as { label, value } pairs for filter dropdowns */
export const getLastNMonths = (n = 6) => {
  const result = [];
  for (let i = 0; i < n; i++) {
    const d = subMonths(new Date(), i);
    result.push({
      label: format(d, 'MMMM yyyy'),
      value: format(d, 'yyyy-MM'),
    });
  }
  return result;
};

/** Get start/end of a given "YYYY-MM" month string */
export const getMonthRange = (yearMonth) => {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return {
    start: startOfDay(startOfMonth(d)),
    end:   endOfDay(endOfMonth(d)),
  };
};
