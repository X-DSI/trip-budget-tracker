// Pure helpers for the expense spreadsheet, "who changed it", and the spending breakdown.
// All money stays in integer paise until it is formatted.

import { paiseToDecimalString, splitExpense, type Family, type Shares } from '../../domain';
import { CATEGORIES, categoryOf, splitLabel, type Category, type TripExpense } from './model';

type NamedFamily = Family & { name?: string };

/** "4 Dec, 9:10 pm" in the trip's time zone. */
export function formatWhen(ms: number, timeZone = 'Asia/Kolkata'): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })
    .format(ms)
    .replace(/\bAM\b/, 'am')
    .replace(/\bPM\b/, 'pm');
}

/** "Added by Anna on 4 Dec, 9:10 pm" plus, if someone else changed it later, who and when. */
export function changeLines(
  e: Pick<TripExpense, 'createdBy' | 'updatedBy' | 'createdAtMs' | 'updatedAtMs'>,
  memberName: (uid: string) => string,
  timeZone?: string,
): string[] {
  const at = (ms?: number) => (ms ? ` on ${formatWhen(ms, timeZone)}` : '');
  const lines = [`Added by ${memberName(e.createdBy)}${at(e.createdAtMs)}`];
  const edited =
    e.updatedBy !== e.createdBy ||
    (e.updatedAtMs != null && e.createdAtMs != null && e.updatedAtMs - e.createdAtMs > 60_000);
  if (edited) lines.push(`Last edited by ${memberName(e.updatedBy)}${at(e.updatedAtMs)}`);
  return lines;
}

function safeShares(e: TripExpense, families: readonly Family[], kidWeight: number): Shares | null {
  try {
    return splitExpense(e, families, kidWeight);
  } catch {
    return null;
  }
}

/** Quote a CSV cell when it needs it; neutralise leading =+-@ so spreadsheets don't run it. */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * Every non-deleted expense as CSV, oldest first, with each family's share in its own column.
 * Starts with a byte-order mark so Excel reads the ₹ and names as UTF-8.
 */
export function expensesToCsv(
  expenses: readonly TripExpense[],
  families: readonly NamedFamily[],
  kidWeight: number,
  memberName: (uid: string) => string,
): string {
  const cols = [...families].sort((a, b) => a.order - b.order);
  const familyName = (id: string) => families.find((f) => f.id === id)?.name ?? 'Unknown family';
  const header = [
    'Date',
    'Title',
    'Category',
    'Amount (₹)',
    'Paid by',
    'Split',
    'Shared by',
    ...cols.map((f) => `${f.name ?? 'Family'} share (₹)`),
    'Note',
    'Added by',
    'Last edited by',
  ];
  const rows = expenses
    .filter((e) => !e.deleted)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0))
    .map((e) => {
      const shares = safeShares(e, families, kidWeight);
      const sharedBy = shares
        ? cols.filter((f) => (shares[f.id] ?? 0) > 0).map((f) => f.name ?? 'Family')
        : [];
      return [
        e.date,
        e.title,
        categoryOf(e.category).label,
        paiseToDecimalString(e.amountPaise),
        familyName(e.paidByFamilyId),
        splitLabel(e.splitMode),
        sharedBy.join(', '),
        ...cols.map((f) => (shares ? paiseToDecimalString(shares[f.id] ?? 0) : '')),
        e.note,
        memberName(e.createdBy),
        memberName(e.updatedBy),
      ];
    });
  return '\uFEFF' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

export interface CategorySpend {
  category: Category;
  totalPaise: number;
  /** Whole-number percentage of all spending (rounded; may not add to exactly 100). */
  percent: number;
  /** Your family's share of this category, if you have a family. */
  minePaise: number | null;
  count: number;
}

/** Spending per category, largest first. Deleted expenses don't count. */
export function spendingByCategory(
  expenses: readonly TripExpense[],
  families: readonly Family[],
  kidWeight: number,
  myFamilyId: string | null,
): { totalPaise: number; rows: CategorySpend[] } {
  const map = new Map<Category, { total: number; mine: number; count: number }>();
  let totalPaise = 0;
  for (const e of expenses) {
    if (e.deleted) continue;
    const key = categoryOf(e.category).value;
    const row = map.get(key) ?? { total: 0, mine: 0, count: 0 };
    row.total += e.amountPaise;
    row.count += 1;
    if (myFamilyId) row.mine += safeShares(e, families, kidWeight)?.[myFamilyId] ?? 0;
    map.set(key, row);
    totalPaise += e.amountPaise;
  }
  const order = (c: Category) => CATEGORIES.findIndex((x) => x.value === c);
  const rows = [...map.entries()]
    .map(([category, r]) => ({
      category,
      totalPaise: r.total,
      percent: totalPaise ? Math.round((r.total / totalPaise) * 100) : 0,
      minePaise: myFamilyId ? r.mine : null,
      count: r.count,
    }))
    .sort((a, b) => b.totalPaise - a.totalPaise || order(a.category) - order(b.category));
  return { totalPaise, rows };
}
