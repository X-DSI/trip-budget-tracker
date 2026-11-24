import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

// Cast of characters: olive owns trip t1; mia is a member; sam is a stranger who may join.
const GOOD = 'goodInviteCode_0123456789';
const OFF = 'deadInviteCode_0123456789';
const OTHER = 'otherTripInvite_123456789';

let env: RulesTestEnvironment;

const trip = (over: Record<string, unknown> = {}) => ({
  name: 'Ooty & Coorg',
  destination: 'Ooty, Coorg',
  startDate: '2026-12-04',
  endDate: '2026-12-07',
  timezone: 'Asia/Kolkata',
  expectedKm: 850,
  kidWeight: 0.5,
  currency: 'INR',
  notes: '',
  ...over,
});

const family = (over: Record<string, unknown> = {}) => ({
  name: 'Family',
  adults: 2,
  kids: 0,
  upiId: null,
  color: 'teal',
  order: 0,
  active: true,
  ...over,
});

const leg = (over: Record<string, unknown> = {}) => ({
  mode: 'car',
  from: 'Hosur',
  to: 'Ooty',
  date: '2026-12-04',
  vehicles: 3,
  km: 300,
  notes: '',
  order: 0,
  ...over,
});

const as = (uid: string): Firestore =>
  env.authenticatedContext(uid).firestore() as unknown as Firestore;

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
    await setDoc(
      doc(db, 'trips/t1'),
      trip({ ownerUid: 'olive', memberUids: ['olive', 'mia'], organizerUids: ['olive'] }),
    );
    await setDoc(
      doc(db, 'trips/t2'),
      trip({ name: 'Other', ownerUid: 'zed', memberUids: ['zed'], organizerUids: ['zed'] }),
    );
    await setDoc(doc(db, 'trips/t1/members/olive'), {
      displayName: 'Olive',
      role: 'owner',
      familyId: 'f1',
    });
    await setDoc(doc(db, 'trips/t1/members/mia'), {
      displayName: 'Mia',
      role: 'member',
      familyId: null,
    });
    await setDoc(doc(db, 'trips/t1/families/f1'), family({ name: 'Olive & co' }));
    await setDoc(doc(db, 'trips/t1/legs/l1'), leg());
    await setDoc(doc(db, `invites/${GOOD}`), { tripId: 't1', active: true, createdBy: 'olive' });
    await setDoc(doc(db, `invites/${OFF}`), { tripId: 't1', active: false, createdBy: 'olive' });
    await setDoc(doc(db, `invites/${OTHER}`), { tripId: 't2', active: true, createdBy: 'zed' });
  });
});

function joinBatch(db: Firestore, uid: string, code: string | undefined, tripId = 't1') {
  const batch = writeBatch(db);
  batch.update(doc(db, 'trips', tripId), { memberUids: arrayUnion(uid) });
  batch.set(doc(db, 'trips', tripId, 'members', uid), {
    displayName: uid,
    photoURL: null,
    familyId: null,
    role: 'member',
    ...(code ? { joinedVia: code } : {}),
    joinedAt: serverTimestamp(),
  });
  return batch;
}

describe('reading a trip', () => {
  it('lets members read the trip and everything under it', async () => {
    const db = as('mia');
    await assertSucceeds(getDoc(doc(db, 'trips/t1')));
    await assertSucceeds(getDocs(collection(db, 'trips/t1/legs')));
    await assertSucceeds(getDocs(collection(db, 'trips/t1/families')));
    await assertSucceeds(getDocs(collection(db, 'trips/t1/members')));
    await assertSucceeds(
      getDocs(query(collection(db, 'trips'), where('memberUids', 'array-contains', 'mia'))),
    );
  });

  it('keeps non-members and signed-out visitors out', async () => {
    const db = as('sam');
    await assertFails(getDoc(doc(db, 'trips/t1')));
    await assertFails(getDocs(collection(db, 'trips/t1/legs')));
    await assertFails(getDocs(collection(db, 'trips/t1/families')));
    await assertFails(getDocs(collection(db, 'trips/t1/members')));
    await assertFails(getDocs(collection(db, 'trips')));
    await assertFails(
      getDoc(doc(env.unauthenticatedContext().firestore() as unknown as Firestore, 'trips/t1')),
    );
  });
});

