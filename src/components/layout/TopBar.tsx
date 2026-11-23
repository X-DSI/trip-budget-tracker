import { AppLogo } from '../Icons';
import { OnlineIndicator } from '../OnlineIndicator';
import { PendingSyncBadge } from '../PendingSyncBadge';
import { TripSwitcher } from '../../features/trips/TripSwitcher';

export function TopBar({ title }: { title: string }) {
  return (
    <header
      data-testid="top-bar"
      className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:px-8"
    >
      <div className="flex min-h-14 flex-1 items-center gap-3">
        <AppLogo className="h-8 w-8 lg:hidden" />
        <h1 className="truncate text-base font-semibold text-slate-900 lg:text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <TripSwitcher />
        <PendingSyncBadge />
        <OnlineIndicator />
      </div>
    </header>
  );
}
