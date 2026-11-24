// Firestore reads and writes for settlements. Writes are queued offline and never awaited.

import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useLiveQuery } from '../../lib/live';
import { trackWrite } from '../../lib/sync';
import { reportError, writeErrorMessage } from '../../lib/errors';
import type { SettlementInput, SettlementMethod, TripSettlement } from './model';

const METHODS: SettlementMethod[] = ['upi', 'cash', 'other'];

function toSettlement(snap: QueryDocumentSnapshot): TripSettlement {
  const d = snap.data();
  return {
    id: snap.id,
    fromFamilyId: String(d.fromFamilyId ?? ''),
    toFamilyId: String(d.toFamilyId ?? ''),
    amountPaise: typeof d.amountPaise === 'number' ? d.amountPaise : 0,
    date: String(d.date ?? ''),
    method: METHODS.includes(d.method) ? d.method : 'other',
    note: typeof d.note === 'string' ? d.note : '',
    deleted: d.deleted === true,
    createdBy: String(d.createdBy ?? ''),
    updatedBy: String(d.updatedBy ?? d.createdBy ?? ''),
    pending: snap.metadata.hasPendingWrites,
  };
}

/** All settlements of a trip, including deleted ones (callers filter). */
export function useSettlements(tripId: string | null) {
  return useLiveQuery(
    tripId ? `settlements:${tripId}` : null,
    () => collection(db, 'trips', tripId!, 'settlements'),
    toSettlement,
  );
}

function run(action: string, write: Promise<unknown>) {
  void trackWrite(write).catch((error: unknown) => reportError(writeErrorMessage(action, error)));
}

export function addSettlement(tripId: string, uid: string, input: SettlementInput): string {
  const ref = doc(collection(db, 'trips', tripId, 'settlements'));
  run(
    'record the payment',
    setDoc(ref, {
      ...input,
      deleted: false,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return ref.id;
}

export function setSettlementDeleted(
  tripId: string,
  settlementId: string,
  uid: string,
  deleted: boolean,
) {
  run(
    deleted ? 'delete the payment' : 'restore the payment',
    updateDoc(doc(db, 'trips', tripId, 'settlements', settlementId), {
      deleted,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    }),
  );
}
