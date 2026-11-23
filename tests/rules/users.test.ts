import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

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
    await setDoc(doc(ctx.firestore(), 'users/bob'), { displayName: 'Bob', photoURL: null });
  });
});

describe('users/{uid}', () => {
  it('lets a user create, read and update their own profile', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(db, 'users/alice'), { displayName: 'Alice', photoURL: null }));
    await assertSucceeds(getDoc(doc(db, 'users/alice')));
    await assertSucceeds(
      setDoc(doc(db, 'users/alice'), { activeTripId: 'trip1' }, { merge: true }),
    );
  });

  it("denies reading or writing another user's profile", async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(db, 'users/bob')));
    await assertFails(setDoc(doc(db, 'users/bob'), { displayName: 'Hacked' }, { merge: true }));
  });

  it('denies signed-out access', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/bob')));
  });

  it('rejects unknown fields and deletes', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(db, 'users/alice'), { displayName: 'A', role: 'admin' }));
    await assertSucceeds(setDoc(doc(db, 'users/alice'), { displayName: 'A' }));
    await assertFails(deleteDoc(doc(db, 'users/alice')));
  });

  it('keeps everything else closed for now', async () => {
    const db = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(db, 'trips/any')));
    await assertFails(setDoc(doc(db, 'trips/any'), { name: 'x' }));
  });
});
