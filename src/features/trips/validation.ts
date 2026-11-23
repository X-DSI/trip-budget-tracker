import { isValidDate } from '../../lib/dates';
import { isValidUpiId } from '../../domain';
import type { TripInput, LegInput, FamilyInput } from './trips.data';
import type { LegMode } from './model';

export type Errors<K extends string> = Partial<Record<K, string>>;

export interface TripForm {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  expectedKm: string;
  kidWeight: string;
  notes: string;
}

/** Whole, non-negative number from a text field; '' means "not set". */
function parseCount(text: string): number | null | 'invalid' {
  const t = text.trim().replace(/,/g, '');
  if (t === '') return null;
  return /^\d+$/.test(t) ? Number(t) : 'invalid';
}

export function validateTrip(form: TripForm): {
  input?: TripInput;
  errors: Errors<keyof TripForm>;
} {
  const errors: Errors<keyof TripForm> = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Give the trip a name.';
  else if (name.length > 100) errors.name = 'Keep the name under 100 characters.';
  if (form.destination.trim().length > 200) errors.destination = 'Keep this under 200 characters.';

  if (!isValidDate(form.startDate)) errors.startDate = 'Pick a start date.';
  if (!isValidDate(form.endDate)) errors.endDate = 'Pick an end date.';
  else if (isValidDate(form.startDate) && form.endDate < form.startDate) {
    errors.endDate = 'The trip has to end on or after the day it starts.';
  }

  const km = parseCount(form.expectedKm);
  if (km === 'invalid' || (km !== null && km > 100000)) {
    errors.expectedKm = 'Enter whole kilometres (0–100,000), or leave it blank.';
  }

  const kidWeight = Number(form.kidWeight);
  if (!Number.isFinite(kidWeight) || kidWeight < 0 || kidWeight > 1) {
    errors.kidWeight = 'Use a number between 0 and 1 (e.g. 0.5 = a child counts as half).';
  }
  if (form.notes.length > 2000) errors.notes = 'Keep notes under 2,000 characters.';

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    input: {
      name,
      destination: form.destination.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      expectedKm: km as number | null,
      kidWeight,
      notes: form.notes.trim(),
    },
  };
}

export interface LegForm {
  mode: LegMode;
  from: string;
  to: string;
  date: string;
  vehicles: number;
  km: string;
  notes: string;
}

export function validateLeg(form: LegForm): { input?: LegInput; errors: Errors<keyof LegForm> } {
  const errors: Errors<keyof LegForm> = {};
  if (!form.from.trim() && !form.to.trim()) errors.to = 'Add where this leg goes.';
  if (form.from.length > 100 || form.to.length > 100)
    errors.to = 'Keep places under 100 characters.';
  if (form.date && !isValidDate(form.date)) errors.date = 'Pick a valid date.';
  if (!Number.isInteger(form.vehicles) || form.vehicles < 1 || form.vehicles > 50) {
    errors.vehicles = 'Between 1 and 50.';
  }
  const km = parseCount(form.km);
  if (km === 'invalid' || (km !== null && km > 20000)) errors.km = 'Whole kilometres, or blank.';
  if (form.notes.length > 500) errors.notes = 'Keep notes under 500 characters.';

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    input: {
      mode: form.mode,
      from: form.from.trim(),
      to: form.to.trim(),
      date: form.date || null,
      vehicles: form.vehicles,
      km: km as number | null,
      notes: form.notes.trim(),
    },
  };
}

export interface FamilyForm {
  name: string;
  adults: number;
  kids: number;
  upiId: string;
  color: FamilyInput['color'];
}

export function validateFamily(form: FamilyForm): {
  input?: FamilyInput;
  errors: Errors<keyof FamilyForm>;
} {
  const errors: Errors<keyof FamilyForm> = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Give the family a name, e.g. "Daniel & family".';
  else if (name.length > 60) errors.name = 'Keep the name under 60 characters.';
  if (!Number.isInteger(form.adults) || form.adults < 1 || form.adults > 20) {
    errors.adults = 'At least 1 adult.';
  }
  if (!Number.isInteger(form.kids) || form.kids < 0 || form.kids > 20) errors.kids = '0–20.';
  const upi = form.upiId.trim();
  if (upi && !isValidUpiId(upi)) errors.upiId = "That doesn't look like a UPI ID (name@bank).";

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    input: { name, adults: form.adults, kids: form.kids, upiId: upi || null, color: form.color },
  };
}
