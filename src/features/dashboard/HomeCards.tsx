// Extra Home cards: quick add, important info, budget at a glance, recent expenses.
import { useState } from 'react';
import { Link } from 'react-router';
import { formatINR } from '../../domain';
import { splitPhones } from '../../lib/phones';
import { Button, Card, Field, inputClass, Sheet } from '../../components/ui';
import { updateImportantInfo } from '../trips/trips.data';
import type { Trip, TripFamily } from '../trips/model';
import type { TripExpense } from '../expenses/model';
import { categoryOf } from '../expenses/model';
import { budgetVsActual, progressPercent, type TripBudgetLine } from '../budget/model';
import { FamilyDot } from '../expenses/ExpenseSheet';

export function QuickAdd() {
  return (
    <Link
      to="/expenses?add=1"
      data-testid="quick-add"
      className="flex items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 text-lg font-medium text-white shadow-sm hover:bg-teal-800"
    >
      <span aria-hidden="true">＋</span> Add expense
    </Link>
  );
}

const MAX_INFO = 4000;

/** Organiser-written notes pinned on Home, with tappable phone numbers. */
export function ImportantInfoCard({ trip, canEdit }: { trip: Trip; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const info = trip.importantInfo.trim();
  if (!info && !canEdit) return null;

  return (
    <Card data-testid="important-info" className="ring-amber-200">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">📌 Important info</h3>
        {canEdit && (
          <button
            type="button"
            className="text-sm font-medium text-teal-700"
            onClick={() => setEditing(true)}
          >
            {info ? 'Edit' : 'Add'}
          </button>
        )}
      </div>
      {info ? (
        <p className="mt-2 text-sm break-words whitespace-pre-line text-slate-800">
          {splitPhones(info).map((part, i) =>
            'phone' in part ? (
              <a key={i} href={part.href} className="font-medium text-teal-700 underline">
                {part.phone}
              </a>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          Add hotel addresses, bookings and emergency contacts. Everyone sees them here, even with
          no signal.
        </p>
      )}
      <Sheet open={editing} title="Important info" onClose={() => setEditing(false)}>
        {editing && (
          <InfoForm
            initial={trip.importantInfo}
            onSave={(text) => {
              updateImportantInfo(trip.id, text.trim());
              setEditing(false);
            }}
          />
        )}
      </Sheet>
    </Card>
  );
}

function InfoForm({ initial, onSave }: { initial: string; onSave: (text: string) => void }) {
  const [text, setText] = useState(initial);
  const tooLong = text.length > MAX_INFO;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!tooLong) onSave(text);
      }}
    >
      <Field
        label="Shown to everyone on Home"
        hint={`${text.length.toLocaleString('en-IN')} / ${MAX_INFO.toLocaleString('en-IN')} characters. Phone numbers become tappable.`}
        error={tooLong ? 'That’s too long. Keep it to the essentials.' : null}
      >
        {(id, d) => (
          <textarea
            id={id}
            aria-describedby={d}
            aria-invalid={tooLong}
            rows={10}
            className={inputClass}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              'Sterling Fern Hill, Ooty — check-in 2 pm, booking SFH-12345\nHotel desk: 0423 2444444\nDriver Ravi: 98765 43210\nAmbulance: 108'
            }
          />
        )}
      </Field>
      <Button type="submit" disabled={tooLong}>
        Save
      </Button>
    </form>
  );
}

function Bar({ percent }: { percent: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${percent >= 100 ? 'bg-amber-500' : 'bg-teal-600'}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function BudgetGlance({
  trip,
  lines,
  expenses,
  families,
  myFamilyId,
}: {
  trip: Trip;
  lines: TripBudgetLine[];
  expenses: TripExpense[];
  families: TripFamily[];
  myFamilyId: string | null;
}) {
  if (lines.length === 0) return null;
  const report = budgetVsActual(
    lines,
    expenses.filter((e) => !e.deleted),
    families,
    trip.kidWeight,
  );
  const mine = myFamilyId ? report.byFamily[myFamilyId] : undefined;

  return (
    <Card data-testid="budget-glance">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold text-slate-900">Budget</h3>
        <Link to="/money/budget" className="text-sm font-medium text-teal-700">
          Details
        </Link>
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="text-sm text-slate-700">
          Trip: <strong>{formatINR(report.actual)}</strong> of {formatINR(report.planned)}
        </p>
        <Bar percent={progressPercent(report)} />
      </div>
      {mine && mine.planned > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-sm text-slate-700">
            Your family: <strong>{formatINR(mine.actual)}</strong> of {formatINR(mine.planned)}
          </p>
          <Bar percent={progressPercent(mine)} />
        </div>
      )}
    </Card>
  );
}

export function RecentExpenses({
  expenses,
  families,
}: {
  expenses: TripExpense[];
  families: TripFamily[];
}) {
  const recent = expenses
    .filter((e) => !e.deleted)
    .sort(
      (a, b) =>
        (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0) ||
        b.date.localeCompare(a.date) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 3);
  if (recent.length === 0) return null;

  return (
    <Card data-testid="recent-expenses" className="!p-0">
      <div className="flex items-baseline justify-between gap-3 px-5 pt-4">
        <h3 className="font-semibold text-slate-900">Recent expenses</h3>
        <Link to="/expenses" className="text-sm font-medium text-teal-700">
          All
        </Link>
      </div>
      <ul className="mt-2 divide-y divide-slate-100">
        {recent.map((e) => {
          const payer = families.find((f) => f.id === e.paidByFamilyId);
          return (
            <li key={e.id} className="flex items-center gap-3 px-5 py-3">
              <span aria-hidden="true" className="text-xl">
                {categoryOf(e.category).emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">{e.title}</span>
                <span className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                  {payer && <FamilyDot family={payer} />}
                  {payer?.name ?? 'Unknown family'}
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {formatINR(e.amountPaise)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
