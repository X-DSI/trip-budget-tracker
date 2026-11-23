import { describe, expect, it } from 'vitest';
import {
  familySize,
  headcount,
  inviteLink,
  isOrganizer,
  newInviteCode,
  nextFamilyColor,
  parseInviteInput,
  pickActiveTrip,
  travelSummary,
  type Leg,
  type Trip,
} from './model';

const leg = (over: Partial<Leg>): Leg => ({
  id: 'l',
  mode: 'car',
  from: '',
  to: '',
  date: null,
  vehicles: 1,
  km: null,
  notes: '',
  order: 0,
  ...over,
});

describe('travelSummary', () => {
  it('counts the cars on the road, not cars × legs', () => {
    const legs = [
      leg({ id: 'a', vehicles: 3, km: 300 }),
      leg({ id: 'b', vehicles: 3, km: 120 }),
      leg({ id: 'c', mode: 'train', vehicles: 1 }),
    ];
    expect(travelSummary(legs, 900)).toEqual({ cars: 3, totalKm: 420, modes: ['car', 'train'] });
  });

  it('falls back to the trip estimate when no leg has a distance', () => {
    expect(travelSummary([leg({})], 850).totalKm).toBe(850);
    expect(travelSummary([], null)).toEqual({ cars: 0, totalKm: null, modes: [] });
  });
});

describe('families', () => {
  it('counts heads of active families only', () => {
    expect(
      headcount([
        { adults: 2, kids: 0, active: true },
        { adults: 4, kids: 2, active: true },
        { adults: 3, kids: 1, active: false },
      ]),
    ).toEqual({ families: 2, adults: 6, kids: 2 });
  });

  it('describes family size', () => {
    expect(familySize({ adults: 1, kids: 0 })).toBe('1 adult');
    expect(familySize({ adults: 2, kids: 1 })).toBe('2 adults, 1 kid');
    expect(familySize({ adults: 2, kids: 3 })).toBe('2 adults, 3 kids');
  });

  it('picks an unused colour', () => {
    expect(nextFamilyColor([])).toBe('teal');
    expect(
      nextFamilyColor([
        { color: 'teal', active: true },
        { color: 'amber', active: false },
      ]),
    ).toBe('amber');
  });
});

describe('invites', () => {
  it('makes 22-character URL-safe codes from 128 random bits', () => {
    const code = newInviteCode((b) => b.fill(255));
    expect(code).toBe('_____________________w');
    expect(newInviteCode()).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(newInviteCode()).not.toBe(newInviteCode());
  });

  it('accepts a pasted link or a bare code', () => {
    const code = 'abcdefghijklmnopqrstuv';
    expect(parseInviteInput(`https://x-dsi-trip-budget.web.app/join/${code}`)).toBe(code);
    expect(parseInviteInput(` ${code} `)).toBe(code);
    expect(parseInviteInput('hello')).toBeNull();
    expect(inviteLink('https://a.app', code)).toBe(`https://a.app/join/${code}`);
  });
});

describe('trips', () => {
  const trip = (id: string, startDate: string) =>
    ({ id, startDate, organizerUids: ['o'] }) as unknown as Trip;

  it('uses the chosen active trip if still a member, else the earliest', () => {
    const trips = [trip('b', '2027-01-10'), trip('a', '2026-12-04')];
    expect(pickActiveTrip(trips, 'b')?.id).toBe('b');
    expect(pickActiveTrip(trips, 'gone')?.id).toBe('a');
    expect(pickActiveTrip([], null)).toBeNull();
  });

  it('checks organisers', () => {
    expect(isOrganizer(trip('a', ''), 'o')).toBe(true);
    expect(isOrganizer(trip('a', ''), 'm')).toBe(false);
    expect(isOrganizer(null, 'o')).toBe(false);
  });
});
