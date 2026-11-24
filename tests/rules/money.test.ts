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

// Budget lines and settlements (docs/adr/2026-11-24-who-can-change-money.md).
// olive organises trip t1 and is in family fa; mia is in fa; max is in fb; nia is in fc;
// noa is a member who hasn't picked a family; sam is not on the trip.
let env: RulesTestEnvironment;
const as = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;

const line = (uid: string, over: Record<string, unknown> = {}) => ({
  category: 'stay',
  title: 'Hotels',
  amountPaise: 3_600_000,
  splitMode: 'per_head',
  participants: [],
  familyId: null,
  order: 0,
  createdBy: uid,
  updatedBy: uid,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...over,
});

const settlement = (uid: string, over: Record<string, unknown> = {}) => ({
  fromFamilyId: 'fb',
  toFamilyId: 'fa',
  amountPaise: 150_000,
  date: '2026-12-07',
  method: 'upi',
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
      memberUids: ['olive', 'mia', 'max', 'nia', 'noa'],
      organizerUids: ['olive'],
    });
    for (const [id, order] of [
      ['fa', 0],
      ['fb', 1],
      ['fc', 2],
    ] as const) {
      await setDoc(doc(db, `trips/t1/families/${id}`), {
        name: id,
        adults: 2,
        kids: 0,
        order,
        active: true,
      });
    }
    const member = (familyId: string | null, role = 'member') => ({
      displayName: 'x',
      familyId,
      role,
    });
    await setDoc(doc(db, 'trips/t1/members/olive'), member('fa', 'owner'));
    await setDoc(doc(db, 'trips/t1/members/mia'), member('fa'));
    await setDoc(doc(db, 'trips/t1/members/max'), member('fb'));
    await setDoc(doc(db, 'trips/t1/members/nia'), member('fc'));
    await setDoc(doc(db, 'trips/t1/members/noa'), member(null));
    await setDoc(doc(db, 'trips/t1/budget/l1'), line('olive'));
    await setDoc(doc(db, 'trips/t1/settlements/byMax'), settlement('max'));
  });
});

describe('budget', () => {
  it('lets every member read the budget, and keeps non-members out', async () => {
    await assertSucceeds(getDocs(collection(as('max'), 'trips/t1/budget')));
    await assertFails(getDocs(collection(as('sam'), 'trips/t1/budget')));
  });

  it('lets only organisers add, edit and delete budget lines', async () => {
    const olive = as('olive');
    await assertSucceeds(setDoc(doc(olive, 'trips/t1/budget/l2'), line('olive')));
    await assertSucceeds(
      updateDoc(doc(olive, 'trips/t1/budget/l1'), { amountPaise: 4_000_000, updatedBy: 'olive' }),
    );
    await assertSucceeds(deleteDoc(doc(olive, 'trips/t1/budget/l2')));

    const max = as('max');
    await assertFails(setDoc(doc(max, 'trips/t1/budget/l3'), line('max')));
    await assertFails(
      updateDoc(doc(max, 'trips/t1/budget/l1'), { amountPaise: 1, updatedBy: 'max' }),
    );
    await assertFails(deleteDoc(doc(max, 'trips/t1/budget/l1')));
    await assertFails(setDoc(doc(as('sam'), 'trips/t1/budget/l3'), line('sam')));
  });

  it('rejects bad lines', async () => {
    const db = as('olive');
    const bad = [
      { amountPaise: 0 },
      { amountPaise: 10.5 },
      { splitMode: 'itemized' },
      { category: 'bribes' },
      { title: '' },
      { splitMode: 'personal', familyId: null },
      { splitMode: 'personal', familyId: 'nope' },
      { order: 'first' },
      { updatedBy: 'mia' },
      { createdBy: 'mia' },
      { surprise: true },
    ];
    for (const over of bad) {
      await assertFails(setDoc(doc(db, 'trips/t1/budget/bad'), line('olive', over)));
    }
    await assertSucceeds(
      setDoc(
        doc(db, 'trips/t1/budget/ok'),
        line('olive', { splitMode: 'personal', familyId: 'fb' }),
      ),
    );
  });

  it("never changes a line's creator", async () => {
    await assertFails(
      updateDoc(doc(as('olive'), 'trips/t1/budget/l1'), { createdBy: 'mia', updatedBy: 'olive' }),
    );
  });
});

describe('settlements', () => {
  it('lets members read settlements, and keeps non-members out', async () => {
    await assertSucceeds(getDocs(collection(as('nia'), 'trips/t1/settlements')));
    await assertFails(getDocs(collection(as('sam'), 'trips/t1/settlements')));
  });

  it('lets an adult of the paying or the receiving family record a payment', async () => {
    // max is in fb (payer); mia is in fa (receiver).
    await assertSucceeds(setDoc(doc(as('max'), 'trips/t1/settlements/s1'), settlement('max')));
    await assertSucceeds(setDoc(doc(as('mia'), 'trips/t1/settlements/s2'), settlement('mia')));
  });

  it('stops anyone else recording it, even an organiser of another family', async () => {
    // nia is in fc, noa has no family, sam isn't on the trip, olive organises but is in fa.
    await assertFails(setDoc(doc(as('nia'), 'trips/t1/settlements/s1'), settlement('nia')));
    await assertFails(setDoc(doc(as('noa'), 'trips/t1/settlements/s1'), settlement('noa')));
    await assertFails(setDoc(doc(as('sam'), 'trips/t1/settlements/s1'), settlement('sam')));
    await assertFails(
      setDoc(
        doc(as('olive'), 'trips/t1/settlements/s1'),
        settlement('olive', { fromFamilyId: 'fb', toFamilyId: 'fc' }),
      ),
    );
  });

  it('rejects recording as someone else, or bad payments', async () => {
    const db = as('max');
    const bad = [
      { createdBy: 'mia' },
      { updatedBy: 'mia' },
      { deleted: true },
      { amountPaise: 0 },
      { amountPaise: 99.5 },
      { fromFamilyId: 'fb', toFamilyId: 'fb' },
      { toFamilyId: 'nope' },
      { method: 'cheque' },
      { date: 'tomorrow' },
      { note: 'x'.repeat(201) },
      { surprise: true },
    ];
    for (const over of bad) {
      await assertFails(setDoc(doc(db, 'trips/t1/settlements/bad'), settlement('max', over)));
    }
  });

  it('lets the recorder or an organiser soft-delete it, and nobody else', async () => {
    await assertFails(
      updateDoc(doc(as('mia'), 'trips/t1/settlements/byMax'), {
        deleted: true,
        updatedBy: 'mia',
      }),
    );
    await assertSucceeds(
      updateDoc(doc(as('max'), 'trips/t1/settlements/byMax'), {
        deleted: true,
        updatedBy: 'max',
      }),
    );
    await assertSucceeds(
      updateDoc(doc(as('olive'), 'trips/t1/settlements/byMax'), {
        deleted: false,
        updatedBy: 'olive',
      }),
    );
  });

  it('never edits a recorded payment, and never hard-deletes one', async () => {
    await assertFails(
      updateDoc(doc(as('max'), 'trips/t1/settlements/byMax'), {
        amountPaise: 1,
        updatedBy: 'max',
      }),
    );
    await assertFails(
      updateDoc(doc(as('olive'), 'trips/t1/settlements/byMax'), {
        toFamilyId: 'fc',
        updatedBy: 'olive',
      }),
    );
    await assertFails(deleteDoc(doc(as('max'), 'trips/t1/settlements/byMax')));
    await assertFails(deleteDoc(doc(as('olive'), 'trips/t1/settlements/byMax')));
  });
});
