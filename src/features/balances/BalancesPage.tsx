import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { formatINR, paiseToDecimalString, type Payment } from '../../domain';
import { useAuth } from '../auth/AuthProvider';
import { useActiveTrip } from '../trips/ActiveTripProvider';
import { NoTripCard } from '../trips/NoTripCard';
import { useFamilies, useMembers } from '../trips/trips.data';
import { isOrganizer, type Trip, type TripFamily } from '../trips/model';
import { useExpenses } from '../expenses/expenses.data';
import { useTripToday } from '../expenses/useTripToday';
import { Chip, FamilyDot } from '../expenses/ExpenseSheet';
import { addSettlement, setSettlementDeleted, useSettlements } from './settlements.data';
import {
  canDeleteSettlement,
  canRecordPayment,
  formToSettlement,
  netLabel,
  paymentLink,
  SETTLEMENT_METHODS,
  sortSettlements,
  tripBalances,
  yourNetLabel,
  type PaymentForm,
  type TripSettlement,
} from './model';
import {
  Button,
  Card,
  EmptyState,
  Field,
  inputClass,
  SectionHeader,
  Sheet,
} from '../../components/ui';
import { formatDate } from '../../lib/dates';

export function BalancesPage() {
  const { user } = useAuth();
  const { trip, loading } = useActiveTrip();
  if (loading && !trip) return <p className="text-slate-500">Loading…</p>;
  if (!trip || !user) return <NoTripCard />;
  return <TripBalancesView key={trip.id} trip={trip} uid={user.uid} />;
}

