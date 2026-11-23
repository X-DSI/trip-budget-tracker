// Balances between families and the fewest payments to settle them
// (docs/adr/2026-11-23-expenses-are-the-source-of-truth.md: computed, never stored).

import { assertPaise } from './money';
import { DEFAULT_KID_WEIGHT, sortFamilies, splitExpense, SplitError } from './split';
import type { Expense, Family, FamilyId, Settlement } from './types';

export interface FamilyBalance {
  /** Paid for expenses (including personal ones). */
  paid: number;
  /** This family's share of expenses (including personal ones). */
  share: number;
  /** Settlement payments sent to other families. */
  sent: number;
  /** Settlement payments received from other families. */
  received: number;
  /** Positive: others owe this family. Negative: this family owes others. */
  net: number;
}

export type Balances = Record<FamilyId, FamilyBalance>;

const empty = (): FamilyBalance => ({ paid: 0, share: 0, sent: 0, received: 0, net: 0 });

export function balances(
  expenses: readonly Expense[],
  settlements: readonly Settlement[],
  families: readonly Family[],
  kidWeight = DEFAULT_KID_WEIGHT,
): Balances {
  const result: Balances = {};
  const known = new Set(families.map((f) => f.id));
  const row = (id: FamilyId) => {
    if (!known.has(id)) throw new SplitError(`unknown family "${id}"`);
    return (result[id] ??= empty());
  };
  // Every active family appears, even with nothing spent yet.
  for (const f of families) if (f.active) row(f.id);

  for (const expense of expenses) {
    if (expense.deleted) continue;
    row(expense.paidByFamilyId).paid += expense.amountPaise;
    const shares = splitExpense(expense, families, kidWeight);
    for (const [id, paise] of Object.entries(shares)) row(id).share += paise;
  }

  for (const s of settlements) {
    if (s.deleted) continue;
    assertPaise(s.amountPaise, 'settlement');
    if (s.fromFamilyId === s.toFamilyId) throw new SplitError('a family cannot pay itself');
    row(s.fromFamilyId).sent += s.amountPaise;
    row(s.toFamilyId).received += s.amountPaise;
  }

  for (const b of Object.values(result)) b.net = b.paid - b.share + b.sent - b.received;
  return result;
}

export interface Payment {
  fromFamilyId: FamilyId;
  toFamilyId: FamilyId;
  amountPaise: number;
}

/**
 * Greedy settle-up: repeatedly match the family that owes the most with the family that is owed
 * the most. Each payment clears at least one family, so n families need at most n − 1 payments.
 * Ties are broken by the families' stable order when given, otherwise by id.
 */
export function suggestSettlements(
  balanceByFamily: Balances,
  families: readonly Pick<Family, 'id' | 'order'>[] = [],
): Payment[] {
  const orderOf = new Map(sortFamilies(families).map((f, i) => [f.id, i]));
  const rank = (id: FamilyId) => orderOf.get(id) ?? Number.MAX_SAFE_INTEGER;
  const byAmountThenOrder = (a: [FamilyId, number], b: [FamilyId, number]) =>
    b[1] - a[1] || rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]);

  const debtors: [FamilyId, number][] = [];
  const creditors: [FamilyId, number][] = [];
  for (const [id, { net }] of Object.entries(balanceByFamily)) {
    if (net < 0) debtors.push([id, -net]);
    else if (net > 0) creditors.push([id, net]);
  }

  const payments: Payment[] = [];
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byAmountThenOrder);
    creditors.sort(byAmountThenOrder);
    const debtor = debtors[0]!;
    const creditor = creditors[0]!;
    const amount = Math.min(debtor[1], creditor[1]);
    payments.push({ fromFamilyId: debtor[0], toFamilyId: creditor[0], amountPaise: amount });
    debtor[1] -= amount;
    creditor[1] -= amount;
    if (debtor[1] === 0) debtors.shift();
    if (creditor[1] === 0) creditors.shift();
  }
  return payments;
}
