// Firestore reads and writes for trips. Writes are queued offline and never awaited by the UI,
// except joining, which needs the server to check the invite.

import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useLiveDoc, useLiveQuery } from '../../lib/live';
import { trackWrite } from '../../lib/sync';
import { reportError, writeErrorMessage } from '../../lib/errors';
import type { User } from '../../lib/auth';
import {
  asFamilyColor,
  invitePreview,
  newInviteCode,
  type Invite,
  type Leg,
  type LegMode,
  type Member,
  type Role,
  type Trip,
  type TripFamily,
} from './model';

// ---------- mapping ----------

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);
const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null);
const numOrNull = (v: unknown) => (typeof v === 'number' ? v : null);
const strList = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

function toTrip(snap: DocumentSnapshot): Trip {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    name: str(d.name, 'Untitled trip'),
    destination: str(d.destination),
    startDate: str(d.startDate),
    endDate: str(d.endDate),
    timezone: str(d.timezone, 'Asia/Kolkata'),
    expectedKm: numOrNull(d.expectedKm),
    kidWeight: num(d.kidWeight, 0.5),
    currency: 'INR',
    ownerUid: str(d.ownerUid),
    memberUids: strList(d.memberUids),
    organizerUids: strList(d.organizerUids),
    notes: str(d.notes),
  };
}

function toLeg(snap: DocumentSnapshot): Leg {
  const d = snap.data() ?? {};
  const mode = str(d.mode, 'car');
  return {
    id: snap.id,
    mode: (['car', 'bus', 'train', 'flight', 'other'].includes(mode) ? mode : 'other') as LegMode,
    from: str(d.from),
    to: str(d.to),
    date: strOrNull(d.date),
    vehicles: num(d.vehicles, 1),
    km: numOrNull(d.km),
    notes: str(d.notes),
    order: num(d.order, 0),
  };
}

function toFamily(snap: DocumentSnapshot): TripFamily {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    name: str(d.name, 'Family'),
    adults: num(d.adults, 1),
    kids: num(d.kids, 0),
    upiId: strOrNull(d.upiId),
    color: asFamilyColor(d.color),
    order: num(d.order, 0),
    active: d.active !== false,
  };
}

function toMember(snap: DocumentSnapshot): Member {
  const d = snap.data() ?? {};
  const role = str(d.role, 'member');
  return {
    uid: snap.id,
    displayName: str(d.displayName, 'Traveller'),
    photoURL: strOrNull(d.photoURL),
    familyId: strOrNull(d.familyId),
    role: (['owner', 'organizer', 'member'].includes(role) ? role : 'member') as Role,
  };
}

function toInvite(snap: DocumentSnapshot): Invite {
  const d = snap.data() ?? {};
  return {
    code: snap.id,
    tripId: str(d.tripId),
    active: d.active === true,
    preview:
      typeof d.tripName === 'string'
        ? {
            tripName: d.tripName,
            tripStartDate: str(d.tripStartDate),
            tripEndDate: str(d.tripEndDate),
            tripDestination: str(d.tripDestination),
            ownerName: str(d.ownerName),
          }
        : null,
  };
}

// ---------- live reads ----------

export function useMyTrips(uid: string | undefined) {
  return useLiveQuery(
    uid ? `myTrips:${uid}` : null,
    () => query(collection(db, 'trips'), where('memberUids', 'array-contains', uid)),
    toTrip,
  );
}

export function useTrip(tripId: string | null) {
  return useLiveDoc(tripId ? `trip:${tripId}` : null, () => doc(db, 'trips', tripId!), toTrip);
}

export function useLegs(tripId: string | null) {
  return useLiveQuery(
    tripId ? `legs:${tripId}` : null,
    () => query(collection(db, 'trips', tripId!, 'legs'), orderBy('order')),
    toLeg,
  );
}

export function useFamilies(tripId: string | null) {
  return useLiveQuery(
    tripId ? `families:${tripId}` : null,
    () => query(collection(db, 'trips', tripId!, 'families'), orderBy('order')),
    toFamily,
  );
}

export function useMembers(tripId: string | null) {
  return useLiveQuery(
    tripId ? `members:${tripId}` : null,
    () => collection(db, 'trips', tripId!, 'members'),
    toMember,
  );
}

/** Invites for a trip. Only organisers may list them, so pass `enabled` accordingly. */
export function useInvites(tripId: string | null, enabled: boolean) {
  return useLiveQuery(
    tripId && enabled ? `invites:${tripId}` : null,
    () => query(collection(db, 'invites'), where('tripId', '==', tripId)),
    toInvite,
  );
}

// ---------- writes ----------

function run(action: string, write: Promise<unknown>) {
  void trackWrite(write).catch((error: unknown) => reportError(writeErrorMessage(action, error)));
}

export interface TripInput {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  expectedKm: number | null;
  kidWeight: number;
  notes: string;
}

/** Create a trip with the user as owner, and make it their active trip. Returns the new id. */
export function createTrip(user: User, input: TripInput): string {
  const tripRef = doc(collection(db, 'trips'));
  const batch = writeBatch(db);
  batch.set(tripRef, {
    ...input,
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    ownerUid: user.uid,
    memberUids: [user.uid],
    organizerUids: [user.uid],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(tripRef, 'members', user.uid), {
    displayName: user.displayName ?? user.email ?? 'Traveller',
    photoURL: user.photoURL ?? null,
    familyId: null,
    role: 'owner',
    joinedAt: serverTimestamp(),
  });
  batch.set(
    doc(db, 'users', user.uid),
    { activeTripId: tripRef.id, updatedAt: serverTimestamp() },
    { merge: true },
  );
  run('create the trip', batch.commit());
  return tripRef.id;
}

/**
 * Save trip details. Active invites get their preview refreshed in the same batch, so the join
 * page never shows an old name or dates.
 */
export function updateTrip(
  tripId: string,
  input: TripInput,
  activeInviteCodes: string[] = [],
  ownerName = '',
) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'trips', tripId), { ...input, updatedAt: serverTimestamp() });
  const preview = invitePreview(input, ownerName);
  for (const code of activeInviteCodes) batch.update(doc(db, 'invites', code), { ...preview });
  run('save the trip', batch.commit());
}

