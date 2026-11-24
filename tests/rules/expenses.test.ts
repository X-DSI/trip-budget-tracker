import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

// olive organises trip t1; mia and max are members; sam is not on the trip.
let env: RulesTestEnvironment;
const as = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;

const expense = (uid: string, over: Record<string, unknown> = {}) => ({
  title: 'Dinner',
  category: 'food',
  amountPaise: 400000,
  paidByFamilyId: 'fa',
  date: '2026-12-05',
  splitMode: 'per_head',
  participants: [],
  note: '',
  deleted: false,
  createdBy: uid,
  updatedBy: uid,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...over,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-trip-budget',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'trips/t1'), {
      name: 'Trip',
      startDate: '2026-12-04',
      endDate: '2026-12-07',
      ownerUid: 'olive',
      memberUids: ['olive', 'mia', 'max'],
      organizerUids: ['olive'],
    });
    await setDoc(doc(db, 'trips/t1/families/fa'), {
      name: 'A',
      adults: 2,
      kids: 0,
      order: 0,
      active: true,
    });
    await setDoc(doc(db, 'trips/t1/expenses/byMia'), expense('mia'));
  });
});

describe('expenses', () => {
  it('lets members read and add expenses as themselves', async () => {
    await assertSucceeds(getDocs(collection(as('max'), 'trips/t1/expenses')));
    await assertSucceeds(setDoc(doc(as('max'), 'trips/t1/expenses/e2'), expense('max')));
  });

  it('keeps non-members out', async () => {
    await assertFails(getDocs(collection(as('sam'), 'trips/t1/expenses')));
    await assertFails(setDoc(doc(as('sam'), 'trips/t1/expenses/e2'), expense('sam')));
  });

  it('rejects adding as someone else, or already deleted', async () => {
    await assertFails(setDoc(doc(as('max'), 'trips/t1/expenses/e2'), expense('mia')));
    await assertFails(
      setDoc(doc(as('max'), 'trips/t1/expenses/e2'), expense('max', { updatedBy: 'mia' })),
    );
    await assertFails(
      setDoc(doc(as('max'), 'trips/t1/expenses/e2'), expense('max', { deleted: true })),
    );
  });

  it('rejects bad amounts, modes, categories, dates and unknown payers', async () => {
    const db = as('max');
    const bad = [
      { amountPaise: 0 },
      { amountPaise: 12.5 },
      { amountPaise: 2_000_000_000 },
      { splitMode: 'whatever' },
      { category: 'bribes' },
      { date: '5 Dec' },
      { paidByFamilyId: 'nope' },
      { title: '' },
      { surprise: true },
    ];
    for (const over of bad) {
      await assertFails(setDoc(doc(db, 'trips/t1/expenses/bad'), expense('max', over)));
    }
  });

  it('lets the creator edit and soft-delete their own expense', async () => {
    const db = as('mia');
    await assertSucceeds(
      updateDoc(doc(db, 'trips/t1/expenses/byMia'), { amountPaise: 450000, updatedBy: 'mia' }),
    );
    await assertSucceeds(
      updateDoc(doc(db, 'trips/t1/expenses/byMia'), { deleted: true, updatedBy: 'mia' }),
    );
  });

  it("stops other members from editing someone else's expense", async () => {
    await assertFails(
      updateDoc(doc(as('max'), 'trips/t1/expenses/byMia'), { amountPaise: 1, updatedBy: 'max' }),
    );
    await assertFails(
      updateDoc(doc(as('max'), 'trips/t1/expenses/byMia'), { deleted: true, updatedBy: 'max' }),
    );
  });

  it("lets organisers edit anyone's expense, but never its creator", async () => {
    const db = as('olive');
    await assertSucceeds(
      updateDoc(doc(db, 'trips/t1/expenses/byMia'), { amountPaise: 390000, updatedBy: 'olive' }),
    );
    await assertFails(
      updateDoc(doc(db, 'trips/t1/expenses/byMia'), { createdBy: 'olive', updatedBy: 'olive' }),
    );
  });

  it('never allows hard deletes', async () => {
    await assertFails(deleteDoc(doc(as('mia'), 'trips/t1/expenses/byMia')));
    await assertFails(deleteDoc(doc(as('olive'), 'trips/t1/expenses/byMia')));
  });
});
