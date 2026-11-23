import { useSyncExternalStore } from 'react';
import { getPendingCount, subscribePending } from '../lib/sync';

/** Number of writes and live documents still waiting to reach the server. */
export function usePendingWrites(): number {
  return useSyncExternalStore(subscribePending, getPendingCount, getPendingCount);
}
