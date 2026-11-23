import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from './ActiveTripProvider';
import { setActiveTrip } from './trips.data';
import { JoinWithLinkCard } from './NoTripCard';
import { formatDateRange } from '../../lib/dates';

export function MyTrips() {
  const { user } = useAuth();
  const { trips, trip: active } = useActiveTrip();
  const sorted = [...trips].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium text-slate-900">My trips</h2>
          <Link to="/trips/new" className="text-sm font-medium text-teal-700">
            Plan a new trip
          </Link>
        </div>
        {sorted.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No trips yet.</p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="my-trips">
            {sorted.map((t) => {
              const isActive = t.id === active?.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={isActive}
                    onClick={() => user && setActiveTrip(user.uid, t.id)}
                    className={`w-full rounded-xl px-4 py-3 text-left ring-1 ${
                      isActive ? 'bg-teal-50 ring-teal-300' : 'ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-medium text-slate-900">
                      {t.name}
                      {isActive && (
                        <span className="ml-2 text-xs font-normal text-teal-700">Active</span>
                      )}
                    </span>
                    <span className="text-sm text-slate-600">
                      {formatDateRange(t.startDate, t.endDate)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <JoinWithLinkCard />
    </div>
  );
}
