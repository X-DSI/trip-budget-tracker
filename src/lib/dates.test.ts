import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  formatDate,
  formatDateRange,
  isValidDate,
  parseDate,
  tripLength,
} from './dates';

describe('dates', () => {
  it('parses only real calendar dates', () => {
    expect(parseDate('2026-12-04')).toEqual({ year: 2026, month: 12, day: 4 });
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('4 Dec 2026')).toBe(false);
  });

  it('counts days without timezone drift', () => {
    expect(daysBetween('2026-12-04', '2026-12-07')).toBe(3);
    expect(tripLength('2026-12-04', '2026-12-07')).toBe(4);
    expect(tripLength('2026-12-31', '2027-01-01')).toBe(2);
    expect(() => daysBetween('bad', '2026-12-07')).toThrow();
  });

  it('formats single dates and ranges compactly', () => {
    expect(formatDate('2026-12-04')).toBe('4 Dec 2026');
    expect(formatDate('2026-12-04', { withYear: false })).toBe('4 Dec');
    expect(formatDateRange('2026-12-04', '2026-12-07')).toBe('4–7 Dec 2026');
    expect(formatDateRange('2026-11-28', '2026-12-02')).toBe('28 Nov – 2 Dec 2026');
    expect(formatDateRange('2026-12-30', '2027-01-02')).toBe('30 Dec 2026 – 2 Jan 2027');
    expect(formatDateRange('2026-12-04', '2026-12-04')).toBe('4 Dec 2026');
    expect(formatDateRange('x', 'y')).toBe('x – y');
  });
});
