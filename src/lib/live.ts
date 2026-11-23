// Live Firestore subscriptions for React, served from the offline cache when there's no network.
// Every subscription reports its pending writes to the sync tracker.

import { useEffect, useRef, useState } from 'react';

/**
 * Listeners can fail transiently: a trip created offline (or a moment ago) doesn't exist on the
 * server yet, so its subcollections are denied until the trip's own write lands. Firestore ends a
 * listener on any error, so re-subscribe with backoff instead of giving up.
 */
export function retryDelay(attempt: number): number {
  return Math.min(30_000, 500 * 2 ** attempt);
}
import {
  onSnapshot,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { reportPending } from './sync';

export interface LiveState<T> {
  data: T;
  loading: boolean;
  /** True when the data came from the device cache, not the server. */
  fromCache: boolean;
  error: Error | null;
}

/**
 * Subscribe to a query. `key` must change whenever the query changes (e.g. its path and filters),
 * and be null to subscribe to nothing.
 */
export function useLiveQuery<T>(
  key: string | null,
  makeQuery: () => Query,
  map: (snap: QueryDocumentSnapshot) => T,
): LiveState<T[]> {
  const [state, setState] = useState<LiveState<T[]> & { key: string | null }>({
    key: null,
    data: [],
    loading: true,
    fromCache: false,
    error: null,
  });

  const [attempt, setAttempt] = useState(0);
  const failures = useRef(0);

  useEffect(() => {
    if (!key) return;
    const source = `query:${key}`;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onSnapshot(
      makeQuery(),
      { includeMetadataChanges: true },
      (snap) => {
        reportPending(source, snap.metadata.hasPendingWrites);
        if (!snap.metadata.fromCache) failures.current = 0;
        setState({
          key,
          data: snap.docs.map(map),
          loading: false,
          fromCache: snap.metadata.fromCache,
          error: null,
        });
      },
      (error) => {
        reportPending(source, false);
        setState((s) => ({ ...s, key, loading: false, error }));
        retry = setTimeout(() => setAttempt((a) => a + 1), retryDelay(failures.current++));
      },
    );
    return () => {
      clearTimeout(retry);
      reportPending(source, false);
      unsubscribe();
    };
    // makeQuery and map are recreated each render; `key` identifies the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  if (!key) return { data: [], loading: false, fromCache: false, error: null };
  if (state.key !== key) return { data: [], loading: true, fromCache: false, error: null };
  return state;
}

/** Subscribe to one document. Resolves to null when it doesn't exist (or isn't readable yet). */
export function useLiveDoc<T>(
  key: string | null,
  makeRef: () => DocumentReference,
  map: (snap: DocumentSnapshot) => T,
): LiveState<T | null> {
  const [state, setState] = useState<LiveState<T | null> & { key: string | null }>({
    key: null,
    data: null,
    loading: true,
    fromCache: false,
    error: null,
  });

  const [attempt, setAttempt] = useState(0);
  const failures = useRef(0);

  useEffect(() => {
    if (!key) return;
    const source = `doc:${key}`;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onSnapshot(
      makeRef(),
      { includeMetadataChanges: true },
      (snap) => {
        reportPending(source, snap.metadata.hasPendingWrites);
        if (!snap.metadata.fromCache) failures.current = 0;
        setState({
          key,
          data: snap.exists() ? map(snap) : null,
          loading: false,
          fromCache: snap.metadata.fromCache,
          error: null,
        });
      },
      (error) => {
        reportPending(source, false);
        setState((s) => ({ ...s, key, loading: false, error }));
        retry = setTimeout(() => setAttempt((a) => a + 1), retryDelay(failures.current++));
      },
    );
    return () => {
      clearTimeout(retry);
      reportPending(source, false);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  if (!key) return { data: null, loading: false, fromCache: false, error: null };
  if (state.key !== key) return { data: null, loading: true, fromCache: false, error: null };
  return state;
}
