import {
  collection,
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
import type { SplitMode } from '../../domain';
import { categoryOf, type ExpenseInput, type TripExpense } from './model';

const MODES: SplitMode[] = ['equal_family', 'per_head', 'itemized', 'custom', 'personal'];

function toExpense(snap: QueryDocumentSnapshot): TripExpense {
  const d = snap.data({ serverTimestamps: 'estimate' });
  const items = Array.isArray(d.items)
    ? (d.items as unknown[]).flatMap((raw) => {
        const i = raw as { name?: unknown; amountPaise?: unknown; familyId?: unknown };
        return typeof i.amountPaise === 'number' && typeof i.familyId === 'string'
          ? [{ name: String(i.name ?? 'Item'), amountPaise: i.amountPaise, familyId: i.familyId }]
          : [];
      })
    : undefined;
  return {
    id: snap.id,
    title: typeof d.title === 'string' ? d.title : 'Expense',
    category: categoryOf(String(d.category)).value,
    amountPaise: typeof d.amountPaise === 'number' ? d.amountPaise : 0,
    paidByFamilyId: String(d.paidByFamilyId ?? ''),
    date: String(d.date ?? ''),
    splitMode: MODES.includes(d.splitMode) ? d.splitMode : 'equal_family',
    participants: Array.isArray(d.participants) ? d.participants.map(String) : [],
    items,
    extrasPaise: typeof d.extrasPaise === 'number' ? d.extrasPaise : undefined,
    customShares:
      d.customShares && typeof d.customShares === 'object'
        ? (d.customShares as Record<string, number>)
        : undefined,
    note: typeof d.note === 'string' ? d.note : '',
    deleted: d.deleted === true,
    createdBy: String(d.createdBy ?? ''),
    updatedBy: String(d.updatedBy ?? d.createdBy ?? ''),
    pending: snap.metadata.hasPendingWrites,
    createdAtMs:
      d.createdAt && typeof d.createdAt.toMillis === 'function'
        ? d.createdAt.toMillis()
        : undefined,
    updatedAtMs:
      d.updatedAt && typeof d.updatedAt.toMillis === 'function'
        ? d.updatedAt.toMillis()
        : undefined,
  };
}

/** All expenses of a trip, including deleted ones (callers filter). */
export function useExpenses(tripId: string | null) {
  return useLiveQuery(
    tripId ? `expenses:${tripId}` : null,
    () => collection(db, 'trips', tripId!, 'expenses'),
    toExpense,
  );
}

function run(action: string, write: Promise<unknown>) {
  void trackWrite(write).catch((error: unknown) => reportError(writeErrorMessage(action, error)));
}

/** Firestore rejects `undefined`; drop optional fields that aren't set. */
function clean(input: ExpenseInput) {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
}

export function addExpense(tripId: string, uid: string, input: ExpenseInput): string {
  const ref = doc(collection(db, 'trips', tripId, 'expenses'));
  run(
    'save the expense',
    setDoc(ref, {
      ...clean(input),
      deleted: false,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return ref.id;
}

/** Replace an expense's content. Fields from the old split mode are cleared. */
export function updateExpense(tripId: string, expenseId: string, uid: string, input: ExpenseInput) {
  run(
    'save the expense',
    updateDoc(doc(db, 'trips', tripId, 'expenses', expenseId), {
      items: deleteField(),
      extrasPaise: deleteField(),
      customShares: deleteField(),
      ...clean(input),
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    }),
  );
}

export function setExpenseDeleted(
  tripId: string,
  expenseId: string,
  uid: string,
  deleted: boolean,
) {
  run(
    deleted ? 'delete the expense' : 'restore the expense',
    updateDoc(doc(db, 'trips', tripId, 'expenses', expenseId), {
      deleted,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    }),
  );
}
