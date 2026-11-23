import { useSyncExternalStore } from 'react';
import { dismissError, getErrors, subscribeErrors } from '../lib/errors';

/** Shows writes the server rejected after they left the offline queue. */
export function ErrorToasts() {
  const errors = useSyncExternalStore(subscribeErrors, getErrors, getErrors);
  if (errors.length === 0) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-40 mx-auto max-w-md space-y-2" role="alert">
      {errors.map((e) => (
        <div
          key={e.id}
          className="flex items-start gap-3 rounded-2xl bg-red-700 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span className="flex-1">{e.message}</span>
          <button type="button" onClick={() => dismissError(e.id)} className="font-medium">
            OK
          </button>
        </div>
      ))}
    </div>
  );
}
