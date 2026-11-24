// Where we are relative to the trip, in the trip's own timezone. Pure: `now` is passed in.

import { daysBetween, tripLength } from '../../lib/dates';

export type Phase = 'none' | 'before' | 'during' | 'after';

export interface TripPhase {
  phase: Phase;
  totalDays: number;
  /** 'during' only: 1 on the first day. */
  dayNumber?: number;
  /** 'before' only: whole calendar days until the start date (1 = tomorrow). */
  daysToGo?: number;
  /** 'before' only: milliseconds until 00:00 on the start date, trip time. */
  msToStart?: number;
  /** 'before' only: the instant the trip starts (00:00 on the start date, trip time). */
  startsAt?: number;
  /** Today's date in the trip's timezone. */
  today?: string;
}

interface ZonedParts {
  date: string;
  /** Milliseconds between this instant and the same wall-clock time read as UTC. */
  offsetMs: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** The calendar date and UTC offset at `instant` in `timeZone`. */
export function zonedParts(instant: number, timeZone: string): ZonedParts {
  const parts = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(new Date(instant))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const wholeSeconds = Math.floor(instant / 1000) * 1000;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    offsetMs: asUtc - wholeSeconds,
  };
}

/** The instant of 00:00 on `date` in `timeZone`. */
export function startOfDay(date: string, timeZone: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d);
  // Two passes handle a zone whose offset differs at the guess and at the answer (DST edges).
  const first = guess - zonedParts(guess, timeZone).offsetMs;
  return guess - zonedParts(first, timeZone).offsetMs;
}

export function tripPhase(
  trip: { startDate: string; endDate: string; timezone?: string } | null,
  now: number,
): TripPhase {
  if (!trip || !trip.startDate || !trip.endDate) return { phase: 'none', totalDays: 0 };
  const timeZone = trip.timezone || 'Asia/Kolkata';
  const totalDays = tripLength(trip.startDate, trip.endDate);
  const today = zonedParts(now, timeZone).date;

  if (today < trip.startDate) {
    const startsAt = startOfDay(trip.startDate, timeZone);
    return {
      phase: 'before',
      totalDays,
      today,
      daysToGo: daysBetween(today, trip.startDate),
      msToStart: Math.max(0, startsAt - now),
      startsAt,
    };
  }
  if (today > trip.endDate) return { phase: 'after', totalDays, today };
  return { phase: 'during', totalDays, today, dayNumber: daysBetween(trip.startDate, today) + 1 };
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function splitCountdown(ms: number): Countdown {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

/** Friendly lines for each day of the trip, rotating; works offline. */
export const DAY_LINES = [
  'Fill up the tanks, grab the snacks, and enjoy the road together.',
  'Take the scenic stop. The photos will be worth it.',
  'Slow mornings and long chai breaks are part of the plan.',
  'Someone pick the playlist. Everyone else, pick the next dhaba.',
  'Make a memory today you will still be laughing about next year.',
  'Drink water, keep the kids happy, and enjoy the views.',
  'Good company makes every kilometre shorter.',
];

export function lineForDay(dayNumber: number): string {
  return DAY_LINES[(Math.max(1, dayNumber) - 1) % DAY_LINES.length]!;
}