export function setActiveTrip(uid: string, tripId: string) {
  run(
    'switch trips',
    setDoc(
      doc(db, 'users', uid),
      { activeTripId: tripId, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  );
}

export type LegInput = Omit<Leg, 'id' | 'order'>;

export function addLeg(tripId: string, input: LegInput, order: number) {
  const ref = doc(collection(db, 'trips', tripId, 'legs'));
  run(
    'add the leg',
    setDoc(ref, { ...input, order, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
  );
}

export function updateLeg(tripId: string, legId: string, input: LegInput) {
  run(
    'save the leg',
    updateDoc(doc(db, 'trips', tripId, 'legs', legId), { ...input, updatedAt: serverTimestamp() }),
  );
}

export function deleteLeg(tripId: string, legId: string) {
  run('delete the leg', deleteDoc(doc(db, 'trips', tripId, 'legs', legId)));
}

/** Swap two legs' positions. */
export function swapLegs(tripId: string, a: Leg, b: Leg) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'trips', tripId, 'legs', a.id), {
    order: b.order,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'trips', tripId, 'legs', b.id), {
    order: a.order,
    updatedAt: serverTimestamp(),
  });
  run('reorder the legs', batch.commit());
}

export type FamilyInput = Pick<TripFamily, 'name' | 'adults' | 'kids' | 'upiId' | 'color'>;

export function addFamily(tripId: string, uid: string, input: FamilyInput, order: number) {
  const ref = doc(collection(db, 'trips', tripId, 'families'));
  run(
    'add the family',
    setDoc(ref, {
      ...input,
      order,
      active: true,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return ref.id;
}

export function updateFamily(
  tripId: string,
  familyId: string,
  input: Partial<FamilyInput> & { active?: boolean },
) {
  run(
    'save the family',
    updateDoc(doc(db, 'trips', tripId, 'families', familyId), {
      ...input,
      updatedAt: serverTimestamp(),
    }),
  );
}

export function setMemberFamily(tripId: string, uid: string, familyId: string | null) {
  run('set your family', updateDoc(doc(db, 'trips', tripId, 'members', uid), { familyId }));
}

/** Promote to organiser or back to member, keeping the trip's organizerUids in step. */
export function setMemberRole(tripId: string, memberUid: string, role: 'organizer' | 'member') {
  const batch = writeBatch(db);
  batch.update(doc(db, 'trips', tripId, 'members', memberUid), { role });
  batch.update(doc(db, 'trips', tripId), {
    organizerUids: role === 'organizer' ? arrayUnion(memberUid) : arrayRemove(memberUid),
    updatedAt: serverTimestamp(),
  });
  run('change the role', batch.commit());
}

export function createInvite(trip: Trip, uid: string, ownerName: string): string {
  const code = newInviteCode();
  run(
    'create the invite',
    setDoc(doc(db, 'invites', code), {
      tripId: trip.id,
      ...invitePreview(trip, ownerName),
      active: true,
      createdBy: uid,
      createdAt: serverTimestamp(),
    }),
  );
  return code;
}

export function setInviteActive(code: string, active: boolean) {
  run('update the invite', updateDoc(doc(db, 'invites', code), { active }));
}

// ---------- joining (needs a network) ----------

export type InviteLookup =
  { status: 'ok'; invite: Invite } | { status: 'inactive' | 'not-found' | 'offline' };

export async function lookupInvite(code: string): Promise<InviteLookup> {
  try {
    const snap = await getDocFromServer(doc(db, 'invites', code));
    if (!snap.exists()) return { status: 'not-found' };
    const invite = toInvite(snap);
    return invite.active ? { status: 'ok', invite } : { status: 'inactive' };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'unavailable' || !navigator.onLine) return { status: 'offline' };
    if (code === 'permission-denied') return { status: 'not-found' };
    throw error;
  }
}

/** Add the user to the trip through an invite. Awaited: the server checks the invite. */
export async function joinTrip(user: User, invite: Invite): Promise<void> {
  const tripRef = doc(db, 'trips', invite.tripId);
  const batch = writeBatch(db);
  batch.update(tripRef, { memberUids: arrayUnion(user.uid) });
  batch.set(doc(tripRef, 'members', user.uid), {
    displayName: user.displayName ?? user.email ?? 'Traveller',
    photoURL: user.photoURL ?? null,
    familyId: null,
    role: 'member',
    joinedVia: invite.code,
    joinedAt: serverTimestamp(),
  });
  batch.set(
    doc(db, 'users', user.uid),
    { activeTripId: invite.tripId, updatedAt: serverTimestamp() },
    { merge: true },
  );
  await trackWrite(batch.commit());
}

/** Create the user's own family while joining, and put them in it. */
export function createOwnFamily(tripId: string, uid: string, input: FamilyInput, order: number) {
  const familyRef = doc(collection(db, 'trips', tripId, 'families'));
  const batch = writeBatch(db);
  batch.set(familyRef, {
    ...input,
    order,
    active: true,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'trips', tripId, 'members', uid), { familyId: familyRef.id });
  run('create your family', batch.commit());
  return familyRef.id;
}
