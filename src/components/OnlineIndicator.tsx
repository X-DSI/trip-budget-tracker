import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { OfflineIcon } from './Icons';

export function OnlineIndicator() {
  const online = useOnlineStatus();

  if (online) {
    return (
      <span data-testid="online-indicator" data-online="true" className="sr-only" role="status">
        Online
      </span>
    );
  }

  return (
    <span
      data-testid="online-indicator"
      data-online="false"
      role="status"
      title="You're offline. Changes are saved on this phone and sync when you're back online."
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
    >
      <OfflineIcon className="h-4 w-4" />
      Offline
    </span>
  );
}
