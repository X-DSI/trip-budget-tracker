// Expense form ↔ domain mapping. Pure: all money maths goes through src/domain.

import {
  MoneyError,
  SHARED,
  splitExpense,
  toPaise,
  type Expense,
  type Family,
  type Shares,
  type SplitMode,
} from '../../domain';
import { isValidDate } from '../../lib/dates';

export const CATEGORIES = [
  { value: 'fuel', label: 'Fuel', emoji: '⛽' },
  { value: 'tolls', label: 'Tolls', emoji: '🛣️' },
  { value: 'food', label: 'Food', emoji: '🍛' },
  { value: 'stay', label: 'Stay', emoji: '🏨' },
  { value: 'tickets', label: 'Tickets', emoji: '🎟️' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'transport', label: 'Transport', emoji: '🚕' },
  { value: 'other', label: 'Other', emoji: '🧾' },
] as const;
export type Category = (typeof CATEGORIES)[number]['value'];

export function categoryOf(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

export const SPLIT_MODES: { value: SplitMode; label: string; hint: string }[] = [
  { value: 'equal_family', label: 'Equal per family', hint: 'Fuel, tolls, parking' },
  { value: 'per_head', label: 'Per head', hint: 'Tickets, a shared meal' },
  { value: 'itemized', label: 'Dish by dish', hint: 'Each family pays for what it had' },
  { value: 'custom', label: 'Custom', hint: 'Type each family’s amount' },
  { value: 'personal', label: 'Personal', hint: 'Just the payer’s family' },
];

export function splitLabel(mode: SplitMode): string {
  return SPLIT_MODES.find((m) => m.value === mode)?.label ?? mode;
}

/** A saved expense, as the app reads it. */
export interface TripExpense extends Expense {
  title: string;
  category: Category;
  date: string;
  note: string;
  createdBy: string;
  updatedBy: string;
  /** Not yet acknowledged by the server. */
  pending: boolean;
}

/** What gets written (besides timestamps and who). */
export type ExpenseInput = Omit<
  TripExpense,
  'id' | 'createdBy' | 'updatedBy' | 'pending' | 'deleted'
>;

export interface ItemRow {
  key: string;
  name: string;
  amount: string;
  familyId: string;
}

export interface ExpenseForm {
  amount: string;
  title: string;
  category: Category;
  paidByFamilyId: string;
  date: string;
  splitMode: SplitMode;
  /** Families sharing it (equal, per head, shared dishes). */
  participants: string[];
  items: ItemRow[];
  extras: string;
  custom: Record<string, string>;
  note: string;
}

export type FormErrors = Partial<
  Record<'amount' | 'title' | 'paidBy' | 'date' | 'participants' | 'split' | 'note', string>
>;

export interface FormResult {
  input?: ExpenseInput;
  errors: FormErrors;
  /** Live preview of each family's share, when the split is valid so far. */
  preview: Shares | null;
  /** Paise still to assign in itemized/custom splits (bill minus what's assigned). */
  remainingPaise: number | null;
}

function paiseOrNull(text: string): number | null {
  if (!text.trim()) return null;
  try {
    return toPaise(text);
  } catch {
    return null;
  }
}

/** Parse optional money: blank → 0, invalid → undefined. */
function optionalPaise(text: string): number | undefined {
  if (!text.trim()) return 0;
  try {
    return toPaise(text);
  } catch {
    return undefined;
  }
}

export function formToExpense(
  form: ExpenseForm,
  families: Family[],
  kidWeight: number,
): FormResult {
  const errors: FormErrors = {};
  const amount = paiseOrNull(form.amount);
  if (amount === null || amount === 0) errors.amount = 'Enter the amount, e.g. 1250 or 1,250.50.';

  const activeIds = families.filter((f) => f.active).map((f) => f.id);
  if (!families.some((f) => f.id === form.paidByFamilyId)) errors.paidBy = 'Choose who paid.';
  if (!isValidDate(form.date)) errors.date = 'Pick a date.';
  if (form.title.trim().length > 100) errors.title = 'Keep the title under 100 characters.';
  if (form.note.length > 500) errors.note = 'Keep the note under 500 characters.';

  const usesParticipants =
    form.splitMode === 'equal_family' ||
    form.splitMode === 'per_head' ||
    (form.splitMode === 'itemized' && form.items.some((i) => i.familyId === SHARED));
  if (usesParticipants && form.participants.length === 0) {
    errors.participants = 'Pick at least one family to share it.';
  }
  // Store "everyone active" as an empty list, so families added later are included.
  const participants =
    form.participants.length === activeIds.length &&
    activeIds.every((id) => form.participants.includes(id))
      ? []
      : [...form.participants];

  let remainingPaise: number | null = null;
  const expense: Expense & Partial<ExpenseInput> = {
    id: 'draft',
    amountPaise: amount ?? 0,
    paidByFamilyId: form.paidByFamilyId,
    splitMode: form.splitMode,
    participants,
  };

  if (form.splitMode === 'itemized') {
    const items = form.items.filter((i) => i.name.trim() || i.amount.trim());
    const parsed = items.map((i) => ({
      name: i.name.trim() || 'Item',
      amountPaise: optionalPaise(i.amount),
      familyId: i.familyId,
    }));
    const extras = optionalPaise(form.extras);
    if (parsed.some((i) => i.amountPaise === undefined) || extras === undefined) {
      errors.split = 'Check the item amounts.';
    } else if (parsed.length === 0) {
      errors.split = 'Add the dishes and who had them.';
    } else {
      const assigned = parsed.reduce((s, i) => s + (i.amountPaise ?? 0), 0) + extras;
      remainingPaise = (amount ?? 0) - assigned;
      if (amount !== null && remainingPaise !== 0) {
        errors.split =
          remainingPaise > 0
            ? 'Some of the bill isn’t assigned yet.'
            : 'The items add up to more than the bill.';
      }
      expense.items = parsed.map((i) => ({ ...i, amountPaise: i.amountPaise ?? 0 }));
      expense.extrasPaise = extras;
    }
  }

  if (form.splitMode === 'custom') {
    const shares: Record<string, number> = {};
    let bad = false;
    for (const id of activeIds) {
      const v = optionalPaise(form.custom[id] ?? '');
      if (v === undefined) bad = true;
      else if (v > 0) shares[id] = v;
    }
    if (bad) {
      errors.split = 'Check the amounts.';
    } else {
      remainingPaise = (amount ?? 0) - Object.values(shares).reduce((a, b) => a + b, 0);
      if (amount !== null && remainingPaise !== 0) {
        errors.split =
          remainingPaise > 0
            ? 'Some of the bill isn’t assigned yet.'
            : 'That’s more than the bill.';
      }
      expense.customShares = shares;
    }
  }

  let preview: Shares | null = null;
  if (amount && !errors.paidBy && !errors.participants && !errors.split) {
    try {
      preview = splitExpense(expense, families, kidWeight);
    } catch (e) {
      if (!(e instanceof MoneyError)) throw e;
      errors.split = e.message;
    }
  }

  if (Object.keys(errors).length > 0 || amount === null) {
    return { errors, preview, remainingPaise };
  }

  const input: ExpenseInput = {
    title: form.title.trim() || categoryOf(form.category).label,
    category: form.category,
    amountPaise: amount,
    paidByFamilyId: form.paidByFamilyId,
    date: form.date,
    splitMode: form.splitMode,
    participants,
    note: form.note.trim(),
  };
  if (form.splitMode === 'itemized') {
    input.items = expense.items;
    input.extrasPaise = expense.extrasPaise;
  }
  if (form.splitMode === 'custom') input.customShares = expense.customShares;
  return { input, errors, preview, remainingPaise };
}

/** Fill the form from a saved expense, for editing. */
export function expenseToForm(e: TripExpense, families: Family[]): ExpenseForm {
  const activeIds = families.filter((f) => f.active).map((f) => f.id);
  const rupees = (p: number) => (p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2));
  return {
    amount: rupees(e.amountPaise),
    title: e.title,
    category: e.category,
    paidByFamilyId: e.paidByFamilyId,
    date: e.date,
    splitMode: e.splitMode,
    participants: e.participants && e.participants.length > 0 ? [...e.participants] : activeIds,
    items: (e.items ?? []).map((i, n) => ({
      key: `i${n}`,
      name: i.name,
      amount: rupees(i.amountPaise),
      familyId: i.familyId,
    })),
    extras: e.extrasPaise ? rupees(e.extrasPaise) : '',
    custom: Object.fromEntries(
      Object.entries(e.customShares ?? {}).map(([id, p]) => [id, rupees(p)]),
    ),
    note: e.note,
  };
}

export function canEditExpense(e: Pick<TripExpense, 'createdBy'>, uid: string, organizer: boolean) {
  return organizer || e.createdBy === uid;
}

/** Group expenses by date, newest day first, newest entries first within a day. */
export function groupByDay<T extends { date: string }>(list: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const e of list) map.set(e.date, [...(map.get(e.date) ?? []), e]);
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}
