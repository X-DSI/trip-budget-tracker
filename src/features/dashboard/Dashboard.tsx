import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useUserProfile } from '../profile/profile.data';
import { useActiveTrip } from '../trips/ActiveTripProvider';
import { NoTripCard } from '../trips/NoTripCard';
import { useFamilies, useLegs, useMembers } from '../trips/trips.data';
import { headcount, LEG_MODES, sortLegs, travelSummary, type Leg, type Trip } from '../trips/model';
import { Countdown } from './Countdown';
import { lineForDay, tripPhase, type TripPhase } from './phase';
import { firstName } from '../../lib/names';
import { formatDateRange } from '../../lib/dates';
import { currentPlatform } from '../../lib/platform';
import { Card } from '../../components/ui';
import { useExpenses } from '../expenses/expenses.data';
import { formatINR, splitExpense } from '../../domain';
import { useBudget } from '../budget/budget.data';
import { useSettlements } from '../balances/settlements.data';
import { tripBalances, yourNetLabel } from '../balances/model';

/** Re-evaluates the trip phase every minute, so the screen flips at midnight on its own. */
function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Dashboard() {
  const { user } = useAuth();
  const profile = useUserProfile(user?.uid);
  const { trip, loading } = useActiveTrip();
  const now = useMinuteClock();
  const name = firstName(profile?.displayName ?? user?.displayName);

  if (!trip) {
    return (
      <section className="space-y-6" data-testid="dashboard" data-phase="none">
        <Hero>
          <p className="text-sm text-teal-100">Welcome</p>
          <h2 className="mt-1 text-2xl font-semibold lg:text-3xl">Hi {name}!</h2>
          <p className="mt-2 max-w-prose text-teal-50">
            {loading
              ? 'Loading your trips…'
              : 'Plan a trip with the other families, or join one with the link from your group chat.'}
          </p>
        </Hero>
        {!loading && <NoTripCard />}
      </section>
    );
  }

  return <TripDashboard key={trip.id} trip={trip} name={name} phase={tripPhase(trip, now)} />;
}

function TripDashboard({ trip, name, phase }: { trip: Trip; name: string; phase: TripPhase }) {
  const { user } = useAuth();
  const legs = sortLegs(useLegs(trip.id).data);
  const families = useFamilies(trip.id).data;
  const members = useMembers(trip.id).data;
  const people = headcount(families);
  const travel = travelSummary(legs, trip.expectedKm);
  const me = members.find((m) => m.uid === user?.uid);
  const budget = useBudget(trip.id).data;

  return (
    <section className="space-y-6" data-testid="dashboard" data-phase={phase.phase}>
      {phase.phase === 'before' && (
        <Hero>
          <p className="text-sm text-teal-100">Hi {name}!</p>
          <h2 className="mt-1 text-2xl font-semibold break-words lg:text-3xl">
            {trip.name} {phase.daysToGo === 1 ? 'starts tomorrow' : 'starts in'}
          </h2>
          <Countdown target={phase.startsAt ?? 0} />
          <TripLine trip={trip} />
        </Hero>
      )}

      {phase.phase === 'during' && (
        <Hero>
          <p className="text-sm text-teal-100" data-testid="day-of-trip">
            Day {phase.dayNumber} of {phase.totalDays}
          </p>
          <h2 className="mt-1 text-2xl font-semibold break-words lg:text-3xl">
            Enjoy {trip.destination || trip.name}, {name}!
          </h2>
          <p className="mt-3 max-w-prose text-teal-50">{lineForDay(phase.dayNumber ?? 1)}</p>
          <TripLine trip={trip} />
        </Hero>
      )}

      {phase.phase === 'after' && (
        <Hero>
          <p className="text-sm text-teal-100">Welcome back, {name}!</p>
          <h2 className="mt-1 text-2xl font-semibold break-words lg:text-3xl">
            Hope {trip.name} was wonderful
          </h2>
          <p className="mt-3 max-w-prose text-teal-50">
            Time to square up. Check who owes whom and settle over UPI.
          </p>
          <Link
            to="/balances"
            className="mt-4 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-teal-800"
          >
            See balances
          </Link>
        </Hero>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Days" value={String(phase.totalDays)} />
        <Stat label="Families" value={String(people.families)} />
        <Stat
          label="People"
          value={String(people.adults + people.kids)}
          detail={people.kids ? `${people.adults} adults · ${people.kids} kids` : undefined}
        />
        <Stat
          label="Distance"
          value={travel.totalKm != null ? `${travel.totalKm.toLocaleString('en-IN')} km` : '—'}
          detail={travel.cars ? `${travel.cars} car${travel.cars === 1 ? '' : 's'}` : undefined}
        />
      </div>

      {phase.phase === 'before' && (
        <Checklist
          adults={people.adults}
          joined={members.length}
          hasFamily={!!me?.familyId}
          installed={currentPlatform().standalone}
          budgetLines={budget.length}
          budgetTotal={budget.reduce((s, l) => s + l.amountPaise, 0)}
        />
      )}

      {phase.phase === 'during' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <TodayLegs legs={legs.filter((l) => l.date === phase.today)} />
          <TodaySpend trip={trip} today={phase.today ?? ''} myFamilyId={me?.familyId ?? null} />
          <FamilyBalance trip={trip} myFamilyId={me?.familyId ?? null} />
        </div>
      )}

      {phase.phase === 'after' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <FamilyBalance trip={trip} myFamilyId={me?.familyId ?? null} />
        </div>
      )}
    </section>
  );
}

function Hero({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-sm lg:p-8">
      {children}
    </div>
  );
}

