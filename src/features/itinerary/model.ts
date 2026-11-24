// The day-by-day plan (docs/adr/2026-11-24-itinerary-replaces-legs.md). Pure helpers only.
// Days are `YYYY-MM-DD` and times `HH:MM`, both in the trip's timezone; compared as strings.

import { daysBetween, isValidDate, parseDate } from '../../lib/dates';

export type ItemKind = 'travel' | 'sightseeing' | 'food' | 'stay' | 'activity' | 'other';
export type TravelMode = 'car' | 'bus' | 'train' | 'flight' | 'other';

export interface ItineraryItem {
  id: string;
  day: string;
  time: string | null;
  kind: ItemKind;
  title: string;
  place: string;
  notes: string;
  mode: TravelMode | null;
  vehicles: number | null;
  km: number | null;
  order: number;
}

export const KINDS: { value: ItemKind; label: string; emoji: string }[] = [
  { value: 'travel', label: 'Travel', emoji: '🚗' },
  { value: 'sightseeing', label: 'Sightseeing', emoji: '📸' },
  { value: 'food', label: 'Food', emoji: '🍛' },
  { value: 'stay', label: 'Stay', emoji: '🏨' },
  { value: 'activity', label: 'Activity', emoji: '🎯' },
  { value: 'other', label: 'Other', emoji: '📌' },
];

export const TRAVEL_MODES: { value: TravelMode; label: string; emoji: string; vehicles: string }[] =
  [
    { value: 'car', label: 'Car', emoji: '🚗', vehicles: 'Cars' },
    { value: 'bus', label: 'Bus', emoji: '🚌', vehicles: 'Buses' },
    { value: 'train', label: 'Train', emoji: '🚆', vehicles: 'Bookings' },
    { value: 'flight', label: 'Flight', emoji: '✈️', vehicles: 'Bookings' },
    { value: 'other', label: 'Other', emoji: '🧭', vehicles: 'Vehicles' },
  ];

export function kindOf(kind: ItemKind) {
  return KINDS.find((k) => k.value === kind) ?? KINDS[KINDS.length - 1]!;
}

/** The icon for an item: the travel mode's for travel, the kind's otherwise. */
export function itemEmoji(item: Pick<ItineraryItem, 'kind' | 'mode'>): string {
  if (item.kind === 'travel' && item.mode) {
    return TRAVEL_MODES.find((m) => m.value === item.mode)?.emoji ?? '🚗';
  }
  return kindOf(item.kind).emoji;
}

/** "Car · 2 cars · 300 km" for travel items; empty for others. */
export function travelDetails(item: ItineraryItem): string {
  if (item.kind !== 'travel') return '';
  const mode = TRAVEL_MODES.find((m) => m.value === item.mode);
  const parts: string[] = [];
  if (mode) parts.push(mode.label);
  if (item.vehicles && (item.mode === 'car' || item.mode === 'bus')) {
    const noun = item.mode === 'car' ? 'car' : 'bus';
    parts.push(
      `${item.vehicles} ${item.vehicles === 1 ? noun : noun === 'bus' ? 'buses' : 'cars'}`,
    );
  }
  if (item.km != null) parts.push(`${item.km.toLocaleString('en-IN')} km`);
  return parts.join(' · ');
}

/** By day, then untimed before timed, then time, then order. */
export function compareItems(a: ItineraryItem, b: ItineraryItem): number {
  return (
    a.day.localeCompare(b.day) ||
    (a.time === null ? 0 : 1) - (b.time === null ? 0 : 1) ||
    (a.time ?? '').localeCompare(b.time ?? '') ||
    a.order - b.order ||
    a.id.localeCompare(b.id)
  );
}

export function sortItems(items: ItineraryItem[]): ItineraryItem[] {
  return [...items].sort(compareItems);
}