function TripBalancesView({ trip, uid }: { trip: Trip; uid: string }) {
  const familiesState = useFamilies(trip.id);
  const families = familiesState.data;
  const members = useMembers(trip.id).data;
  const expenses = useExpenses(trip.id).data;
  const settlementsState = useSettlements(trip.id);
  const today = useTripToday(trip.timezone);
  const [paying, setPaying] = useState<Payment | null>(null);

  const organizer = isOrganizer(trip, uid);
  const myFamilyId = members.find((m) => m.uid === uid)?.familyId ?? null;
  const settlements = settlementsState.data;
  const result = useMemo(
    () => tripBalances(expenses, settlements, families, trip.kidWeight),
    [expenses, settlements, families, trip.kidWeight],
  );
  const history = useMemo(
    () => sortSettlements(settlements.filter((s) => !s.deleted)),
    [settlements],
  );
  const familyById = (id: string) => families.find((f) => f.id === id);
  const familyName = (id: string) => familyById(id)?.name ?? 'A family';
  const memberName = (id: string) =>
    id === uid ? 'you' : (members.find((m) => m.uid === id)?.displayName ?? 'someone');

  // Active families, plus any inactive one that still has money to sort out.
  const rows = families.filter((f) => f.active || (result.balances[f.id]?.net ?? 0) !== 0);
  const anyMoney = expenses.some((e) => !e.deleted) || history.length > 0;
  const mine = myFamilyId ? result.balances[myFamilyId] : undefined;

  if (!familiesState.loading && families.length === 0) {
    return (
      <EmptyState>
        Add the families on the{' '}
        <Link to="/trip" className="font-medium text-teal-700">
          Trip tab
        </Link>{' '}
        first. Balances are worked out between families.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-sm lg:p-8">
        <p className="text-sm text-teal-100">Your family’s balance</p>
        <p className="mt-1 text-2xl font-semibold lg:text-3xl" data-testid="my-balance">
          {mine ? yourNetLabel(mine.net) : 'Pick your family to see it'}
        </p>
        <p className="mt-2 max-w-prose text-sm text-teal-50">
          Worked out on this phone from every expense and payment synced so far. Nothing is stored,
          so it’s always up to date.
        </p>
      </div>

      {!myFamilyId && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Pick your family on the{' '}
          <Link to="/trip" className="font-medium underline">
            Trip tab
          </Link>{' '}
          to record payments your family makes or receives.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionHeader title="Families" subtitle="Paid, share and payments so far" />
          <ul className="space-y-2" data-testid="family-balances">
            {rows.map((f) => {
              const b = result.balances[f.id] ?? {
                paid: 0,
                share: 0,
                sent: 0,
                received: 0,
                net: 0,
              };
              return (
                <li key={f.id} data-testid="family-balance" data-net={b.net} data-family={f.name}>
                  <Card className="!p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="flex min-w-0 items-center gap-2 font-medium text-slate-900">
                        <FamilyDot family={f} />
                        <span className="truncate">
                          {f.name}
                          {f.id === myFamilyId && ' (you)'}
                        </span>
                      </p>
                      <p
                        className={`shrink-0 text-sm font-semibold ${
                          b.net < 0
                            ? 'text-rose-700'
                            : b.net > 0
                              ? 'text-teal-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {netLabel(b.net)}
                      </p>
                    </div>
                    <dl className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                      <Figure label="Paid" paise={b.paid} />
                      <Figure label="Share" paise={b.share} />
                      <Figure label="Settled" paise={b.sent - b.received} signed />
                    </dl>
                  </Card>
                </li>
              );
            })}
          </ul>
          {result.skipped > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              {result.skipped} item{result.skipped === 1 ? '' : 's'} left out because they refer to
              a family that isn’t on the trip.
            </p>
          )}
        </section>

        <section>
          <SectionHeader
            title="Settle up"
            subtitle={
              result.payments.length > 0
                ? `${result.payments.length} ${result.payments.length === 1 ? 'payment squares' : 'payments square'} everyone`
                : undefined
            }
          />
          {result.payments.length === 0 ? (
            <EmptyState>
              <span data-testid="all-settled">
                {anyMoney ? 'Everyone is settled. 🎉' : 'Nothing to settle yet.'}
              </span>
            </EmptyState>
          ) : (
            <ul className="space-y-2" data-testid="suggested-payments">
              {result.payments.map((p) => {
                const from = familyById(p.fromFamilyId);
                const to = familyById(p.toFamilyId);
                const iPay = myFamilyId === p.fromFamilyId;
                const link = iPay ? paymentLink(p, families, trip.name) : null;
                return (
                  <li key={`${p.fromFamilyId}-${p.toFamilyId}`} data-testid="suggested-payment">
                    <Card className="!p-4">
                      <p className="text-slate-800">
                        <FamilyName family={from} /> pays <FamilyName family={to} />
                      </p>
                      <p className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
                        {formatINR(p.amountPaise, { alwaysPaise: p.amountPaise % 100 !== 0 })}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {link && (
                          <a
                            href={link}
                            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
                          >
                            Pay with UPI
                          </a>
                        )}
                        {canRecordPayment(p, myFamilyId) && (
                          <Button
                            variant={link ? 'secondary' : 'primary'}
                            onClick={() => setPaying(p)}
                          >
                            Mark as paid
                          </Button>
                        )}
                      </div>
                      {iPay && !link && (
                        <p className="mt-2 text-xs text-slate-500">
                          {to?.name ?? 'They'} haven’t added a UPI ID. An organiser can add it on
                          the Trip tab, or pay another way and mark it as paid.
                        </p>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section>
        <SectionHeader title="Payments made" />
        {history.length === 0 ? (
          <EmptyState>No payments recorded yet.</EmptyState>
        ) : (
          <ul
            className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200"
            data-testid="settlement-history"
          >
            {history.map((s) => (
              <SettlementRow
                key={s.id}
                settlement={s}
                fromName={familyName(s.fromFamilyId)}
                toName={familyName(s.toFamilyId)}
                recordedBy={memberName(s.createdBy)}
                canDelete={canDeleteSettlement(s, uid, organizer)}
                onDelete={() => setSettlementDeleted(trip.id, s.id, uid, true)}
              />
            ))}
          </ul>
        )}
      </section>

      <Sheet open={paying !== null} title="Mark as paid" onClose={() => setPaying(null)}>
        {paying && (
          <PaymentFormView
            key={`${paying.fromFamilyId}-${paying.toFamilyId}`}
            payment={paying}
            families={families}
            today={today}
            onSave={(form) => {
              const { input } = formToSettlement(form, paying);
              if (input) addSettlement(trip.id, uid, input);
              setPaying(null);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function FamilyName({ family }: { family: TripFamily | undefined }) {
  if (!family) return <strong>a family</strong>;
  return (
    <strong className="inline-flex items-center gap-1.5">
      <FamilyDot family={family} />
      {family.name}
    </strong>
  );
}

function Figure({ label, paise, signed }: { label: string; paise: number; signed?: boolean }) {
  const text =
    signed && paise !== 0
      ? `${paise > 0 ? 'sent' : 'got'} ${formatINR(Math.abs(paise))}`
      : formatINR(paise);
  return (
    <div>
      <dt>{label}</dt>
      <dd className="font-medium text-slate-800 tabular-nums">{text}</dd>
    </div>
  );
}

function SettlementRow({
  settlement: s,
  fromName,
  toName,
  recordedBy,
  canDelete,
  onDelete,
}: {
  settlement: TripSettlement;
  fromName: string;
  toName: string;
  recordedBy: string;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const method = SETTLEMENT_METHODS.find((m) => m.value === s.method)?.label ?? s.method;
  return (
    <li className="flex items-center gap-3 px-4 py-3" data-testid="settlement">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">
          {fromName} paid {toName}
        </p>
        <p className="truncate text-sm text-slate-600">
          {method} · {formatDate(s.date, { withYear: false })} · recorded by {recordedBy}
          {s.note && ` · ${s.note}`}
        </p>
        {s.pending && (
          <p className="text-xs text-sky-700" data-testid="settlement-pending">
            Not synced yet
          </p>
        )}
      </div>
      <span className="font-semibold text-slate-900 tabular-nums">
        {formatINR(s.amountPaise, { alwaysPaise: s.amountPaise % 100 !== 0 })}
      </span>
      {canDelete &&
        (confirm ? (
          <Button variant="danger" className="!px-3" onClick={onDelete}>
            Yes, delete
          </Button>
        ) : (
          <Button variant="ghost" className="!px-2" onClick={() => setConfirm(true)}>
            Delete
          </Button>
        ))}
    </li>
  );
}

function PaymentFormView({
  payment,
  families,
  today,
  onSave,
}: {
  payment: Payment;
  families: TripFamily[];
  today: string;
  onSave: (form: PaymentForm) => void;
}) {
  const [form, setForm] = useState<PaymentForm>({
    amount: paiseToDecimalString(payment.amountPaise),
    method: 'upi',
    date: today,
    note: '',
  });
  const [showError, setShowError] = useState(false);
  const { error } = formToSettlement(form, payment);
  const name = (id: string) => families.find((f) => f.id === id)?.name ?? 'A family';
  const set = <K extends keyof PaymentForm>(key: K, value: PaymentForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (error) {
      setShowError(true);
      return;
    }
    onSave(form);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="payment-form">
      <p className="text-slate-700">
        <strong>{name(payment.fromFamilyId)}</strong> paid{' '}
        <strong>{name(payment.toFamilyId)}</strong>
      </p>
      <Field label="Amount paid (₹)" hint="Change it if they paid part of it">
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            inputMode="decimal"
            className={`${inputClass} !py-3 !text-2xl font-semibold`}
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
          />
        )}
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">How</legend>
        <div className="flex flex-wrap gap-2">
          {SETTLEMENT_METHODS.map((m) => (
            <Chip
              key={m.value}
              name="method"
              checked={form.method === m.value}
              onChange={() => set('method', m.value)}
            >
              {m.label}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date">
          {(id, d) => (
            <input
              id={id}
              type="date"
              aria-describedby={d}
              className={inputClass}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          )}
        </Field>
        <Field label="Note" hint="Optional">
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              className={inputClass}
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
            />
          )}
        </Field>
      </div>
      {showError && error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <Button type="submit">Record payment</Button>
    </form>
  );
}
