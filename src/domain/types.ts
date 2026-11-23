// Domain types for splitting money between families. Field names follow docs/data-model.md.

export type FamilyId = string;

export interface Family {
  id: FamilyId;
  name?: string;
  adults: number;
  kids: number;
  /** Stable display order; also breaks rounding ties. */
  order: number;
  /** Inactive families are skipped by default but keep their history. */
  active: boolean;
}

export type SplitMode = 'equal_family' | 'per_head' | 'itemized' | 'custom' | 'personal';

export const SHARED = 'shared' as const;

export interface ExpenseItem {
  name: string;
  amountPaise: number;
  /** The family that had this dish, or "shared" to split it per head among participants. */
  familyId: FamilyId | typeof SHARED;
}

export interface Expense {
  id: string;
  amountPaise: number;
  paidByFamilyId: FamilyId;
  splitMode: SplitMode;
  /** Families taking part; empty or missing means every active family. */
  participants?: FamilyId[];
  /** `itemized` only. */
  items?: ExpenseItem[];
  /** `itemized` only: tax + service charge + tip, spread in proportion to each family's food. */
  extrasPaise?: number;
  /** `custom` only: exact paise per family, adding up to `amountPaise`. */
  customShares?: Record<FamilyId, number>;
  deleted?: boolean;
}

export interface Settlement {
  id: string;
  fromFamilyId: FamilyId;
  toFamilyId: FamilyId;
  amountPaise: number;
  deleted?: boolean;
}

/** Paise owed by each family for one expense or budget line. */
export type Shares = Record<FamilyId, number>;