/** Every date of the trip, inclusive. */
export function tripDays(startDate: string, endDate: string): string[] {
  if (!isValidDate(startDate) || !isValidDate(endDate) || endDate < startDate) return [];
  const n = daysBetween(startDate, endDate) + 1;
  const start = parseDate(startDate)!;
  return Array.from({ length: n }, (_, i) =>
    new Date(Date.UTC(start.year, start.month - 1, start.day + i)).toISOString().slice(0, 10),
  );
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Sat 5 Dec". */
export function shortDay(day: string): string {
  const d = parseDate(day);
  if (!d) return day;
  const weekday = new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
  return `${WEEKDAYS[weekday]} ${d.day} ${MONTHS[d.month - 1]}`;
}

/** "Day 2 · Sat 5 Dec" (or just the date if outside the trip). */
export function dayLabel(day: string, startDate: string): string {
  const n = isValidDate(startDate) && isValidDate(day) ? daysBetween(startDate, day) + 1 : 0;
  return n >= 1 ? `Day ${n} · ${shortDay(day)}` : shortDay(day);
}

/** "7:30 am" from "07:30". */
export function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number) as [number, number];
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function mapsUrl(place: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.trim())}`;
}

export interface Now {
  /** Today in the trip's timezone. */
  today: string;
  /** The time now in the trip's timezone, HH:MM. */
  time: string;
}

/**
 * Up to `n` items to show under "Coming up": from now on during the trip (today's untimed items
 * and anything not yet started), from day 1 before it, and the last few after it.
 */
export function comingUp(
  items: ItineraryItem[],
  trip: { startDate: string; endDate: string },
  now: Now,
  n = 5,
): ItineraryItem[] {
  const sorted = sortItems(items);
  if (now.today < trip.startDate) return sorted.slice(0, n);
  if (now.today > trip.endDate) return sorted.slice(-n);
  return sorted
    .filter(
      (i) => i.day > now.today || (i.day === now.today && (i.time === null || i.time >= now.time)),
    )
    .slice(0, n);
}

/** The next timed item today that hasn't started yet, for highlighting. */
export function nextUpId(items: ItineraryItem[], now: Now): string | null {
  return (
    sortItems(items).find((i) => i.day === now.today && i.time !== null && i.time >= now.time)
      ?.id ?? null
  );
}

export interface TravelSummary {
  /** Cars on the road: the most cars any one car item uses (the same cars drive every leg). */
  cars: number;
  /** Total km of travel items when any has it; otherwise the trip's estimate. */
  totalKm: number | null;
}

export function travelSummary(items: ItineraryItem[], expectedKm: number | null): TravelSummary {
  const travel = items.filter((i) => i.kind === 'travel');
  const withKm = travel.filter((i) => i.km != null);
  return {
    cars: travel
      .filter((i) => i.mode === 'car')
      .reduce((max, i) => Math.max(max, i.vehicles ?? 0), 0),
    totalKm: withKm.length > 0 ? withKm.reduce((s, i) => s + (i.km ?? 0), 0) : expectedKm,
  };
}

// ---------- form ----------

export interface ItemForm {
  day: string;
  time: string;
  kind: ItemKind;
  title: string;
  place: string;
  notes: string;
  mode: TravelMode;
  vehicles: number;
  km: string;
}

export type ItemInput = Omit<ItineraryItem, 'id' | 'order'>;
export type ItemErrors = Partial<Record<keyof ItemForm, string>>;

export function validateItem(
  form: ItemForm,
  trip: { startDate: string; endDate: string },
): { input?: ItemInput; errors: ItemErrors } {
  const errors: ItemErrors = {};
  if (!isValidDate(form.day) || form.day < trip.startDate || form.day > trip.endDate) {
    errors.day = 'Pick a day of the trip.';
  }
  if (form.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) errors.time = 'Pick a valid time.';
  const title = form.title.trim();
  if (!title) errors.title = 'Say what’s planned, e.g. “Drive to Ooty”.';
  else if (title.length > 100) errors.title = 'Keep it under 100 characters.';
  if (form.place.trim().length > 200) errors.place = 'Keep the place under 200 characters.';
  if (form.notes.length > 500) errors.notes = 'Keep notes under 500 characters.';

  const travel = form.kind === 'travel';
  let km: number | null = null;
  if (travel) {
    if (!Number.isInteger(form.vehicles) || form.vehicles < 1 || form.vehicles > 50) {
      errors.vehicles = 'Between 1 and 50.';
    }
    const t = form.km.trim().replace(/,/g, '');
    if (t) {
      if (!/^\d+$/.test(t) || Number(t) > 20000) errors.km = 'Whole kilometres, or blank.';
      else km = Number(t);
    }
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    input: {
      day: form.day,
      time: form.time || null,
      kind: form.kind,
      title,
      place: form.place.trim(),
      notes: form.notes.trim(),
      mode: travel ? form.mode : null,
      vehicles: travel ? form.vehicles : null,
      km: travel ? km : null,
    },
  };
}

export function itemToForm(item: ItineraryItem): ItemForm {
  return {
    day: item.day,
    time: item.time ?? '',
    kind: item.kind,
    title: item.title,
    place: item.place,
    notes: item.notes,
    mode: item.mode ?? 'car',
    vehicles: item.vehicles ?? 1,
    km: item.km != null ? String(item.km) : '',
  };
}
