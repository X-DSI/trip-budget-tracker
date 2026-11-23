// Planned spending per family, using the same split rules as real expenses.

import { DEFAULT_KID_WEIGHT, splitExpense, SplitError } from './split';
import type { Family, FamilyId, SplitMode } from './types';

export interface BudgetLine {
  id: string;
  title?: string;
  category?: string;
  amountPaise: number;
  /** `itemized` makes no sense for a plan, so it isn't allowed here. */
  splitMode: Exclude<SplitMode, 'itemized'>;
  participants?: FamilyId[];
  customShares?: Record<FamilyId, number>;
  /** `personal` only: whose plan this is. */
  familyId?: FamilyId;
}

export interface BudgetShares {
  totalPaise: number;
  byFamily: Record<FamilyId, number>;
}

export function familyBudgetShares(
  lines: readonly BudgetLine[],
  families: readonly Family[],
  kidWeight = DEFAULT_KID_WEIGHT,
): BudgetShares {
  const byFamily: Record<FamilyId, number> = {};
  for (const f of families) if (f.active) byFamily[f.id] = 0;
  let totalPaise = 0;

  for (const line of lines) {
    if ((line.splitMode as string) === 'itemized') {
      throw new SplitError('budget lines cannot be itemized');
    }
    if (line.splitMode === 'personal' && !line.familyId) {
      throw new SplitError(`personal budget line "${line.id}" needs a familyId`);
    }
    // The payer only matters for "personal"; any known family satisfies the check otherwise.
    const payer = line.familyId ?? families[0]?.id;
    if (!payer) throw new SplitError('a budget needs at least one family');

    const shares = splitExpense(
      {
        id: line.id,
        amountPaise: line.amountPaise,
        paidByFamilyId: payer,
        splitMode: line.splitMode,
        participants: line.participants,
        customShares: line.customShares,
      },
      families,
      kidWeight,
    );
    totalPaise += line.amountPaise;
    for (const [id, paise] of Object.entries(shares)) byFamily[id] = (byFamily[id] ?? 0) + paise;
  }
  return { totalPaise, byFamily };
}
