import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from './ActiveTripProvider';
import { setActiveTrip } from './trips.data';

/** Only appears when the user belongs to more than one trip. */
export function TripSwitcher() {
  const { user } = useAuth();
  const { trips, trip } = useActiveTrip();
  if (!user || trips.length < 2 || !trip) return null;

  return (
    <select
      aria-label="Active trip"
      data-testid="trip-switcher"
      value={trip.id}
      onChange={(e) => setActiveTrip(user.uid, e.target.value)}
      className="max-w-[9rem] truncate rounded-lg border-0 bg-slate-100 py-1.5 pr-7 pl-2 text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 lg:max-w-xs"
    >
      {trips.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
