import { useMemo, useState, type FormEvent } from 'react';
import { formatINR, SHARED, splitExpense } from '../../domain';
import { FAMILY_COLOR_CLASSES, type Trip, type TripFamily } from '../trips/model';
import { addExpense, setExpenseDeleted, updateExpense } from './expenses.data';
import {
  CATEGORIES,
  categoryOf,
  expenseToForm,
  formToExpense,
  splitLabel,
  SPLIT_MODES,
  type ExpenseForm,
  type ItemRow,
  type TripExpense,
} from './model';
import { Button, Field, inputClass } from '../../components/ui';
import { readString, writeString } from '../../lib/storage';
import { formatDate } from '../../lib/dates';

const LAST_MODE_KEY = 'tbt.lastSplitMode';

let itemCounter = 0;
const newItem = (familyId: string): ItemRow => ({
  key: `n${++itemCounter}`,
  name: '',
  amount: '',
  familyId,
});

function initialForm(
  expense: TripExpense | null,
  families: TripFamily[],
  myFamilyId: string | null,
  today: string,
): ExpenseForm {
  if (expense) return expenseToForm(expense, families);
  const active = families.filter((f) => f.active);
  const last = readString(LAST_MODE_KEY);
  return {
    amount: '',
    title: '',
    category: 'food',
    paidByFamilyId: myFamilyId ?? active[0]?.id ?? '',
    date: today,
    splitMode: SPLIT_MODES.some((m) => m.value === last)
      ? (last as ExpenseForm['splitMode'])
      : 'equal_family',
    participants: active.map((f) => f.id),
    items: [newItem(SHARED)],
    extras: '',
    custom: {},
    note: '',
  };
}

export function ExpenseSheetBody({
  trip,
  families,
  myFamilyId,
  expense,
  canEdit,
  uid,
  today,
  memberName,
  onDone,
}: {
  trip: Trip;
  families: TripFamily[];
  myFamilyId: string | null;
  expense: TripExpense | null;
  canEdit: boolean;
  uid: string;
  today: string;
  memberName: (uid: string) => string;
  onDone: () => void;
}) {
  if (expense && !canEdit) {
    return (
      <ExpenseDetails trip={trip} families={families} expense={expense} memberName={memberName} />
    );
  }
  return (
    <ExpenseFormView
      trip={trip}
      families={families}
      myFamilyId={myFamilyId}
      expense={expense}
      uid={uid}
      today={today}
      onDone={onDone}
    />
  );
}

