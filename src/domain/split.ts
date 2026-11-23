// How one expense is divided between families (docs/adr/2026-11-23-split-modes.md).

import { allocate } from './allocate';
import { assertPaise, MoneyError } from './money';
import { SHARED, type Expense, type Family, type FamilyId, type Shares } from './types';

export class SplitError extends MoneyError {
  constructor(message: string) {
    super(message);
    this.name = 'SplitError';
  }
}

export const DEFAULT_KID_WEIGHT = 0.5;

/** Stable order used everywhere: `order`, then id. */
export function sortFamilies<T extends Pick<Family, 'id' | 'order'>>(families: readonly T[]): T[] {
  return [...families].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function headWeight(family: Family, kidWeight = DEFAULT_KID_WEIGHT): number {
  return family.adults + family.kids * kidWeight;
}

function familyMap(families: readonly Family[]): Map<FamilyId, Family> {
  return new Map(families.map((f) => [f.id, f]));
}

function requireFamily(byId: Map<FamilyId, Family>, id: FamilyId, what: string): Family {
  const family = byId.get(id);
  if (!family) throw new SplitError(`${what} refers to an unknown family "${id}"`);
  return family;
}

/** Families an expense is split between, in stable order. */
export function participantsFor(expense: Expense, families: readonly Family[]): Family[] {
  const byId = familyMap(families);
  const chosen =
    expense.participants && expense.participants.length > 0
      ? [...new Set(expense.participants)].map((id) => requireFamily(byId, id, 'participants'))
      : families.filter((f) => f.active);
  if (chosen.length === 0)
    throw new SplitError('an expense needs at least one family to split with');
  return sortFamilies(chosen);
}

function zip(families: readonly Family[], amounts: readonly number[]): Shares {
  const shares: Shares = {};
  families.forEach((f, i) => {
    shares[f.id] = (shares[f.id] ?? 0) + (amounts[i] ?? 0);
  });
  return shares;
}

function addShares(into: Shares, from: Shares) {
  for (const [id, paise] of Object.entries(from)) into[id] = (into[id] ?? 0) + paise;
}

/** Paise owed by each family for one expense. The values always add up to `amountPaise`. */
export function splitExpense(
  expense: Expense,
  families: readonly Family[],
  kidWeight = DEFAULT_KID_WEIGHT,
): Shares {
  const total = assertPaise(expense.amountPaise);
  const byId = familyMap(families);
  requireFamily(byId, expense.paidByFamilyId, 'paidByFamilyId');

  switch (expense.splitMode) {
    case 'personal':
      return { [expense.paidByFamilyId]: total };

    case 'equal_family': {
      const people = participantsFor(expense, families);
      return zip(
        people,
        allocate(
          total,
          people.map(() => 1),
        ),
      );
    }

    case 'per_head': {
      const people = participantsFor(expense, families);
      return zip(
        people,
        allocate(
          total,
          people.map((f) => headWeight(f, kidWeight)),
        ),
      );
    }

    case 'custom': {
      const custom = expense.customShares ?? {};
      const shares: Shares = {};
      let sum = 0;
      for (const [id, paise] of Object.entries(custom)) {
        requireFamily(byId, id, 'customShares');
        shares[id] = assertPaise(paise, `share for ${id}`);
        sum += paise;
      }
      if (sum !== total) {
        throw new SplitError(`custom shares add up to ${sum} paise, not ${total}`);
      }
      return shares;
    }

    case 'itemized':
      return splitItemized(expense, families, byId, kidWeight);

    default: {
      const mode: never = expense.splitMode;
      throw new SplitError(`unknown split mode "${String(mode)}"`);
    }
  }
}

function splitItemized(
  expense: Expense,
  families: readonly Family[],
  byId: Map<FamilyId, Family>,
  kidWeight: number,
): Shares {
  const items = expense.items ?? [];
  if (items.length === 0) throw new SplitError('an itemized bill needs at least one item');
  const extras = assertPaise(expense.extrasPaise ?? 0, 'extras');

  let itemsTotal = 0;
  let sharedTotal = 0;
  const own: Shares = {};
  for (const item of items) {
    const paise = assertPaise(item.amountPaise, `item "${item.name}"`);
    itemsTotal += paise;
    if (item.familyId === SHARED) {
      sharedTotal += paise;
    } else {
      requireFamily(byId, item.familyId, `item "${item.name}"`);
      own[item.familyId] = (own[item.familyId] ?? 0) + paise;
    }
  }
  if (itemsTotal + extras !== expense.amountPaise) {
    throw new SplitError(
      `items (${itemsTotal}) plus extras (${extras}) must equal the bill (${expense.amountPaise})`,
    );
  }

  // Each family's food: its own dishes plus its per-head part of the shared dishes.
  const food: Shares = { ...own };
  if (sharedTotal > 0) {
    const people = participantsFor(expense, families);
    addShares(
      food,
      zip(
        people,
        allocate(
          sharedTotal,
          people.map((f) => headWeight(f, kidWeight)),
        ),
      ),
    );
  }

  // Extras follow each family's share of the food.
  const eaters = sortFamilies(Object.keys(food).map((id) => requireFamily(byId, id, 'item')));
  const result: Shares = {};
  addShares(result, food);
  if (extras > 0) {
    addShares(
      result,
      zip(
        eaters,
        allocate(
          extras,
          eaters.map((f) => food[f.id] ?? 0),
        ),
      ),
    );
  }
  return result;
}
