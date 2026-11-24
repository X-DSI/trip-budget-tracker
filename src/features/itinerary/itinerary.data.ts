import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useLiveQuery } from '../../lib/live';
import { trackWrite } from '../../lib/sync';
import { reportError, writeErrorMessage } from '../../lib/errors';
import { KINDS, TRAVEL_MODES, type ItemInput, type ItineraryItem } from './model';

function toItem(snap: QueryDocumentSnapshot): ItineraryItem {
  const d = snap.data();
  const kind = KINDS.some((k) => k.value === d.kind) ? d.kind : 'other';
  const mode = TRAVEL_MODES.some((m) => m.value === d.mode) ? d.mode : null;
  return {
    id: snap.id,
    day: typeof d.day === 'string' ? d.day : '',
    time: typeof d.time === 'string' && d.time ? d.time : null,
    kind,
    title: typeof d.title === 'string' ? d.title : 'Plan',
    place: typeof d.place === 'string' ? d.place : '',
    notes: typeof d.notes === 'string' ? d.notes : '',
    mode,
    vehicles: typeof d.vehicles === 'number' ? d.vehicles : null,
    km: typeof d.km === 'number' ? d.km : null,
    order: typeof d.order === 'number' ? d.order : 0,
  };
}

export function useItinerary(tripId: string | null) {
  return useLiveQuery(
    tripId ? `itinerary:${tripId}` : null,
    () => collection(db, 'trips', tripId!, 'itinerary'),
    toItem,
  );
}

function run(action: string, write: Promise<unknown>) {
  void trackWrite(write).catch((error: unknown) => reportError(writeErrorMessage(action, error)));
}

export function addItem(tripId: string, input: ItemInput, order: number) {
  const ref = doc(collection(db, 'trips', tripId, 'itinerary'));
  run(
    'add to the itinerary',
    setDoc(ref, { ...input, order, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
  );
}

export function updateItem(tripId: string, itemId: string, input: ItemInput) {
  run(
    'save the plan',
    updateDoc(doc(db, 'trips', tripId, 'itinerary', itemId), {
      ...input,
      updatedAt: serverTimestamp(),
    }),
  );
}

export function deleteItem(tripId: string, itemId: string) {
  run('delete the plan', deleteDoc(doc(db, 'trips', tripId, 'itinerary', itemId)));
}

/** Swap two items' order (used for items on the same day). */
export function swapItems(tripId: string, a: ItineraryItem, b: ItineraryItem) {
  const batch = writeBatch(db);
  const [orderA, orderB] = a.order === b.order ? [b.order + 1, a.order] : [b.order, a.order];
  batch.update(doc(db, 'trips', tripId, 'itinerary', a.id), {
    order: orderA,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'trips', tripId, 'itinerary', b.id), {
    order: orderB,
    updatedAt: serverTimestamp(),
  });
  run('reorder the plan', batch.commit());
}
