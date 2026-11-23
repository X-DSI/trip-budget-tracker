import { describe, expect, it } from 'vitest';
import { validateFamily, validateLeg, validateTrip, type TripForm } from './validation';

const tripForm = (over: Partial<TripForm> = {}): TripForm => ({
  name: ' Ooty & Coorg ',
  destination: 'Ooty, Coorg',
  startDate: '2026-12-04',
  endDate: '2026-12-07',
  expectedKm: '850',
  kidWeight: '0.5',
  notes: '',
  ...over,
});

describe('validateTrip', () => {
  it('accepts a good trip and trims it', () => {
    const { input, errors } = validateTrip(tripForm());
    expect(errors).toEqual({});
    expect(input).toMatchObject({ name: 'Ooty & Coorg', expectedKm: 850, kidWeight: 0.5 });
  });

  it('treats a blank distance as not set', () => {
    expect(validateTrip(tripForm({ expectedKm: '' })).input?.expectedKm).toBeNull();
    expect(validateTrip(tripForm({ expectedKm: '1,200' })).input?.expectedKm).toBe(1200);
  });

  it('explains what is wrong', () => {
    const { input, errors } = validateTrip(
      tripForm({ name: ' ', endDate: '2026-12-01', expectedKm: '-3', kidWeight: '2' }),
    );
    expect(input).toBeUndefined();
    expect(Object.keys(errors).sort()).toEqual(['endDate', 'expectedKm', 'kidWeight', 'name']);
    expect(validateTrip(tripForm({ startDate: '' })).errors.startDate).toBeTruthy();
  });
});

describe('validateLeg', () => {
  const leg = {
    mode: 'car' as const,
    from: 'Hosur',
    to: 'Ooty',
    date: '',
    vehicles: 3,
    km: '',
    notes: '',
  };

  it('accepts a leg with optional fields blank', () => {
    expect(validateLeg(leg).input).toEqual({
      mode: 'car',
      from: 'Hosur',
      to: 'Ooty',
      date: null,
      vehicles: 3,
      km: null,
      notes: '',
    });
  });

  it('needs a place and sane numbers', () => {
    expect(validateLeg({ ...leg, from: '', to: '' }).errors.to).toBeTruthy();
    expect(validateLeg({ ...leg, vehicles: 0 }).errors.vehicles).toBeTruthy();
    expect(validateLeg({ ...leg, km: '12.5' }).errors.km).toBeTruthy();
    expect(validateLeg({ ...leg, date: '2026-02-30' }).errors.date).toBeTruthy();
  });
});

describe('validateFamily', () => {
  const fam = { name: 'Daniel & family', adults: 2, kids: 1, upiId: '', color: 'teal' as const };

  it('accepts a family, with or without a UPI ID', () => {
    expect(validateFamily(fam).input).toEqual({ ...fam, upiId: null });
    expect(validateFamily({ ...fam, upiId: ' dsi@okicici ' }).input?.upiId).toBe('dsi@okicici');
  });

  it('rejects bad names, counts and UPI IDs', () => {
    expect(validateFamily({ ...fam, name: '' }).errors.name).toBeTruthy();
    expect(validateFamily({ ...fam, adults: 0 }).errors.adults).toBeTruthy();
    expect(validateFamily({ ...fam, upiId: 'not a upi' }).errors.upiId).toBeTruthy();
  });
});
