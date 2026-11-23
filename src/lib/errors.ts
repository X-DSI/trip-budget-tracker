// A tiny store for background write failures. Writes are never awaited by the UI (they may sit
// in the offline queue for hours), so when the server finally rejects one, this is how the person
// hears about it.

type Listener = () => void;

export interface AppError {
  id: number;
  message: string;
}

let errors: AppError[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function reportError(message: string) {
  errors = [...errors.slice(-2), { id: nextId++, message }];
  emit();
}

export function dismissError(id: number) {
  errors = errors.filter((e) => e.id !== id);
  emit();
}

export function subscribeErrors(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getErrors() {
  return errors;
}

/** Friendly text for a failed write. */
export function writeErrorMessage(action: string, error: unknown): string {
  const code = (error as { code?: string }).code ?? '';
  if (code === 'permission-denied') {
    return `Couldn't ${action}: you don't have permission. Ask the trip organiser.`;
  }
  return `Couldn't ${action}. Please try again.`;
}
