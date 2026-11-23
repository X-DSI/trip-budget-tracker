import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  signInWithCredential,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const usingEmulators = env.VITE_USE_EMULATORS === 'true';

export const app = initializeApp(firebaseConfig);

// IndexedDB persistence keeps people signed in with no network, which the trip depends on.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});

// Persistent cache: data and queued writes survive app restarts; several tabs share it.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (usingEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);

  // Test-only sign-in for Playwright. The auth emulator accepts unsigned Google ID tokens, so
  // this never exists in a build that talks to the real project.
  (window as unknown as { __e2eSignIn?: unknown }).__e2eSignIn = (
    uid: string,
    name: string,
    email: string,
  ) =>
    signInWithCredential(
      auth,
      GoogleAuthProvider.credential(
        JSON.stringify({ sub: uid, email, email_verified: true, name }),
      ),
    ).then(() => undefined);
}