describe('creating a trip', () => {
  it('lets anyone create a trip they own, with their owner membership', async () => {
    const db = as('sam');
    const batch = writeBatch(db);
    batch.set(
      doc(db, 'trips/t9'),
      trip({
        ownerUid: 'sam',
        memberUids: ['sam'],
        organizerUids: ['sam'],
        createdAt: serverTimestamp(),
      }),
    );
    batch.set(doc(db, 'trips/t9/members/sam'), {
      displayName: 'Sam',
      photoURL: null,
      familyId: null,
      role: 'owner',
      joinedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it('rejects trips that add other people or have bad dates', async () => {
    const db = as('sam');
    await assertFails(
      setDoc(
        doc(db, 'trips/t8'),
        trip({ ownerUid: 'sam', memberUids: ['sam', 'mia'], organizerUids: ['sam'] }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db, 'trips/t8'),
        trip({ ownerUid: 'mia', memberUids: ['mia'], organizerUids: ['mia'] }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db, 'trips/t8'),
        trip({
          ownerUid: 'sam',
          memberUids: ['sam'],
          organizerUids: ['sam'],
          endDate: '2026-12-01',
        }),
      ),
    );
  });

  it('does not let someone claim ownership of an existing trip', async () => {
    const db = as('sam');
    await assertFails(
      setDoc(doc(db, 'trips/t1/members/sam'), {
        displayName: 'Sam',
        role: 'owner',
        familyId: null,
      }),
    );
  });
});

describe('editing a trip', () => {
  it('lets organisers edit details, legs and families', async () => {
    const db = as('olive');
    await assertSucceeds(updateDoc(doc(db, 'trips/t1'), { name: 'Coorg only', expectedKm: 600 }));
    await assertSucceeds(setDoc(doc(db, 'trips/t1/legs/l2'), leg({ mode: 'train', order: 1 })));
    await assertSucceeds(updateDoc(doc(db, 'trips/t1/legs/l1'), { vehicles: 4 }));
    await assertSucceeds(
      setDoc(doc(db, 'trips/t1/families/f2'), family({ name: 'Mia & co', order: 1 })),
    );
    await assertSucceeds(updateDoc(doc(db, 'trips/t1/families/f1'), { active: false }));
  });

  it('stops members from editing details, legs, families or roles', async () => {
    const db = as('mia');
    await assertFails(updateDoc(doc(db, 'trips/t1'), { name: 'Mine now' }));
    await assertFails(updateDoc(doc(db, 'trips/t1'), { organizerUids: ['olive', 'mia'] }));
    await assertFails(setDoc(doc(db, 'trips/t1/legs/l2'), leg()));
    await assertFails(updateDoc(doc(db, 'trips/t1/legs/l1'), { vehicles: 9 }));
    await assertFails(updateDoc(doc(db, 'trips/t1/families/f1'), { adults: 9 }));
    await assertFails(updateDoc(doc(db, 'trips/t1/members/olive'), { role: 'member' }));
  });

  it('rejects invalid legs and families even from organisers', async () => {
    const db = as('olive');
    await assertFails(setDoc(doc(db, 'trips/t1/legs/l3'), leg({ mode: 'rocket' })));
    await assertFails(setDoc(doc(db, 'trips/t1/legs/l3'), leg({ vehicles: 0 })));
    await assertFails(setDoc(doc(db, 'trips/t1/families/f3'), family({ adults: 0 })));
    await assertFails(updateDoc(doc(db, 'trips/t1'), { endDate: '2026-12-01' }));
  });

  it('never lets organisers change membership or ownership directly', async () => {
    const db = as('olive');
    await assertFails(updateDoc(doc(db, 'trips/t1'), { memberUids: ['olive'] }));
    await assertFails(updateDoc(doc(db, 'trips/t1'), { ownerUid: 'mia' }));
  });
});

describe('roles', () => {
  it('lets an organiser promote a member, keeping organizerUids in step', async () => {
    const db = as('olive');
    const batch = writeBatch(db);
    batch.update(doc(db, 'trips/t1/members/mia'), { role: 'organizer' });
    batch.update(doc(db, 'trips/t1'), { organizerUids: arrayUnion('mia') });
    await assertSucceeds(batch.commit());
  });

  it('rejects a role change that leaves organizerUids out of step', async () => {
    const db = as('olive');
    await assertFails(updateDoc(doc(db, 'trips/t1/members/mia'), { role: 'organizer' }));
  });

  it('never lets anyone change their own role', async () => {
    await assertFails(updateDoc(doc(as('mia'), 'trips/t1/members/mia'), { role: 'organizer' }));
    await assertFails(updateDoc(doc(as('olive'), 'trips/t1/members/olive'), { role: 'member' }));
  });
});

describe('members choosing a family', () => {
  it('lets members pick an existing family for themselves', async () => {
    const db = as('mia');
    await assertSucceeds(updateDoc(doc(db, 'trips/t1/members/mia'), { familyId: 'f1' }));
    await assertFails(updateDoc(doc(db, 'trips/t1/members/mia'), { familyId: 'nope' }));
    await assertFails(updateDoc(doc(db, 'trips/t1/members/olive'), { familyId: null }));
  });

  it('lets a member add their own family and join it in one go', async () => {
    const db = as('mia');
    const batch = writeBatch(db);
    batch.set(
      doc(db, 'trips/t1/families/fm'),
      family({ name: 'Mia & co', order: 1, createdBy: 'mia' }),
    );
    batch.update(doc(db, 'trips/t1/members/mia'), { familyId: 'fm' });
    await assertSucceeds(batch.commit());
  });
});

describe('invites', () => {
  it('lets anyone signed in look up an invite by its code', async () => {
    await assertSucceeds(getDoc(doc(as('sam'), `invites/${GOOD}`)));
    await assertFails(
      getDoc(
        doc(env.unauthenticatedContext().firestore() as unknown as Firestore, `invites/${GOOD}`),
      ),
    );
  });

  it("lists invites only for the trip's organisers", async () => {
    await assertSucceeds(
      getDocs(query(collection(as('olive'), 'invites'), where('tripId', '==', 't1'))),
    );
    await assertFails(
      getDocs(query(collection(as('mia'), 'invites'), where('tripId', '==', 't1'))),
    );
    await assertFails(getDocs(collection(as('sam'), 'invites')));
  });

  const preview = {
    tripName: 'Ooty & Coorg',
    tripStartDate: '2026-12-04',
    tripEndDate: '2026-12-07',
    tripDestination: 'Ooty, Coorg',
    ownerName: 'Olive',
  };

  it('lets organisers create invites with a true preview, and turn them off', async () => {
    const db = as('olive');
    const code = 'freshInviteCode_12345678';
    await assertSucceeds(
      setDoc(doc(db, `invites/${code}`), {
        tripId: 't1',
        active: true,
        createdBy: 'olive',
        createdAt: serverTimestamp(),
        ...preview,
      }),
    );
    await assertSucceeds(updateDoc(doc(db, `invites/${code}`), { active: false }));
    await assertFails(updateDoc(doc(db, `invites/${code}`), { tripId: 't2' }));
    await assertFails(
      setDoc(doc(db, 'invites/short'), {
        tripId: 't1',
        active: true,
        createdBy: 'olive',
        ...preview,
      }),
    );
    await assertFails(
      setDoc(doc(as('mia'), 'invites/miasInviteCode_123456789'), {
        tripId: 't1',
        active: true,
        createdBy: 'mia',
        ...preview,
      }),
    );
  });

  it('rejects invites with a missing or forged preview', async () => {
    const db = as('olive');
    const base = { tripId: 't1', active: true, createdBy: 'olive' };
    await assertFails(setDoc(doc(db, 'invites/noPreviewInvite_1234567'), base));
    await assertFails(
      setDoc(doc(db, 'invites/forgedNameInvite_123456'), { ...base, ...preview, tripName: 'Goa!' }),
    );
    await assertFails(
      setDoc(doc(db, 'invites/forgedOwnerInvite_12345'), { ...base, ...preview, ownerName: 'Mia' }),
    );
  });

  it('refreshes the preview together with a trip edit, and only then', async () => {
    const db = as('olive');
    const ok = writeBatch(db);
    ok.update(doc(db, 'trips/t1'), { name: 'Coorg only' });
    ok.update(doc(db, `invites/${GOOD}`), { ...preview, tripName: 'Coorg only' });
    await assertSucceeds(ok.commit());

    await assertFails(updateDoc(doc(db, `invites/${GOOD}`), { tripName: 'Somewhere else' }));
    // Older invites without a preview can still be turned off.
    await assertSucceeds(updateDoc(doc(db, `invites/${OFF}`), { active: true }));
  });
});

describe('joining', () => {
  it('lets someone with an active invite join', async () => {
    await assertSucceeds(joinBatch(as('sam'), 'sam', GOOD).commit());
    await assertSucceeds(getDoc(doc(as('sam'), 'trips/t1')));
  });

  it('refuses joining without an invite, with a dead one, or with another trip’s', async () => {
    await assertFails(joinBatch(as('sam'), 'sam', undefined).commit());
    await assertFails(joinBatch(as('sam'), 'sam', OFF).commit());
    await assertFails(joinBatch(as('sam'), 'sam', OTHER).commit());
    await assertFails(joinBatch(as('sam'), 'sam', 'madeUpInviteCode_1234567').commit());
  });

  it('refuses joining as an organiser or adding someone else', async () => {
    const db = as('sam');
    const batch = writeBatch(db);
    batch.update(doc(db, 'trips/t1'), { memberUids: arrayUnion('sam') });
    batch.set(doc(db, 'trips/t1/members/sam'), {
      displayName: 'Sam',
      role: 'organizer',
      familyId: null,
      joinedVia: GOOD,
    });
    await assertFails(batch.commit());

    await assertFails(joinBatch(as('sam'), 'kim', GOOD).commit());
  });

  it('refuses half a join (membership without the member document)', async () => {
    await assertFails(updateDoc(doc(as('sam'), 'trips/t1'), { memberUids: arrayUnion('sam') }));
  });
});
