import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { trackWrite } from './sync';

export type { User };

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// Errors where a popup can't work in this browser, so a full-page redirect is the fallback.
const POPUP_UNAVAILABLE = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
]);

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';
    if (POPUP_UNAVAILABLE.has(code)) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
}

/** Finish a redirect sign-in, if one was in progress. Safe to call on every start. */
export async function completeRedirectSignIn(): Promise<void> {
  try {
    await getRedirectResult(auth);
  } catch {
    // Offline or nothing pending: onAuthStateChanged still reports the cached user.
  }
}

export function signOutUser() {
  return signOut(auth);
}

/** Create or refresh users/{uid}. Never awaited by the UI: offline it stays queued. */
export function upsertUserProfile(user: User) {
  return trackWrite(
    setDoc(
      doc(db, 'users', user.uid),
      {
        displayName: user.displayName ?? user.email ?? 'Traveller',
        photoURL: user.photoURL ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
  );
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string }).code ?? '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'No internet connection. The first sign-in needs a network; after that the app works offline.';
    case 'auth/unauthorized-domain':
      return 'This address is not allowed to sign in yet. Ask the trip organiser to add it in Firebase.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}
