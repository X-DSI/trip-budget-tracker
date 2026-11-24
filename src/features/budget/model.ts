// Budget form ↔ domain mapping, and budget vs actual. Pure: split maths goes through src/domain.

import {
  familyBudgetShares,
  MoneyError,
  splitExpense,
  toPaise,
  type BudgetLine,
  type Expense,
  type Family,
  type Shares,
} from '../../domain';
import { CATEGORIES, categoryOf, type Category } from '../expenses/model';

export type BudgetSplitMode = BudgetLine['splitMode'];

export const BUDGET_SPLIT_MODES: { value: BudgetSplitMode; label: string; hint: string }[] = [
  { value: 'equal_family', label: 'Equal per family', hint: 'Fuel, tolls, a shared villa' },
  { value: 'per_head', label: 'Per head', hint: 'Meals, tickets, rooms per person' },
  { value: 'custom', label: 'Custom', hint: 'Type each family’s amount' },
  { value: 'personal', label: 'One family', hint: 'Only this family’s own plan' },
];

/** A saved budget line, as the app reads it. */
export interface TripBudgetLine extends BudgetLine {
  title: string;
  category: Category;
  order: number;
  createdBy: string;
}

/** What gets written (besides timestamps and who). */
export interface BudgetLineInput {
  title: string;
  category: Category;
  amountPaise: number;
  splitMode: BudgetSplitMode;
  participants: string[];
  customShares?: Record<string, number>;
  familyId: string | null;
}

export interface BudgetForm {
  amount: string;
  title: string;
  category: Category;
  splitMode: BudgetSplitMode;
  participants: string[];
  custom: Record<string, string>;
  familyId: string;
}

export type BudgetFormErrors = Partial<
  Record<'amount' | 'title' | 'participants' | 'family' | 'split', string>
>;

export interface BudgetFormResult {
  input?: BudgetLineInput;
  errors: BudgetFormErrors;
  preview: Shares | null;
  remainingPaise: number | null;
}

function optionalPaise(text: string): number | undefined {
  if (!text.trim()) return 0;
  try {
    return toPaise(text);
  } catch {
    return undefined;
  }
}

export function emptyBudgetForm(families: Family[], myFamilyId: string | null): BudgetForm {
  const active = families.filter((f) => f.active);
  return {
    amount: '',
    title: '',
    category: 'stay',
    splitMode: 'per_head',
    participants: active.map((f) => f.id),
    custom: {},
    familyId: myFamilyId ?? active[0]?.id ?? '',
  };
}

export function formToBudgetLine(
  form: BudgetForm,
  families: Family[],
  kidWeight: number,
): BudgetFormResult {
  const errors: BudgetFormErrors = {};
  const amount = form.amount.trim() ? optionalPaise(form.amount) : undefined;
  if (!amount) errors.amount = 'Enter the amount, e.g. 12000.';
  if (form.title.trim().length > 100) errors.title = 'Keep the title under 100 characters.';

  const activeIds = families.filter((f) => f.active).map((f) => f.id);
  const usesParticipants = form.splitMode === 'equal_family' || form.splitMode === 'per_head';
  if (usesParticipants && form.participants.length === 0) {
    errors.participants = 'Pick at least one family.';
  }
  // "Everyone active" is stored as an empty list, so families added later are included.
  const participants =
    !usesParticipants ||
    (form.participants.length === activeIds.length &&
      activeIds.every((id) => form.participants.includes(id)))
      ? []
      : [...form.participants];

  const familyId = form.splitMode === 'personal' ? form.familyId : null;
  if (familyId !== null && !families.some((f) => f.id === familyId)) {
    errors.family = 'Choose whose plan this is.';
  }

  let customShares: Record<string, number> | undefined;
  let remainingPaise: number | null = null;
  if (form.splitMode === 'custom') {
    customShares = {};
    let bad = false;
    for (const id of activeIds) {
      const v = optionalPaise(form.custom[id] ?? '');
      if (v === undefined) bad = true;
      else if (v > 0) customShares[id] = v;
    }
    if (bad) {
      errors.split = 'Check the amounts.';
    } else {
      remainingPaise = (amount ?? 0) - Object.values(customShares).reduce((a, b) => a + b, 0);
      if (amount && remainingPaise !== 0) {
        errors.split =
          remainingPaise > 0 ? 'Some of it isn’t assigned yet.' : 'That’s more than the total.';
      }
    }
  }

  let preview: Shares | null = null;
  if (amount && !errors.participants && !errors.family && !errors.split) {
    try {
      preview = familyBudgetShares(
        [
          {
            id: 'draft',
            amountPaise: amount,
            splitMode: form.splitMode,
            participants,
            customShares,
            familyId: familyId ?? undefined,
          },
        ],
        families,
        kidWeight,
      ).byFamily;
    } catch (e) {
      if (!(e instanceof MoneyError)) throw e;
      errors.split = e.message;
    }
  }

  if (Object.keys(errors).length > 0 || !amount) return { errors, preview, remainingPaise };

  const input: BudgetLineInput = {
    title: form.title.trim() || categoryOf(form.category).label,
    category: form.category,
    amountPaise: amount,
    splitMode: form.splitMode,
    participants,
    familyId,
  };
  if (customShares) input.customShares = customShares;
  return { input, errors, preview, remainingPaise };
}

