// Tracks what hasn't reached the server yet, so the UI can show a "pending sync" badge.
//
// Two sources feed it:
// - writes made in this session (`trackWrite`): Firestore resolves a write's promise only when
//   the server acknowledges it, so an unresolved promise means "queued";
// - live listeners (`reportPending`), whose snapshot metadata says `hasPendingWrites`. This also
//   catches writes queued in an earlier session that are still in the offline cache.

type Listener = () => void;

let inFlightWrites = 0;
const pendingSources = new Set<string>();
const listeners = new Set<Listener>();
let snapshot = 0;

function emit() {
  snapshot = inFlightWrites + pendingSources.size;
  listeners.forEach((l) => l());
}

export function trackWrite<T>(write: Promise<T>): Promise<T> {
  inFlightWrites += 1;
  emit();
  return write.finally(() => {
    inFlightWrites -= 1;
    emit();
  });
}

export function reportPending(source: string, pending: boolean) {
  const had = pendingSources.has(source);
  if (pending === had) return;
  if (pending) pendingSources.add(source);
  else pendingSources.delete(source);
  emit();
}

export function subscribePending(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPendingCount() {
  return snapshot;
}

/** Test helper: forget all state. */
export function resetSyncState() {
  inFlightWrites = 0;
  pendingSources.clear();
  emit();
}
