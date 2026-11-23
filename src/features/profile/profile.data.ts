import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { reportPending } from '../../lib/sync';

export interface UserProfile {
  displayName: string;
  photoURL: string | null;
  activeTripId: string | null;
}

/** Live users/{uid}, served from the offline cache when there is no network. */
export function useUserProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!uid) return;
    const source = `users/${uid}`;
    const unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      { includeMetadataChanges: true },
      (snap) => {
        reportPending(source, snap.metadata.hasPendingWrites);
        const data = snap.data();
        setProfile(
          data
            ? {
                displayName: String(data.displayName ?? ''),
                photoURL: (data.photoURL as string | null) ?? null,
                activeTripId: (data.activeTripId as string | null) ?? null,
              }
            : null,
        );
      },
      () => reportPending(source, false),
    );
    return () => {
      reportPending(source, false);
      unsubscribe();
    };
  }, [uid]);

  return uid ? profile : null;
}
