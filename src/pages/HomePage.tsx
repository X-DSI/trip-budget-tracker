import { Link } from 'react-router';
import { useAuth } from '../features/auth/AuthProvider';
import { useUserProfile } from '../features/profile/profile.data';
import { useActiveTrip } from '../features/trips/ActiveTripProvider';
import { NoTripCard } from '../features/trips/NoTripCard';
import { firstName } from '../lib/names';
import { formatDateRange } from '../lib/dates';

/** Interim dashboard. The dashboard handoff adds the countdown and during-trip welcome. */
export function HomePage() {
  const { user } = useAuth();
  const profile = useUserProfile(user?.uid);
  const { trip, loading } = useActiveTrip();
  const name = firstName(profile?.displayName ?? user?.displayName);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-sm lg:p-8">
        <p className="text-sm text-teal-100">Welcome</p>
        <h2 className="mt-1 text-2xl font-semibold lg:text-3xl">Hi {name}!</h2>
        {trip ? (
          <p className="mt-2 max-w-prose text-teal-50">
            <strong className="text-white">{trip.name}</strong> ·{' '}
            {formatDateRange(trip.startDate, trip.endDate)}
            {trip.destination && ` · ${trip.destination}`}
          </p>
        ) : (
          <p className="mt-2 max-w-prose text-teal-50">
            {loading ? 'Loading your trips…' : "You're not part of a trip yet."}
          </p>
        )}
        {trip && (
          <Link
            to="/trip"
            className="mt-4 inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
          >
            Open the trip plan
          </Link>
        )}
      </div>

      {!trip && !loading && <NoTripCard />}
    </section>
  );
}