function TripLine({ trip }: { trip: Trip }) {
  return (
    <p className="mt-4 text-sm text-teal-100">
      {formatDateRange(trip.startDate, trip.endDate)}
      {trip.destination && ` · ${trip.destination}`}
    </p>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card className="!p-4">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {detail && <p className="text-xs text-slate-500">{detail}</p>}
    </Card>
  );
}

function Checklist({
  adults,
  joined,
  hasFamily,
  installed,
  budgetLines,
  budgetTotal,
}: {
  adults: number;
  joined: number;
  hasFamily: boolean;
  installed: boolean;
  budgetLines: number;
  budgetTotal: number;
}) {
  const items: { done: boolean; label: string; detail: ReactNode; disabled?: boolean }[] = [
    {
      done: adults > 0 && joined >= adults,
      label: 'Everyone has joined',
      detail:
        adults > 0 ? (
          <>
            {joined} of {adults} adults · <Link to="/trip">share the invite</Link>
          </>
        ) : (
          <Link to="/trip">Add the families first</Link>
        ),
    },
    {
      done: hasFamily,
      label: "You've picked your family",
      detail: hasFamily ? 'Done' : <Link to="/trip">Choose it on the Trip tab</Link>,
    },
    {
      done: installed,
      label: 'App installed on this phone',
      detail: installed ? 'Works with no signal' : 'Add to Home Screen so it opens offline',
    },
    {
      done: budgetLines > 0,
      label: 'Budget set',
      detail:
        budgetLines > 0 ? (
          <>
            {formatINR(budgetTotal)} over {budgetLines} line{budgetLines === 1 ? '' : 's'} ·{' '}
            <Link to="/trip">see each family's share</Link>
          </>
        ) : (
          <Link to="/trip">Organisers add it on the Trip tab</Link>
        ),
    },
  ];

  return (
    <Card>
      <h3 className="font-medium text-slate-900">Get ready</h3>
      <ul className="mt-3 space-y-3" data-testid="checklist">
        {items.map((item) => (
          <li key={item.label} className={`flex gap-3 ${item.disabled ? 'opacity-50' : ''}`}>
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                item.done ? 'bg-teal-600 text-white' : 'ring-1 ring-slate-300'
              }`}
            >
              {item.done ? '✓' : ''}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {item.label}
                <span className="sr-only">{item.done ? ' (done)' : ' (to do)'}</span>
              </p>
              <p className="text-sm text-slate-600 [&_a]:font-medium [&_a]:text-teal-700">
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TodayLegs({ legs }: { legs: Leg[] }) {
  return (
    <Card>
      <h3 className="text-sm font-medium text-slate-500">On the road today</h3>
      {legs.length === 0 ? (
        <p className="mt-2 text-slate-600">No travel planned today. Enjoy the day.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {legs.map((leg) => (
            <li key={leg.id}>
              <p className="font-medium text-slate-900">
                {[leg.from, leg.to].filter(Boolean).join(' → ')}
              </p>
              <p className="text-sm text-slate-600">
                {[
                  LEG_MODES.find((m) => m.value === leg.mode)?.label,
                  leg.km != null && `${leg.km.toLocaleString('en-IN')} km`,
                  leg.notes,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TodaySpend({
  trip,
  today,
  myFamilyId,
}: {
  trip: Trip;
  today: string;
  myFamilyId: string | null;
}) {
  const expenses = useExpenses(trip.id).data.filter((e) => !e.deleted && e.date === today);
  const families = useFamilies(trip.id).data;
  const total = expenses.reduce((s, e) => s + e.amountPaise, 0);
  let mine = 0;
  if (myFamilyId) {
    for (const e of expenses) {
      try {
        mine += splitExpense(e, families, trip.kidWeight)[myFamilyId] ?? 0;
      } catch {
        // A malformed expense shouldn't break the dashboard.
      }
    }
  }
  return (
    <Card>
      <h3 className="text-sm font-medium text-slate-500">Today's spend</h3>
      <p
        className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums"
        data-testid="today-spend"
      >
        {formatINR(total)}
      </p>
      <p className="text-sm text-slate-600">
        {expenses.length === 0 ? (
          'Nothing logged yet today.'
        ) : (
          <>
            {expenses.length} expense{expenses.length === 1 ? '' : 's'}
            {myFamilyId && ` · your family's share ${formatINR(mine)}`}
          </>
        )}
      </p>
      <Link to="/expenses" className="mt-2 inline-block text-sm font-medium text-teal-700">
        Add an expense
      </Link>
    </Card>
  );
}

function FamilyBalance({ trip, myFamilyId }: { trip: Trip; myFamilyId: string | null }) {
  const expenses = useExpenses(trip.id).data;
  const settlements = useSettlements(trip.id).data;
  const families = useFamilies(trip.id).data;
  const net = myFamilyId
    ? tripBalances(expenses, settlements, families, trip.kidWeight).balances[myFamilyId]?.net
    : undefined;
  return (
    <Card>
      <h3 className="text-sm font-medium text-slate-500">Your family's balance</h3>
      {net === undefined ? (
        <p className="mt-2 text-slate-600">
          <Link to="/trip" className="font-medium text-teal-700">
            Pick your family
          </Link>{' '}
          to see what you owe or get back.
        </p>
      ) : (
        <p
          className={`mt-1 text-2xl font-semibold ${
            net < 0 ? 'text-rose-700' : net > 0 ? 'text-teal-700' : 'text-slate-900'
          }`}
          data-testid="dashboard-balance"
        >
          {yourNetLabel(net)}
        </p>
      )}
      <Link to="/balances" className="mt-2 inline-block text-sm font-medium text-teal-700">
        See who owes whom
      </Link>
    </Card>
  );
}