function ExpenseFormView({
  trip,
  families,
  myFamilyId,
  expense,
  uid,
  today,
  onDone,
}: {
  trip: Trip;
  families: TripFamily[];
  myFamilyId: string | null;
  expense: TripExpense | null;
  uid: string;
  today: string;
  onDone: () => void;
}) {
  const [form, setForm] = useState<ExpenseForm>(() =>
    initialForm(expense, families, myFamilyId, today),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const result = useMemo(
    () => formToExpense(form, families, trip.kidWeight),
    [form, families, trip.kidWeight],
  );
  const active = families.filter((f) => f.active);
  const set = <K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const err = (k: keyof typeof result.errors) => (showErrors ? result.errors[k] : undefined);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!result.input) {
      setShowErrors(true);
      return;
    }
    if (expense) updateExpense(trip.id, expense.id, uid, result.input);
    else addExpense(trip.id, uid, result.input);
    writeString(LAST_MODE_KEY, form.splitMode);
    onDone();
  }

  const showsParticipants = form.splitMode === 'equal_family' || form.splitMode === 'per_head';

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="expense-form">
      <Field label="Amount (₹)" error={err('amount')}>
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            aria-invalid={!!err('amount')}
            inputMode="decimal"
            autoFocus={!expense}
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
              name="category"
              checked={form.category === c.value}
              onChange={() => set('category', c.value)}
            >
              {c.emoji} {c.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
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
        <Field label="Paid by" error={err('paidBy')}>
          {(id, d) => (
            <select
              id={id}
              aria-describedby={d}
              className={inputClass}
              value={form.paidByFamilyId}
              onChange={(e) => set('paidByFamilyId', e.target.value)}
            >
              {families
                .filter((f) => f.active || f.id === form.paidByFamilyId)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </select>
          )}
        </Field>
        <Field label="Date" error={err('date')}>
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
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Split</legend>
        <div className="flex flex-wrap gap-2">
          {SPLIT_MODES.map((m) => (
            <Chip
              key={m.value}
              name="splitMode"
              checked={form.splitMode === m.value}
              onChange={() => set('splitMode', m.value)}
            >
              {m.label}
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {SPLIT_MODES.find((m) => m.value === form.splitMode)?.hint}
        </p>
      </fieldset>

      {showsParticipants && (
        <ParticipantsPicker
          families={active}
          value={form.participants}
          onChange={(v) => set('participants', v)}
          error={err('participants')}
          label="Shared by"
        />
      )}

      {form.splitMode === 'itemized' && (
        <ItemsEditor
          families={active}
          form={form}
          setForm={setForm}
          remainingPaise={result.remainingPaise}
        />
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
          <Remaining paise={result.remainingPaise} />
        </div>
      )}

      {showErrors && result.errors.split && (
        <p className="text-sm text-red-700" role="alert">
          {result.errors.split}
        </p>
      )}
      {form.splitMode === 'itemized' && form.items.some((i) => i.familyId === SHARED) && (
        <ParticipantsPicker
          families={active}
          value={form.participants}
          onChange={(v) => set('participants', v)}
          error={err('participants')}
          label="Shared dishes split per head between"
        />
      )}

      <SharePreview families={families} preview={result.preview} />

      <Field label="Note" hint="Optional" error={err('note')}>
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

      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit">{expense ? 'Save changes' : 'Add expense'}</Button>
        {expense &&
          (confirmDelete ? (
            <Button
              variant="danger"
              onClick={() => {
                setExpenseDeleted(trip.id, expense.id, uid, true);
                onDone();
              }}
            >
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

export function Chip({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`cursor-pointer rounded-xl px-3 py-2 text-sm ring-1 select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 ${
        checked ? 'bg-teal-50 text-teal-800 ring-teal-400' : 'text-slate-700 ring-slate-300'
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  );
}

export function FamilyDot({ family }: { family: TripFamily }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${FAMILY_COLOR_CLASSES[family.color].dot}`}
    />
  );
}

export function ParticipantsPicker({
  families,
  value,
  onChange,
  error,
  label,
}: {
  families: TripFamily[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  label: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-slate-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {families.map((f) => {
          const on = value.includes(f.id);
          return (
            <label
              key={f.id}
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 select-none ${
                on ? 'bg-slate-900 text-white ring-slate-900' : 'text-slate-700 ring-slate-300'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={on}
                onChange={() => onChange(on ? value.filter((id) => id !== f.id) : [...value, f.id])}
              />
              <FamilyDot family={f} />
              {f.name}
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </fieldset>
  );
}

function ItemsEditor({
  families,
  form,
  setForm,
  remainingPaise,
}: {
  families: TripFamily[];
  form: ExpenseForm;
  setForm: React.Dispatch<React.SetStateAction<ExpenseForm>>;
  remainingPaise: number | null;
}) {
  const update = (key: string, patch: Partial<ItemRow>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((i) => (i.key === key ? { ...i, ...patch } : i)),
    }));

  return (
    <div className="space-y-2" data-testid="items-editor">
      <p className="text-sm font-medium text-slate-700">Dishes</p>
      {form.items.map((item, n) => (
        <div key={item.key} className="grid grid-cols-[1fr_6rem] gap-2 rounded-xl bg-slate-50 p-2">
          <input
            aria-label={`Dish ${n + 1}`}
            className={inputClass}
            value={item.name}
            onChange={(e) => update(item.key, { name: e.target.value })}
            placeholder="e.g. Biryani ×2"
          />
          <input
            aria-label={`Dish ${n + 1} amount`}
            inputMode="decimal"
            className={inputClass}
            value={item.amount}
            onChange={(e) => update(item.key, { amount: e.target.value })}
            placeholder="₹"
          />
          <select
            aria-label={`Who had dish ${n + 1}`}
            className={inputClass}
            value={item.familyId}
            onChange={(e) => update(item.key, { familyId: e.target.value })}
          >
            <option value={SHARED}>Shared by everyone</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-xl text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            disabled={form.items.length === 1}
            onClick={() =>
              setForm((f) => ({ ...f, items: f.items.filter((i) => i.key !== item.key) }))
            }
          >
            Remove
          </button>
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          setForm((f) => ({
            ...f,
            items: [...f.items, newItem(f.items[f.items.length - 1]?.familyId ?? SHARED)],
          }))
        }
      >
        Add dish
      </Button>
      <label className="flex items-center gap-3 pt-2">
        <span className="flex-1 text-sm text-slate-700">Tax, service charge and tip (₹)</span>
        <input
          inputMode="decimal"
          aria-label="Tax, service charge and tip"
          className={`${inputClass} !w-32`}
          value={form.extras}
          onChange={(e) => setForm((f) => ({ ...f, extras: e.target.value }))}
          placeholder="0"
        />
      </label>
      <Remaining paise={remainingPaise} />
    </div>
  );
}

function Remaining({ paise }: { paise: number | null }) {
  if (paise === null) return null;
  if (paise === 0) {
    return <p className="text-sm font-medium text-teal-700">✓ Adds up to the bill</p>;
  }
  return (
    <p className="text-sm font-medium text-amber-700" data-testid="remaining">
      {paise > 0
        ? `${formatINR(paise, { alwaysPaise: true })} still to assign`
        : `${formatINR(-paise, { alwaysPaise: true })} more than the bill`}
    </p>
  );
}

function SharePreview({
  families,
  preview,
}: {
  families: TripFamily[];
  preview: Record<string, number> | null;
}) {
  if (!preview) return null;
  const rows = families.filter((f) => (preview[f.id] ?? 0) > 0);
  return (
    <div className="rounded-2xl bg-teal-50 p-4" data-testid="share-preview">
      <p className="mb-2 text-sm font-medium text-teal-900">Each family pays</p>
      <ul className="space-y-1">
        {rows.map((f) => (
          <li key={f.id} className="flex items-center gap-2 text-sm">
            <FamilyDot family={f} />
            <span className="flex-1 truncate text-slate-800">{f.name}</span>
            <span className="font-medium text-slate-900 tabular-nums">
              {formatINR(preview[f.id] ?? 0, { alwaysPaise: true })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Read-only view for people who can't edit this expense. */
function ExpenseDetails({
  trip,
  families,
  expense,
  memberName,
}: {
  trip: Trip;
  families: TripFamily[];
  expense: TripExpense;
  memberName: (uid: string) => string;
}) {
  let shares: Record<string, number> | null;
  try {
    shares = splitExpense(expense, families, trip.kidWeight);
  } catch {
    shares = null;
  }
  const payer = families.find((f) => f.id === expense.paidByFamilyId);
  return (
    <div className="space-y-4" data-testid="expense-details">
      <div>
        <p className="text-3xl font-semibold text-slate-900">{formatINR(expense.amountPaise)}</p>
        <p className="text-slate-600">
          {categoryOf(expense.category).emoji} {expense.title} · {formatDate(expense.date)}
        </p>
      </div>
      <p className="text-sm text-slate-700">
        Paid by <strong>{payer?.name ?? 'a family'}</strong> · {splitLabel(expense.splitMode)}
      </p>
      {expense.items && expense.items.length > 0 && (
        <ul className="space-y-1 text-sm text-slate-700">
          {expense.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-3">
              <span className="truncate">
                {i.name} ·{' '}
                {i.familyId === SHARED
                  ? 'shared'
                  : (families.find((f) => f.id === i.familyId)?.name ?? '')}
              </span>
              <span className="tabular-nums">
                {formatINR(i.amountPaise, { alwaysPaise: true })}
              </span>
            </li>
          ))}
        </ul>
      )}
      <SharePreview families={families} preview={shares} />
      {expense.note && <p className="text-sm text-slate-600">{expense.note}</p>}
      <p className="text-xs text-slate-500">
        Added by {memberName(expense.createdBy)}
        {expense.updatedBy !== expense.createdBy && ` · edited by ${memberName(expense.updatedBy)}`}
        . Only they or an organiser can change it.
      </p>
    </div>
  );
}
