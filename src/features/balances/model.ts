// Balances, suggested payments and UPI links for the Balances tab. Pure: the maths is in
// src/domain; this only guards against bad documents and shapes the result for the screen.

import {
  balances,
  formatINR,
  isValidUpiId,
  splitExpense,
  suggestSettlements,
  toPaise,
  upiLink,
  type Balances,
  type Expense,
  type Family,
  type Payment,
  type Settlement,
} from '../../domain';
import { isValidDate } from '../../lib/dates';

export type SettlementMethod = 'upi' | 'cash' | 'other';

export const SETTLEMENT_METHODS: { value: SettlementMethod; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

/** A saved settlement, as the app reads it. */
export interface TripSettlement extends Settlement {
  date: string;
  method: SettlementMethod;
  note: string;
  createdBy: string;
  updatedBy: string;
  pending: boolean;
}

export type SettlementInput = Pick<
  TripSettlement,
  'fromFamilyId' | 'toFamilyId' | 'amountPaise' | 'date' | 'method' | 'note'
>;

export interface TripBalances {
  balances: Balances;
  payments: Payment[];
  /** Expenses or settlements left out because they can't be split (e.g. an unknown family). */
  skipped: number;
}

/**
 * Balances from whatever has synced so far. A document that refers to a family this device
 * hasn't loaded (or that is malformed) is skipped instead of breaking the whole screen.
 */
export function tripBalances(
  expenses: readonly Expense[],
  settlements: readonly Settlement[],
  families: readonly Family[],
  kidWeight: number,
): TripBalances {
  const known = new Set(families.map((f) => f.id));
  let skipped = 0;
  const okExpenses = expenses.filter((e) => {
    if (e.deleted) return false;
    try {
      splitExpense(e, families, kidWeight);
      return true;
    } catch {
      skipped++;
      return false;
    }
  });
  const okSettlements = settlements.filter((s) => {
    if (s.deleted) return false;
    const ok =
      known.has(s.fromFamilyId) &&
      known.has(s.toFamilyId) &&
      s.fromFamilyId !== s.toFamilyId &&
      Number.isSafeInteger(s.amountPaise) &&
      s.amountPaise > 0;
    if (!ok) skipped++;
    return ok;
  });
  const result = balances(okExpenses, okSettlements, families, kidWeight);
  return { balances: result, payments: suggestSettlements(result, families), skipped };
}

/** "owes ₹1,200" / "gets back ₹1,200" / "is settled". */
export function netLabel(net: number): string {
  if (net < 0) return `owes ${formatINR(-net, { alwaysPaise: net % 100 !== 0 })}`;
  if (net > 0) return `gets back ${formatINR(net, { alwaysPaise: net % 100 !== 0 })}`;
  return 'is settled';
}

/** The same, from your own family's point of view. */
export function yourNetLabel(net: number): string {
  if (net < 0) return `You owe ${formatINR(-net, { alwaysPaise: net % 100 !== 0 })}`;
  if (net > 0) return `You get back ${formatINR(net, { alwaysPaise: net % 100 !== 0 })}`;
  return 'You’re all square';
}

/**
 * A `upi://pay` link for a suggested payment, or null when the receiving family has no valid
 * UPI ID. The link carries no secrets: it only opens the payer's own UPI app, pre-filled.
 */
export function paymentLink(
  payment: Payment,
  families: readonly (Family & { name: string; upiId: string | null })[],
  tripName: string,
): string | null {
  const to = families.find((f) => f.id === payment.toFamilyId);
  const from = families.find((f) => f.id === payment.fromFamilyId);
  if (!to?.upiId || !isValidUpiId(to.upiId) || payment.amountPaise <= 0) return null;
  return upiLink({
    upiId: to.upiId,
    payeeName: to.name,
    amountPaise: payment.amountPaise,
    note: `${tripName}${from ? ` · ${from.name}` : ''}`,
  });
}

/** Who may record a payment: an adult whose family pays or receives it. */
export function canRecordPayment(
  payment: Pick<Payment, 'fromFamilyId' | 'toFamilyId'>,
  myFamilyId: string | null,
): boolean {
  return !!myFamilyId && (payment.fromFamilyId === myFamilyId || payment.toFamilyId === myFamilyId);
}

/** Who may delete a recorded payment: whoever recorded it, or an organiser. */
export function canDeleteSettlement(
  s: Pick<TripSettlement, 'createdBy'>,
  uid: string,
  organizer: boolean,
): boolean {
  return organizer || s.createdBy === uid;
}

export interface PaymentForm {
  amount: string;
  method: SettlementMethod;
  date: string;
  note: string;
}

/** Turn the "Mark as paid" form into a settlement, or say what's wrong. */
export function formToSettlement(
  form: PaymentForm,
  payment: Pick<Payment, 'fromFamilyId' | 'toFamilyId'>,
): { input?: SettlementInput; error?: string } {
  let amountPaise: number;
  try {
    amountPaise = toPaise(form.amount);
  } catch {
    return { error: 'Enter the amount paid, e.g. 1200.' };
  }
  if (amountPaise <= 0) return { error: 'Enter the amount paid, e.g. 1200.' };
  if (!isValidDate(form.date)) return { error: 'Pick the date it was paid.' };
  if (form.note.length > 200) return { error: 'Keep the note under 200 characters.' };
  return {
    input: {
      fromFamilyId: payment.fromFamilyId,
      toFamilyId: payment.toFamilyId,
      amountPaise,
      date: form.date,
      method: form.method,
      note: form.note.trim(),
    },
  };
}

/** Newest date first; the id only keeps the order stable within a day. */
export function sortSettlements<T extends { date: string; id: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
