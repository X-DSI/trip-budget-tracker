// Trip-planning types and pure helpers (no Firebase). Field names follow docs/data-model.md.

import type { Family } from '../../domain';

export type Role = 'owner' | 'organizer' | 'member';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  timezone: string;
  expectedKm: number | null;
  kidWeight: number;
  currency: 'INR';
  ownerUid: string;
  memberUids: string[];
  organizerUids: string[];
  notes: string;
  /** Pinned on Home: hotel addresses, bookings, emergency contacts. Organisers edit. */
  importantInfo: string;
}

export interface TripFamily extends Family {
  name: string;
  upiId: string | null;
  color: FamilyColor;
}

export interface Member {
  uid: string;
  displayName: string;
  photoURL: string | null;
  familyId: string | null;
  role: Role;
}

export interface InvitePreview {
  tripName: string;
  tripStartDate: string;
  tripEndDate: string;
  tripDestination: string;
  ownerName: string;
}

export interface Invite {
  code: string;
  tripId: string;
  active: boolean;
  /** Missing on invites made before previews existed. */
  preview: InvitePreview | null;
}

/** The preview an invite should carry for this trip (docs/adr/2026-11-24-invite-preview.md). */
export function invitePreview(
  trip: Pick<Trip, 'name' | 'startDate' | 'endDate' | 'destination'>,
  ownerName: string,
): InvitePreview {
  return {
    tripName: trip.name,
    tripStartDate: trip.startDate,
    tripEndDate: trip.endDate,
    tripDestination: trip.destination,
    ownerName,
  };
}

export const FAMILY_COLORS = [
  'teal',
  'amber',
  'rose',
  'indigo',
  'lime',
  'sky',
  'fuchsia',
  'orange',
] as const;
export type FamilyColor = (typeof FAMILY_COLORS)[number];

/** Tailwind classes per colour (spelled out so Tailwind keeps them). */
export const FAMILY_COLOR_CLASSES: Record<FamilyColor, { dot: string; chip: string }> = {
  teal: { dot: 'bg-teal-500', chip: 'bg-teal-50 text-teal-800 ring-teal-200' },
  amber: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800 ring-amber-200' },
  rose: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-800 ring-rose-200' },
  indigo: { dot: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-800 ring-indigo-200' },
  lime: { dot: 'bg-lime-500', chip: 'bg-lime-50 text-lime-800 ring-lime-200' },
  sky: { dot: 'bg-sky-500', chip: 'bg-sky-50 text-sky-800 ring-sky-200' },
  fuchsia: { dot: 'bg-fuchsia-500', chip: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200' },
  orange: { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-800 ring-orange-200' },
};

export function asFamilyColor(value: unknown): FamilyColor {
  return (FAMILY_COLORS as readonly unknown[]).includes(value) ? (value as FamilyColor) : 'teal';
}

/** The first colour not already used by an active family. */
export function nextFamilyColor(families: Pick<TripFamily, 'color' | 'active'>[]): FamilyColor {
  const used = new Set(families.filter((f) => f.active).map((f) => f.color));
  return FAMILY_COLORS.find((c) => !used.has(c)) ?? FAMILY_COLORS[families.length % 8]!;
}

export function isOrganizer(trip: Pick<Trip, 'organizerUids'> | null, uid: string | undefined) {
  return !!trip && !!uid && trip.organizerUids.includes(uid);
}

export interface Headcount {
  families: number;
  adults: number;
  kids: number;
}

export function headcount(families: Pick<TripFamily, 'adults' | 'kids' | 'active'>[]): Headcount {
  const active = families.filter((f) => f.active);
  return {
    families: active.length,
    adults: active.reduce((s, f) => s + f.adults, 0),
    kids: active.reduce((s, f) => s + f.kids, 0),
  };
}

/** Unguessable, URL-safe invite code: 16 random bytes → 22 base64url characters (128 bits). */
export function newInviteCode(
  random: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array = defaultRandom,
): string {
  const bytes = random(new Uint8Array(16));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function defaultRandom(bytes: Uint8Array<ArrayBuffer>): Uint8Array {
  return crypto.getRandomValues(bytes);
}

/** Accept a pasted invite link or a bare code. Returns the code, or null. */
export function parseInviteInput(input: string): string | null {
  const trimmed = input.trim();
  const fromLink = /\/join\/([A-Za-z0-9_-]{22,})/.exec(trimmed);
  if (fromLink) return fromLink[1]!;
  return /^[A-Za-z0-9_-]{22,}$/.test(trimmed) ? trimmed : null;
}

export function inviteLink(origin: string, code: string): string {
  return `${origin}/join/${code}`;
}

export function familySize(f: Pick<TripFamily, 'adults' | 'kids'>): string {
  const adults = `${f.adults} adult${f.adults === 1 ? '' : 's'}`;
  return f.kids > 0 ? `${adults}, ${f.kids} kid${f.kids === 1 ? '' : 's'}` : adults;
}

export function pickActiveTrip(
  trips: Trip[],
  activeTripId: string | null | undefined,
): Trip | null {
  const sorted = [...trips].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id),
  );
  return sorted.find((t) => t.id === activeTripId) ?? sorted[0] ?? null;
}

/** The trip owner's display name, as shown on invites. */
export function ownerNameOf(
  trip: Pick<Trip, 'ownerUid'>,
  members: Pick<Member, 'uid' | 'displayName'>[],
) {
  return members.find((m) => m.uid === trip.ownerUid)?.displayName ?? '';
}
