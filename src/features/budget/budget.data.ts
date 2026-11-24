// Firestore reads and writes for budget lines. Writes are queued offline and never awaited.

import {
  collection,
  deleteDoc,
  deleteField,
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
import { categoryOf } from '../expenses/model';
import type { BudgetLineInput, BudgetSplitMode, TripBudgetLine } from './model';

const MODES: BudgetSplitMode[] = ['equal_family', 'per_head', 'custom', 'personal'];

function toLine(snap: QueryDocumentSnapshot): TripBudgetLine {
  const d = snap.data();
  return {
    id: snap.id,
    title: typeof d.title === 'string' ? d.title : 'Budget',
    category: categoryOf(String(d.category)).value,
    amountPaise: typeof d.amountPaise === 'number' ? d.amountPaise : 0,
    splitMode: MODES.includes(d.splitMode) ? d.splitMode : 'equal_family',
    participants: Array.isArray(d.participants) ? d.participants.map(String) : [],
    customShares:
      d.customShares && typeof d.customShares === 'object'
        ? (d.customShares as Record<string, number>)
        : undefined,
    familyId: typeof d.familyId === 'string' ? d.familyId : undefined,
    order: typeof d.order === 'number' ? d.order : 0,
    createdBy: String(d.createdBy ?? ''),
  };
}

export function useBudget(tripId: string | null) {
  return useLiveQuery(
    tripId ? `budget:${tripId}` : null,
    () => collection(db, 'trips', tripId!, 'budget'),
    toLine,
  );
}

function run(action: string, write: Promise<unknown>) {
  void trackWrite(write).catch((error: unknown) => reportError(writeErrorMessage(action, error)));
}

function clean(input: BudgetLineInput) {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
}

export function addBudgetLine(tripId: string, uid: string, input: BudgetLineInput, order: number) {
  const ref = doc(collection(db, 'trips', tripId, 'budget'));
  run(
    'save the budget line',
    setDoc(ref, {
      ...clean(input),
      order,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return ref.id;
}

export function updateBudgetLine(
  tripId: string,
  lineId: string,
  uid: string,
  input: BudgetLineInput,
) {
  run(
    'save the budget line',
    updateDoc(doc(db, 'trips', tripId, 'budget', lineId), {
      customShares: deleteField(),
      ...clean(input),
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    }),
  );
}

/** Budget lines are a plan, not a record, so they're deleted outright (docs/data-model.md). */
export function deleteBudgetLine(tripId: string, lineId: string) {
  run('delete the budget line', deleteDoc(doc(db, 'trips', tripId, 'budget', lineId)));
}
