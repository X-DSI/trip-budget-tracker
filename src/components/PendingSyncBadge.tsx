import { usePendingWrites } from '../hooks/usePendingWrites';
import { CloudUploadIcon } from './Icons';

export function PendingSyncBadge() {
  const pending = usePendingWrites();
  if (pending === 0) return null;

  return (
    <span
      data-testid="pending-sync"
      role="status"
      title="Saved on this device. Will sync when there's a connection."
      className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800"
    >
      <CloudUploadIcon className="h-4 w-4" />
      Waiting to sync
    </span>
  );
}
