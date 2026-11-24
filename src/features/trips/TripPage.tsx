import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from './ActiveTripProvider';
import { useFamilies, useInvites, useLegs, useMembers } from './trips.data';
import { isOrganizer, type Trip } from './model';
import { LegsSection } from './LegsSection';
import { FamiliesSection } from './FamiliesSection';
import { InviteSection, PeopleSection } from './PeopleSection';
import { NoTripCard } from './NoTripCard';
import { formatDateRange, tripLength } from '../../lib/dates';
import { BudgetSection } from '../budget/BudgetSection';
import { useBudget } from '../budget/budget.data';
import { useExpenses } from '../expenses/expenses.data';

export function TripPage() {
  const { user } = useAuth();
  const { trip, loading } = useActiveTrip();
  if (loading && !trip) return <p className="text-slate-500">Loading your trip…</p>;
  if (!trip || !user) return <NoTripCard />;
  return <TripDetails key={trip.id} trip={trip} uid={user.uid} />;
}

function TripDetails({ trip, uid }: { trip: Trip; uid: string }) {
  const canEdit = isOrganizer(trip, uid);
  const legs = useLegs(trip.id);
  const families = useFamilies(trip.id);
  const members = useMembers(trip.id);
  const invites = useInvites(trip.id, canEdit);
  const budget = useBudget(trip.id);
  const expenses = useExpenses(trip.id);
  const me = members.data.find((m) => m.uid === uid);
  const needsFamily = !members.loading && me && !me.familyId;

  return (
    <div className="space-y-8">
      <TripHeader trip={trip} canEdit={canEdit} />

      {needsFamily && (
        <p
          className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200"
          role="status"
        >
          Pick your family under <strong>People</strong> so your expenses count for the right
          family.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <LegsSection trip={trip} legs={legs.data} canEdit={canEdit} />
        <FamiliesSection
          trip={trip}
          families={families.data}
          members={members.data}
          canEdit={canEdit}
          uid={uid}
        />
        <PeopleSection
          trip={trip}
          members={members.data}
          families={families.data}
          canEdit={canEdit}
          uid={uid}
        />
        {canEdit && (
          <InviteSection trip={trip} invites={invites.data} members={members.data} uid={uid} />
        )}
      </div>

      <BudgetSection
        trip={trip}
        lines={budget.data}
        expenses={expenses.data}
        families={families.data}
        myFamilyId={me?.familyId ?? null}
        canEdit={canEdit}
        uid={uid}
      />
    </div>
  );
}

function TripHeader({ trip, canEdit }: { trip: Trip; canEdit: boolean }) {
  const days = trip.startDate && trip.endDate ? tripLength(trip.startDate, trip.endDate) : null;
  return (
    <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-sm lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold break-words lg:text-3xl" data-testid="trip-name">
            {trip.name}
          </h2>
          {trip.destination && <p className="mt-1 text-teal-50">{trip.destination}</p>}
        </div>
        {canEdit && (
          <Link
            to="/trip/edit"
            className="shrink-0 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25"
          >
            Edit
          </Link>
        )}
      </div>
      <p className="mt-4 text-sm text-teal-100">
        {formatDateRange(trip.startDate, trip.endDate)}
        {days != null && ` · ${days} day${days === 1 ? '' : 's'}`}
      </p>
      {trip.notes && (
        <p className="mt-3 max-w-prose text-sm whitespace-pre-line text-teal-50">{trip.notes}</p>
      )}
    </div>
  );
}
