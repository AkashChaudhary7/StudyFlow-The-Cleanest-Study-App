import { describe, it, expect } from 'vitest';
import {
  getTodayStr,
  formatDateStr,
  parseDateStr,
  addDays,
  diffDays,
  isPastDate,
  isTodayDate,
  isFutureDate,
  formatFriendlyDate,
  formatDuration,
  formatDigitalTime,
  getGreeting,
  formatTimeOnly,
  formatTimeRange,
  getDaysAgoStr,
} from '../../utils/dateUtils';

describe('dateUtils', () => {
  describe('getTodayStr & formatDateStr & parseDateStr', () => {
    it('returns a valid YYYY-MM-DD string for today', () => {
      const today = getTodayStr();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('formats a date object correctly', () => {
      const date = new Date(2025, 4, 15); // May 15, 2025
      expect(formatDateStr(date)).toBe('2025-05-15');
    });

    it('parses a YYYY-MM-DD string to a Date object without off-by-one errors', () => {
      const parsed = parseDateStr('2025-05-15');
      expect(parsed.getFullYear()).toBe(2025);
      expect(parsed.getMonth()).toBe(4); // May
      expect(parsed.getDate()).toBe(15);
    });

    it('handles malformed or empty date strings safely without throwing', () => {
      expect(() => parseDateStr('')).not.toThrow();
      expect(() => parseDateStr('invalid-date')).not.toThrow();
    });
  });

  describe('addDays & diffDays', () => {
    it('accurately adds days across month boundaries', () => {
      expect(addDays('2025-01-30', 2)).toBe('2025-02-01');
      expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    });

    it('accurately subtracts days when given negative values', () => {
      expect(addDays('2025-03-01', -1)).toBe('2025-02-28');
    });

    it('handles empty date string in addDays safely', () => {
      expect(addDays('', 5)).toBe(getTodayStr());
    });

    it('calculates the exact day difference between two dates', () => {
      expect(diffDays('2025-05-15', '2025-05-10')).toBe(5);
      expect(diffDays('2025-05-10', '2025-05-15')).toBe(-5);
      expect(diffDays('2025-05-10', '2025-05-10')).toBe(0);
    });

    it('handles empty dates in diffDays safely', () => {
      expect(diffDays('', '2025-05-10')).toBe(0);
      expect(diffDays('2025-05-10', '')).toBe(0);
    });
  });

  describe('isPastDate, isTodayDate, isFutureDate', () => {
    it('correctly categorizes relative dates', () => {
      const today = getTodayStr();
      const past = addDays(today, -3);
      const future = addDays(today, 3);

      expect(isTodayDate(today)).toBe(true);
      expect(isPastDate(today)).toBe(false);
      expect(isFutureDate(today)).toBe(false);

      expect(isPastDate(past)).toBe(true);
      expect(isTodayDate(past)).toBe(false);
      expect(isFutureDate(past)).toBe(false);

      expect(isFutureDate(future)).toBe(true);
      expect(isTodayDate(future)).toBe(false);
      expect(isPastDate(future)).toBe(false);
    });
  });

  describe('formatFriendlyDate', () => {
    it('returns "Today", "Tomorrow", and "Yesterday"', () => {
      const today = getTodayStr();
      expect(formatFriendlyDate(today)).toBe('Today');
      expect(formatFriendlyDate(addDays(today, 1))).toBe('Tomorrow');
      expect(formatFriendlyDate(addDays(today, -1))).toBe('Yesterday');
    });

    it('returns empty string for empty input', () => {
      expect(formatFriendlyDate('')).toBe('');
      expect(formatFriendlyDate(undefined)).toBe('');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds into human readable duration strings', () => {
      expect(formatDuration(0)).toBe('0 min');
      expect(formatDuration(0, true)).toBe('0m');
      expect(formatDuration(45)).toBe('45s');
      expect(formatDuration(45, true)).toBe('45s');
      expect(formatDuration(180)).toBe('3 min');
      expect(formatDuration(180, true)).toBe('3m');
      expect(formatDuration(3660)).toBe('1h 1m');
      expect(formatDuration(3660, true)).toBe('1h 1m');
      expect(formatDuration(7200)).toBe('2h');
      expect(formatDuration(7200, true)).toBe('2h');
    });
  });

  describe('formatDigitalTime', () => {
    it('formats seconds into digital mm:ss or hh:mm:ss format', () => {
      expect(formatDigitalTime(0)).toBe('00:00');
      expect(formatDigitalTime(65)).toBe('01:05');
      expect(formatDigitalTime(3605)).toBe('01:00:05');
    });
  });

  describe('getGreeting', () => {
    it('returns a greeting string', () => {
      const greeting = getGreeting();
      expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
    });
  });

  describe('formatTimeOnly & formatTimeRange', () => {
    it('formats ISO timestamps into 12-hour AM/PM times', () => {
      const iso = new Date('2025-05-15T14:30:00Z').toISOString();
      const formatted = formatTimeOnly(iso);
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    });

    it('returns empty string on invalid or missing date', () => {
      expect(formatTimeOnly('')).toBe('');
      expect(formatTimeOnly(undefined)).toBe('');
      expect(formatTimeOnly('not-a-date')).toBe('');
    });

    it('formats time range', () => {
      const start = new Date('2025-05-15T09:00:00').toISOString();
      const end = new Date('2025-05-15T10:00:00').toISOString();
      const range = formatTimeRange(start, end);
      expect(range).toContain('–');
    });
  });

  describe('getDaysAgoStr', () => {
    it('returns correct past date formatted as YYYY-MM-DD', () => {
      const sevenDaysAgo = getDaysAgoStr(7);
      expect(sevenDaysAgo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(diffDays(getTodayStr(), sevenDaysAgo)).toBe(7);
    });
  });
});
