import { useMemo, useState, type FormEvent } from 'react';
import { formatINR } from '../../domain';
import type { Trip, TripFamily } from '../trips/model';
import { CATEGORIES, categoryOf } from '../expenses/model';
import type { TripExpense } from '../expenses/model';
import { Chip, FamilyDot, ParticipantsPicker } from '../expenses/ExpenseSheet';
import { addBudgetLine, deleteBudgetLine, updateBudgetLine } from './budget.data';
import {
  BUDGET_SPLIT_MODES,
  budgetLineToForm,
  budgetVsActual,
  emptyBudgetForm,
  formToBudgetLine,
  progressPercent,
  sortBudgetLines,
  type BudgetForm,
  type PlannedVsActual,
  type TripBudgetLine,
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

const modeLabel = (mode: TripBudgetLine['splitMode']) =>
  BUDGET_SPLIT_MODES.find((m) => m.value === mode)?.label ?? mode;

export function BudgetSection({
  trip,
  lines,
  expenses,
  families,
  myFamilyId,
  canEdit,
  uid,
}: {
  trip: Trip;
  lines: TripBudgetLine[];
  expenses: TripExpense[];
  families: TripFamily[];
  myFamilyId: string | null;
  canEdit: boolean;
  uid: string;
}) {
  const [editing, setEditing] = useState<TripBudgetLine | 'new' | null>(null);
  const sorted = useMemo(() => sortBudgetLines(lines), [lines]);
  const report = useMemo(
    () => budgetVsActual(lines, expenses, families, trip.kidWeight),
    [lines, expenses, families, trip.kidWeight],
  );
  const active = families.filter((f) => f.active);
  const hasFamilies = active.length > 0;

  return (
    <section data-testid="budget">
      <SectionHeader
        title="Budget"
        subtitle={
          lines.length > 0
            ? `Planned ${formatINR(report.planned)} · spent ${formatINR(report.actual)}`
            : 'What the trip should cost, and each family’s share'
        }
        action={
          canEdit &&
          hasFamilies && (
            <Button variant="secondary" onClick={() => setEditing('new')}>
              Add budget line
            </Button>
          )
        }
      />

      {lines.length === 0 ? (
        <EmptyState>
          {!hasFamilies
            ? 'Add the families first, so the budget can be shared between them.'
            : canEdit
              ? 'Add what you expect to spend — fuel, stays, food, tickets — and how to share it.'
              : 'The organisers haven’t set a budget yet.'}
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="!p-0">
            <ul className="divide-y divide-slate-100" data-testid="budget-lines">
              {sorted.map((line) => (
                <li key={line.id}>
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setEditing(line)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left enabled:hover:bg-slate-50"
                  >
                    <span className="text-xl" aria-hidden="true">
                      {categoryOf(line.category).emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">
                        {line.title}
                      </span>
                      <span className="block truncate text-sm text-slate-600">
                        {line.splitMode === 'personal'
                          ? (families.find((f) => f.id === line.familyId)?.name ?? 'One family')
                          : modeLabel(line.splitMode)}
                      </span>
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatINR(line.amountPaise)}
                    </span>
                  </button>
                </li>
              ))}
              <li className="flex items-center justify-between px-4 py-3 font-semibold">
                <span>Total</span>
                <span className="tabular-nums" data-testid="budget-total">
                  {formatINR(report.planned)}
                </span>
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="font-medium text-slate-900">Each family’s share</h3>
            <p className="text-sm text-slate-500">Planned, and their share of what’s been spent</p>
            <ul className="mt-3 space-y-3" data-testid="planned-shares">
              {active.map((f) => {
                const row = report.byFamily[f.id] ?? { planned: 0, actual: 0 };
                return (
                  <li key={f.id} data-testid="planned-share" data-family={f.name}>
                    <ProgressRow
                      label={
                        <>
                          <FamilyDot family={f} />
                          <span className="truncate">
                            {f.name}
                            {f.id === myFamilyId && ' (you)'}
                          </span>
                        </>
                      }
                      row={row}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="font-medium text-slate-900">Budget vs actual</h3>
            <ul className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2" data-testid="budget-vs-actual">
              {report.byCategory.map((row) => {
                const c = categoryOf(row.category);
                return (
                  <li key={row.category}>
                    <ProgressRow
                      label={
                        <span>
                          <span aria-hidden="true">{c.emoji}</span> {c.label}
                        </span>
                      }
                      row={row}
                    />
                  </li>
                );
              })}
            </ul>
            {report.skipped > 0 && (
              <p className="mt-3 text-xs text-amber-700">
                {report.skipped} item{report.skipped === 1 ? '' : 's'} left out because they refer
                to a family that isn’t on the trip.
              </p>
            )}
          </Card>
        </div>
      )}

      <Sheet
        open={editing !== null}
        title={editing === 'new' ? 'Add a budget line' : 'Edit budget line'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <BudgetLineForm
            key={editing === 'new' ? 'new' : editing.id}
            trip={trip}
            families={families}
            line={editing === 'new' ? null : editing}
            initial={
              editing === 'new'
                ? emptyBudgetForm(families, myFamilyId)
                : budgetLineToForm(editing, families)
            }
            onSave={(input) => {
              if (editing === 'new') {
                const order = lines.reduce((m, l) => Math.max(m, l.order), -1) + 1;
                addBudgetLine(trip.id, uid, input, order);
              } else {
                updateBudgetLine(trip.id, editing.id, uid, input);
              }
              setEditing(null);
            }}
            onDelete={
              editing === 'new'
                ? undefined
                : () => {
                    deleteBudgetLine(trip.id, editing.id);
                    setEditing(null);
                  }
            }
          />
        )}
      </Sheet>
    </section>
  );
}

/** A label, "spent of planned" figures, and a bar that turns amber past the plan. */
function ProgressRow({ label, row }: { label: React.ReactNode; row: PlannedVsActual }) {
  const pct = progressPercent(row);
  const over = row.actual > row.planned;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-slate-800">{label}</span>
        <span className="shrink-0 text-slate-600 tabular-nums">
          <span className={over ? 'font-medium text-amber-700' : 'text-slate-900'}>
            {formatINR(row.actual)}
          </span>{' '}
          of{' '}
          <span className="font-medium text-slate-900" data-testid="planned">
            {formatINR(row.planned, { alwaysPaise: row.planned % 100 !== 0 })}
          </span>
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={over ? 'Over budget' : `${pct}% of plan spent`}
      >
        <div
          className={`h-full rounded-full ${over ? 'bg-amber-500' : 'bg-teal-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BudgetLineForm({
  trip,
  families,
  line,
  initial,
  onSave,
  onDelete,
}: {
  trip: Trip;
  families: TripFamily[];
  line: TripBudgetLine | null;
  initial: BudgetForm;
  onSave: (input: NonNullable<ReturnType<typeof formToBudgetLine>['input']>) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const result = useMemo(
    () => formToBudgetLine(form, families, trip.kidWeight),
    [form, families, trip.kidWeight],
  );
  const active = families.filter((f) => f.active);
  const set = <K extends keyof BudgetForm>(key: K, value: BudgetForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const err = (k: keyof typeof result.errors) => (showErrors ? result.errors[k] : undefined);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!result.input) {
      setShowErrors(true);
      return;
    }
    onSave(result.input);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="budget-form">
      <Field label="Amount (₹)" error={err('amount')}>
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            aria-invalid={!!err('amount')}
            inputMode="decimal"
            autoFocus={!line}
            className={`${inputClass} !py-3 !text-2xl font-semibold`}
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="0"
          />
        )}
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Category</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              name="budget-category"
              checked={form.category === c.value}
              onChange={() => set('category', c.value)}
            >
              {c.emoji} {c.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Field label="What for" hint="Optional" error={err('title')}>
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            className={inputClass}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={`e.g. ${categoryOf(form.category).label}`}
          />
        )}
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Split</legend>
        <div className="flex flex-wrap gap-2">
          {BUDGET_SPLIT_MODES.map((m) => (
            <Chip
              key={m.value}
              name="budget-split"
              checked={form.splitMode === m.value}
              onChange={() => set('splitMode', m.value)}
            >
              {m.label}
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {BUDGET_SPLIT_MODES.find((m) => m.value === form.splitMode)?.hint}
        </p>
      </fieldset>

      {(form.splitMode === 'equal_family' || form.splitMode === 'per_head') && (
        <ParticipantsPicker
          families={active}
          value={form.participants}
          onChange={(v) => set('participants', v)}
          error={err('participants')}
          label="Shared by"
        />
      )}

      {form.splitMode === 'personal' && (
        <Field label="Whose plan" error={err('family')}>
          {(id, d) => (
            <select
              id={id}
              aria-describedby={d}
              className={inputClass}
              value={form.familyId}
              onChange={(e) => set('familyId', e.target.value)}
            >
              {families
                .filter((f) => f.active || f.id === form.familyId)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </select>
          )}
        </Field>
      )}

      {form.splitMode === 'custom' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Each family’s amount (₹)</p>
          {active.map((f) => (
            <label key={f.id} className="flex items-center gap-3">
              <FamilyDot family={f} />
              <span className="flex-1 truncate text-sm text-slate-800">{f.name}</span>
              <input
                inputMode="decimal"
                aria-label={`${f.name} amount`}
                className={`${inputClass} !w-32`}
                value={form.custom[f.id] ?? ''}
                onChange={(e) => set('custom', { ...form.custom, [f.id]: e.target.value })}
                placeholder="0"
              />
            </label>
          ))}
          {result.remainingPaise !== null && result.remainingPaise !== 0 && (
            <p className="text-sm font-medium text-amber-700">
              {result.remainingPaise > 0
                ? `${formatINR(result.remainingPaise, { alwaysPaise: true })} still to assign`
                : `${formatINR(-result.remainingPaise, { alwaysPaise: true })} more than the total`}
            </p>
          )}
        </div>
      )}

      {showErrors && result.errors.split && (
        <p className="text-sm text-red-700" role="alert">
          {result.errors.split}
        </p>
      )}

      {result.preview && (
        <div className="rounded-2xl bg-teal-50 p-4" data-testid="budget-preview">
          <p className="mb-2 text-sm font-medium text-teal-900">Each family’s share</p>
          <ul className="space-y-1">
            {families
              .filter((f) => (result.preview?.[f.id] ?? 0) > 0)
              .map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-sm">
                  <FamilyDot family={f} />
                  <span className="flex-1 truncate text-slate-800">{f.name}</span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {formatINR(result.preview?.[f.id] ?? 0, { alwaysPaise: true })}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit">{line ? 'Save changes' : 'Add to budget'}</Button>
        {onDelete &&
          (confirmDelete ? (
            <Button variant="danger" onClick={onDelete}>
              Yes, delete it
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          ))}
      </div>
    </form>
  );
}
