// Calendar dates are `YYYY-MM-DD` strings in the trip's timezone. They are never converted through
// a local-time Date, which shifts the day for people outside the trip's timezone.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface CalendarDate {
  year: number;
  month: number; // 1–12
  day: number;
}

export function parseDate(value: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isValidDate(value: string): boolean {
  return parseDate(value) !== null;
}

/** Whole days from `a` to `b` (b − a). */
export function daysBetween(a: string, b: string): number {
  const pa = parseDate(a);
  const pb = parseDate(b);
  if (!pa || !pb) throw new Error(`invalid date: ${!pa ? a : b}`);
  const ms = Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day);
  return Math.round(ms / 86_400_000);
}

/** Number of calendar days in an inclusive range. */
export function tripLength(startDate: string, endDate: string): number {
  return daysBetween(startDate, endDate) + 1;
}

export function formatDate(value: string, { withYear = true } = {}): string {
  const d = parseDate(value);
  if (!d) return value;
  return `${d.day} ${MONTHS[d.month - 1]}${withYear ? ` ${d.year}` : ''}`;
}

/** "4–7 Dec 2026", "28 Nov – 2 Dec 2026", "30 Dec 2026 – 2 Jan 2027". */
export function formatDateRange(start: string, end: string): string {
  const a = parseDate(start);
  const b = parseDate(end);
  if (!a || !b) return `${start} – ${end}`;
  if (start === end) return formatDate(start);
  if (a.year !== b.year) return `${formatDate(start)} – ${formatDate(end)}`;
  if (a.month !== b.month) return `${formatDate(start, { withYear: false })} – ${formatDate(end)}`;
  return `${a.day}–${b.day} ${MONTHS[b.month - 1]} ${b.year}`;
}
