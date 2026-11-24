import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from '../trips/ActiveTripProvider';
import { NoTripCard } from '../trips/NoTripCard';
import { useFamilies, useMembers } from '../trips/trips.data';
import { isOrganizer, type Trip } from '../trips/model';
import { BudgetSection } from '../budget/BudgetSection';
import { useBudget } from '../budget/budget.data';
import { useExpenses } from '../expenses/expenses.data';

export function BudgetPage() {
  const { user } = useAuth();
  const { trip, loading } = useActiveTrip();
  if (loading && !trip) return <p className="text-slate-500">Loading…</p>;
  if (!trip || !user) return <NoTripCard />;
  return <TripBudget key={trip.id} trip={trip} uid={user.uid} />;
}

function TripBudget({ trip, uid }: { trip: Trip; uid: string }) {
  const canEdit = isOrganizer(trip, uid);
  const families = useFamilies(trip.id).data;
  const members = useMembers(trip.id).data;
  const budget = useBudget(trip.id).data;
  const expenses = useExpenses(trip.id).data;
  const myFamilyId = members.find((m) => m.uid === uid)?.familyId ?? null;

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="text-sm text-slate-500" data-testid="budget-read-only">
          The organisers set the budget. You can see the plan and how spending compares, but not
          change it.
        </p>
      )}
      <BudgetSection
        trip={trip}
        lines={budget}
        expenses={expenses}
        families={families}
        myFamilyId={myFamilyId}
        canEdit={canEdit}
        uid={uid}
      />
    </div>
  );
}
