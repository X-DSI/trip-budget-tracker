import { describe, expect, it } from 'vitest';
import { lineForDay, splitCountdown, startOfDay, tripPhase, zonedParts, DAY_LINES } from './phase';

const trip = { startDate: '2026-12-04', endDate: '2026-12-07', timezone: 'Asia/Kolkata' };
const ist = (iso: string) => Date.parse(`${iso}+05:30`);

describe('tripPhase', () => {
  it('is "none" without a trip', () => {
    expect(tripPhase(null, Date.now())).toEqual({ phase: 'none', totalDays: 0 });
  });

  it('counts down until midnight IST on the start date', () => {
    const p = tripPhase(trip, ist('2026-12-03T23:59:00'));
    expect(p).toMatchObject({ phase: 'before', daysToGo: 1, totalDays: 4, msToStart: 60_000 });
    expect(tripPhase(trip, ist('2026-11-24T15:00:00'))).toMatchObject({
      phase: 'before',
      daysToGo: 10,
    });
  });

  it('starts at 00:00 IST on the first day', () => {
    expect(tripPhase(trip, ist('2026-12-04T00:00:00'))).toMatchObject({
      phase: 'during',
      dayNumber: 1,
      totalDays: 4,
    });
  });

  it('is still the last day at 23:59 IST, and over at 00:00 the next day', () => {
    expect(tripPhase(trip, ist('2026-12-07T23:59:59'))).toMatchObject({
      phase: 'during',
      dayNumber: 4,
    });
    expect(tripPhase(trip, ist('2026-12-08T00:00:00'))).toMatchObject({ phase: 'after' });
  });

  it('handles a one-day trip', () => {
    const day = { ...trip, endDate: '2026-12-04' };
    expect(tripPhase(day, ist('2026-12-04T12:00:00'))).toMatchObject({
      phase: 'during',
      dayNumber: 1,
      totalDays: 1,
    });
    expect(tripPhase(day, ist('2026-12-05T00:00:00')).phase).toBe('after');
  });

  it("uses the trip's timezone, not the device's", () => {
    // 20:00 UTC on 3 Dec is already 01:30 on 4 Dec in India.
    expect(tripPhase(trip, Date.parse('2026-12-03T20:00:00Z'))).toMatchObject({
      phase: 'during',
      dayNumber: 1,
    });
  });
});

describe('time helpers', () => {
  it('finds midnight in a timezone', () => {
    expect(new Date(startOfDay('2026-12-04', 'Asia/Kolkata')).toISOString()).toBe(
      '2026-12-03T18:30:00.000Z',
    );
    expect(zonedParts(Date.parse('2026-12-03T18:30:00Z'), 'Asia/Kolkata').date).toBe('2026-12-04');
  });

  it('splits a countdown', () => {
    expect(splitCountdown(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });
    expect(splitCountdown(-5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it('rotates friendly lines by day', () => {
    expect(lineForDay(1)).toBe(DAY_LINES[0]);
    expect(lineForDay(DAY_LINES.length + 1)).toBe(DAY_LINES[0]);
  });
});