export function budgetLineToForm(line: TripBudgetLine, families: Family[]): BudgetForm {
  const activeIds = families.filter((f) => f.active).map((f) => f.id);
  const rupees = (p: number) => (p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2));
  return {
    amount: rupees(line.amountPaise),
    title: line.title,
    category: line.category,
    splitMode: line.splitMode,
    participants:
      line.participants && line.participants.length > 0 ? [...line.participants] : activeIds,
    custom: Object.fromEntries(
      Object.entries(line.customShares ?? {}).map(([id, p]) => [id, rupees(p)]),
    ),
    familyId: line.familyId ?? activeIds[0] ?? '',
  };
}

export interface PlannedVsActual {
  planned: number;
  actual: number;
}

export interface BudgetVsActual {
  planned: number;
  actual: number;
  /** Every category that has a plan or spending, in the usual category order. */
  byCategory: (PlannedVsActual & { category: Category })[];
  /** Each family's planned share vs its share of real spending. */
  byFamily: Record<string, PlannedVsActual>;
  /** Lines or expenses that couldn't be split (e.g. a family that no longer exists). */
  skipped: number;
}

/**
 * Plan vs reality. Actual spending per family is each family's share of the expenses (not what it
 * happened to pay), so it compares like for like with the planned share. Settlements don't count.
 */
export function budgetVsActual(
  lines: readonly TripBudgetLine[],
  expenses: readonly (Expense & { category: string })[],
  families: readonly Family[],
  kidWeight: number,
): BudgetVsActual {
  const byFamily: Record<string, PlannedVsActual> = {};
  const fam = (id: string) => (byFamily[id] ??= { planned: 0, actual: 0 });
  for (const f of families) if (f.active) fam(f.id);
  const cats = new Map<Category, PlannedVsActual>();
  const cat = (c: string) => {
    const key = categoryOf(c).value;
    let row = cats.get(key);
    if (!row) cats.set(key, (row = { planned: 0, actual: 0 }));
    return row;
  };
  let planned = 0;
  let actual = 0;
  let skipped = 0;

  for (const line of lines) {
    let shares: Shares;
    try {
      shares = familyBudgetShares([line], families, kidWeight).byFamily;
    } catch {
      skipped++;
      continue;
    }
    planned += line.amountPaise;
    cat(line.category).planned += line.amountPaise;
    for (const [id, paise] of Object.entries(shares)) if (paise) fam(id).planned += paise;
  }

  for (const e of expenses) {
    if (e.deleted) continue;
    let shares: Shares;
    try {
      shares = splitExpense(e, families, kidWeight);
    } catch {
      skipped++;
      continue;
    }
    actual += e.amountPaise;
    cat(e.category).actual += e.amountPaise;
    for (const [id, paise] of Object.entries(shares)) if (paise) fam(id).actual += paise;
  }

  const byCategory = CATEGORIES.flatMap((c) => {
    const row = cats.get(c.value);
    return row ? [{ category: c.value, ...row }] : [];
  });
  return { planned, actual, byCategory, byFamily, skipped };
}

/** Width of a progress bar, 0–100, for `actual` against `planned`. */
export function progressPercent({ planned, actual }: PlannedVsActual): number {
  if (planned <= 0) return actual > 0 ? 100 : 0;
  return Math.min(100, Math.round((actual / planned) * 100));
}

export function sortBudgetLines<T extends { order: number; id: string }>(lines: T[]): T[] {
  return [...lines].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
