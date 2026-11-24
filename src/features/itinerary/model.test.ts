import { describe, expect, it } from 'vitest';
import {
  comingUp,
  dayLabel,
  formatTime,
  itemToForm,
  mapsUrl,
  nextUpId,
  sortItems,
  travelDetails,
  travelSummary,
  tripDays,
  validateItem,
  type ItemForm,
  type ItineraryItem,
} from './model';

const trip = { startDate: '2026-12-04', endDate: '2026-12-07' };

let n = 0;
const item = (over: Partial<ItineraryItem>): ItineraryItem => ({
  id: `i${++n}`,
  day: '2026-12-04',
  time: null,
  kind: 'sightseeing',
  title: 'Plan',
  place: '',
  notes: '',
  mode: null,
  vehicles: null,
  km: null,
  order: 0,
  ...over,
});

describe('sorting', () => {
  it('sorts by day, untimed first, then time, then order', () => {
    const a = item({ id: 'a', day: '2026-12-05', time: '09:00' });
    const b = item({ id: 'b', day: '2026-12-04', time: '18:00' });
    const c = item({ id: 'c', day: '2026-12-04', time: null, order: 1 });
    const d = item({ id: 'd', day: '2026-12-04', time: '07:30' });
    const e = item({ id: 'e', day: '2026-12-04', time: null, order: 0 });
    expect(sortItems([a, b, c, d, e]).map((i) => i.id)).toEqual(['e', 'c', 'd', 'b', 'a']);
  });
});

describe('comingUp', () => {
  const items = [
    item({ id: 'd1-am', day: '2026-12-04', time: '07:00' }),
    item({ id: 'd1-pm', day: '2026-12-04', time: '19:00' }),
    item({ id: 'd2-any', day: '2026-12-05', time: null }),
    item({ id: 'd2-am', day: '2026-12-05', time: '08:00' }),
    item({ id: 'd2-pm', day: '2026-12-05', time: '16:00' }),
    item({ id: 'd3', day: '2026-12-06', time: '10:00' }),
    item({ id: 'd4', day: '2026-12-07', time: '10:00' }),
  ];
  const ids = (list: ItineraryItem[]) => list.map((i) => i.id);

  it('shows the first five from day 1 before the trip', () => {
    expect(ids(comingUp(items, trip, { today: '2026-11-30', time: '12:00' }))).toEqual([
      'd1-am',
      'd1-pm',
      'd2-any',
      'd2-am',
      'd2-pm',
    ]);
  });

  it("shows what hasn't started yet during the trip, keeping today's untimed items", () => {
    expect(ids(comingUp(items, trip, { today: '2026-12-05', time: '12:00' }))).toEqual([
      'd2-any',
      'd2-pm',
      'd3',
      'd4',
    ]);
  });

  it('shows the last five after the trip', () => {
    expect(ids(comingUp(items, trip, { today: '2026-12-09', time: '12:00' }))).toEqual([
      'd2-any',
      'd2-am',
      'd2-pm',
      'd3',
      'd4',
    ]);
  });

  it('picks the next timed item today', () => {
    expect(nextUpId(items, { today: '2026-12-05', time: '08:00' })).toBe('d2-am');
    expect(nextUpId(items, { today: '2026-12-05', time: '20:00' })).toBeNull();
  });
});

describe('travel', () => {
  const drive = item({ kind: 'travel', mode: 'car', vehicles: 3, km: 300 });
  const train = item({ kind: 'travel', mode: 'train', vehicles: 1, km: 46 });

  it('counts the cars on the road and adds up km, else uses the estimate', () => {
    expect(travelSummary([drive, train, item({})], 900)).toEqual({ cars: 3, totalKm: 346 });
    expect(travelSummary([item({})], 900)).toEqual({ cars: 0, totalKm: 900 });
  });

  it('describes travel items', () => {
    expect(travelDetails(drive)).toBe('Car · 3 cars · 300 km');
    expect(travelDetails(train)).toBe('Train · 46 km');
    expect(travelDetails(item({}))).toBe('');
  });
});

describe('days and labels', () => {
  it('lists every day of the trip', () => {
    expect(tripDays('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
    expect(tripDays('2026-12-07', '2026-12-04')).toEqual([]);
  });

  it('labels days and times', () => {
    expect(dayLabel('2026-12-05', '2026-12-04')).toBe('Day 2 · Sat 5 Dec');
    expect(formatTime('07:30')).toBe('7:30 am');
    expect(formatTime('12:05')).toBe('12:05 pm');
    expect(formatTime('00:00')).toBe('12:00 am');
    expect(formatTime(null)).toBe('');
  });

  it('builds a Maps search link', () => {
    expect(mapsUrl(' Botanical Garden, Ooty ')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Botanical%20Garden%2C%20Ooty',
    );
  });
});

describe('validateItem', () => {
  const form = (over: Partial<ItemForm> = {}): ItemForm => ({
    day: '2026-12-05',
    time: '',
    kind: 'travel',
    title: ' Drive to Coorg ',
    place: 'Coorg',
    notes: '',
    mode: 'car',
    vehicles: 2,
    km: '1,200',
    ...over,
  });

  it('accepts a travel item and keeps its travel fields', () => {
    expect(validateItem(form(), trip).input).toEqual({
      day: '2026-12-05',
      time: null,
      kind: 'travel',
      title: 'Drive to Coorg',
      place: 'Coorg',
      notes: '',
      mode: 'car',
      vehicles: 2,
      km: 1200,
    });
  });

  it('drops travel fields for other kinds', () => {
    expect(validateItem(form({ kind: 'food', time: '13:00' }), trip).input).toMatchObject({
      kind: 'food',
      time: '13:00',
      mode: null,
      vehicles: null,
      km: null,
    });
  });

  it('rejects days outside the trip, empty titles and bad numbers', () => {
    const { errors } = validateItem(
      form({ day: '2026-12-08', title: '', km: '12.5', vehicles: 0 }),
      trip,
    );
    expect(Object.keys(errors).sort()).toEqual(['day', 'km', 'title', 'vehicles']);
  });

  it('round-trips an item through the form', () => {
    const saved = item({ kind: 'travel', mode: 'bus', vehicles: 1, km: 120, time: '06:15' });
    expect(validateItem(itemToForm(saved), trip).input).toMatchObject({
      mode: 'bus',
      km: 120,
      time: '06:15',
    });
  });
});
