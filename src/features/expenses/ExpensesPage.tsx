import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { balances, formatINR, splitExpense, type Shares } from '../../domain';
import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from '../trips/ActiveTripProvider';
import { NoTripCard } from '../trips/NoTripCard';
import { useFamilies, useMembers } from '../trips/trips.data';
import { isOrganizer, type Trip } from '../trips/model';
import { useExpenses } from './expenses.data';
import { canEditExpense, categoryOf, groupByDay, splitLabel, type TripExpense } from './model';
import { ExpenseSheetBody, FamilyDot } from './ExpenseSheet';
import { Button, Card, EmptyState, Sheet } from '../../components/ui';
import { formatDate } from '../../lib/dates';
import { useTripToday } from './useTripToday';

export function ExpensesPage() {
  const { user } = useAuth();
  const { trip, loading } = useActiveTrip();
  if (loading && !trip) return <p className="text-slate-500">Loading…</p>;
  if (!trip || !user) return <NoTripCard />;
  return <TripExpenses key={trip.id} trip={trip} uid={user.uid} />;
}

function safeShares(
  e: TripExpense,
  families: Parameters<typeof splitExpense>[1],
  kw: number,
): Shares {
  try {
    return splitExpense(e, families, kw);
  } catch {
    return {};
  }
}

function TripExpenses({ trip, uid }: { trip: Trip; uid: string }) {
  const familiesState = useFamilies(trip.id);
  const families = familiesState.data;
  const membersState = useMembers(trip.id);
  const members = membersState.data;
  const expensesState = useExpenses(trip.id);
  const today = useTripToday(trip.timezone);
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<TripExpense | 'new' | null>(() =>
    params.get('add') === '1' ? 'new' : null,
  );
  // Drop ?add=1 once used, so reloading or going back doesn't reopen the sheet.
  useEffect(() => {
    if (params.has('add')) setParams({}, { replace: true });
  }, [params, setParams]);

  const organizer = isOrganizer(trip, uid);
  const myFamilyId = members.find((m) => m.uid === uid)?.familyId ?? null;
  const expenses = useMemo(
    () => expensesState.data.filter((e) => !e.deleted),
    [expensesState.data],
  );
  const memberName = (id: string) =>
    id === uid ? 'you' : (members.find((m) => m.uid === id)?.displayName ?? 'someone');

  const totals = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amountPaise, 0);
    const todayTotal = expenses
      .filter((e) => e.date === today)
      .reduce((s, e) => s + e.amountPaise, 0);
    let myShare = 0;
    if (myFamilyId && families.length > 0) {
      try {
        myShare = balances(expenses, [], families, trip.kidWeight)[myFamilyId]?.share ?? 0;
      } catch {
        myShare = 0;
      }
    }
    return { total, todayTotal, myShare };
  }, [expenses, families, today, myFamilyId, trip.kidWeight]);

  const hasFamilies = families.some((f) => f.active);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 grid-cols-3 gap-3">
          <Total label="Trip total" paise={totals.total} testId="trip-total" />
          <Total label="Today" paise={totals.todayTotal} />
          <Total label="Your family’s share" paise={totals.myShare} hidden={!myFamilyId} />
        </div>
        {hasFamilies && (
          <div className="hidden lg:block">
            <Button onClick={() => setOpen('new')}>Add expense</Button>
          </div>
        )}
      </div>

      {!myFamilyId && hasFamilies && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Pick your family on the{' '}
          <Link to="/trip" className="font-medium underline">
            Trip tab
          </Link>{' '}
          so new expenses default to your family.
        </p>
      )}

      {!hasFamilies ? (
        <EmptyState>
          Add the families on the{' '}
          <Link to="/trip" className="font-medium text-teal-700">
            Trip tab
          </Link>{' '}
          first, so expenses can be split between them.
        </EmptyState>
      ) : expenses.length === 0 ? (
        <EmptyState>No expenses yet. Tap “Add expense” when someone pays for something.</EmptyState>
      ) : (
        <div className="space-y-6" data-testid="expense-list">
          {groupByDay(expenses).map(([day, list]) => (
            <section key={day}>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-semibold text-slate-900">
                  {day === today ? 'Today' : formatDate(day, { withYear: false })}
                </h2>
                <span className="text-sm text-slate-500 tabular-nums">
                  {formatINR(list.reduce((s, e) => s + e.amountPaise, 0))}
                </span>
              </div>
              <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
                {list.map((e) => {
                  const payer = families.find((f) => f.id === e.paidByFamilyId);
                  const mine = myFamilyId
                    ? safeShares(e, families, trip.kidWeight)[myFamilyId]
                    : undefined;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setOpen(e)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                      >
                        <span className="text-2xl" aria-hidden="true">
                          {categoryOf(e.category).emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-900">
                            {e.title}
                          </span>
                          <span className="flex items-center gap-1.5 truncate text-sm text-slate-600">
                            {payer && <FamilyDot family={payer} />}
                            {payer?.name ?? 'Unknown family'} · {splitLabel(e.splitMode)}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block font-semibold text-slate-900 tabular-nums">
                            {formatINR(e.amountPaise)}
                          </span>
                          {mine !== undefined && mine > 0 && (
                            <span className="block text-xs text-slate-500 tabular-nums">
                              yours {formatINR(mine)}
                            </span>
                          )}
                          {e.pending && (
                            <span
                              className="block text-xs text-sky-700"
                              data-testid="expense-pending"
                            >
                              Not synced yet
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {hasFamilies && (
        <button
          type="button"
          onClick={() => setOpen('new')}
          className="fixed right-4 bottom-24 z-10 rounded-full bg-teal-700 px-5 py-3.5 font-medium text-white shadow-lg lg:hidden"
        >
          + Add expense
        </button>
      )}

      <Sheet
        open={open !== null}
        title={
          open === 'new'
            ? 'Add an expense'
            : open && canEditExpense(open, uid, organizer)
              ? 'Edit expense'
              : 'Expense'
        }
        onClose={() => setOpen(null)}
      >
        {open !== null && !familiesState.loading && !membersState.loading && (
          <ExpenseSheetBody
            key={open === 'new' ? 'new' : open.id}
            trip={trip}
            families={families}
            myFamilyId={myFamilyId}
            expense={open === 'new' ? null : open}
            canEdit={open === 'new' || canEditExpense(open, uid, organizer)}
            uid={uid}
            today={today}
            memberName={memberName}
            onDone={() => setOpen(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

function Total({
  label,
  paise,
  hidden,
  testId,
}: {
  label: string;
  paise: number;
  hidden?: boolean;
  testId?: string;
}) {
  return (
    <Card className="!p-3 sm:!p-4">
      <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase sm:text-xs">
        {label}
      </p>
      <p
        className="mt-1 text-lg font-semibold text-slate-900 tabular-nums sm:text-2xl"
        data-testid={testId}
      >
        {hidden ? '—' : formatINR(paise)}
      </p>
    </Card>
  );
}
