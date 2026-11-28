import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { readString, writeString } from '../../lib/storage';
import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from '../trips/ActiveTripProvider';
import { useExpenses } from './expenses.data';
import { latestStamp, unseenExpenses, type UnseenKind } from './unseen';

// The newest expense time this phone has shown, per trip and person. Kept in localStorage (a
// convenience: if it can't be read, nothing shows as new), shared by every component through a
// tiny store so the badge clears the moment the page marks things seen.

const listeners = new Set<() => void>();
const seenKey = (tripId: string, uid: string) => `tbt.seen.expenses.${tripId}.${uid}`;

function readSeen(key: string | null): number | null {
  if (!key) return null;
  const raw = readString(key);
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Only ever moves forward, so an older snapshot can't bring back badges already cleared. */
function writeSeen(key: string, value: number) {
  const current = readSeen(key);
  if (current != null && current >= value) return;
  writeString(key, String(value));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith('tbt.seen.')) listener(); // another tab of the app
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export interface UnseenState {
  unseen: Map<string, UnseenKind>;
  count: number;
  /** What this phone had seen, as a server time (null until the first visit is recorded). */
  seenAt: number | null;
  /** Record that everything currently loaded has been shown. */
  markSeen: () => void;
}

/** New and edited expenses (by someone else) in the active trip since this phone last looked. */
export function useUnseenExpenses(): UnseenState {
  const { user } = useAuth();
  const { trip } = useActiveTrip();
  const expenses = useExpenses(trip?.id ?? null);
  const key = trip && user ? seenKey(trip.id, user.uid) : null;
  const seenAt = useSyncExternalStore(subscribe, () => readSeen(key));

  // First time this phone sees the trip: start from what the server has, so nothing is "new".
  // Wait for server data: an empty cache on a new phone would otherwise make everything new.
  const ready = !expenses.loading && !expenses.error && !expenses.fromCache;
  useEffect(() => {
    if (key && ready && readSeen(key) == null) writeSeen(key, latestStamp(expenses.data));
  }, [key, ready, expenses.data]);

  const unseen = useMemo(
    () => (user ? unseenExpenses(expenses.data, user.uid, seenAt) : new Map<string, UnseenKind>()),
    [expenses.data, user, seenAt],
  );

  const markSeen = useCallback(() => {
    if (key && !expenses.loading) writeSeen(key, latestStamp(expenses.data));
  }, [key, expenses.loading, expenses.data]);

  return { unseen, count: unseen.size, seenAt, markSeen };
}
