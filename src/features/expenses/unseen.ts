// "New since you last looked": which expenses someone else added or changed after this phone last
// showed the Expenses page. Times are server timestamps, so phone clocks don't matter.

import type { TripExpense } from './model';

export type UnseenKind = 'new' | 'edited';

type Stamped = Pick<
  TripExpense,
  'id' | 'createdBy' | 'updatedBy' | 'createdAtMs' | 'updatedAtMs' | 'deleted'
>;

/** The newest server time among these expenses (0 if none have reached the server). */
export function latestStamp(expenses: readonly Stamped[]): number {
  let max = 0;
  for (const e of expenses) max = Math.max(max, e.createdAtMs ?? 0, e.updatedAtMs ?? 0);
  return max;
}

/**
 * Expenses someone else added (`new`) or edited (`edited`) after `seenAt`. Your own changes,
 * deleted expenses and writes not yet on the server never count. With no `seenAt` (first visit
 * on this phone) nothing is new.
 */
export function unseenExpenses(
  expenses: readonly Stamped[],
  uid: string,
  seenAt: number | null,
): Map<string, UnseenKind> {
  const out = new Map<string, UnseenKind>();
  if (seenAt == null) return out;
  for (const e of expenses) {
    if (e.deleted) continue;
    if (e.createdBy !== uid && (e.createdAtMs ?? 0) > seenAt) out.set(e.id, 'new');
    else if (e.updatedBy !== uid && (e.updatedAtMs ?? 0) > seenAt) out.set(e.id, 'edited');
  }
  return out;
}
