import { describe, expect, it } from 'vitest';
import type { Family } from '../../domain';
import {
  budgetLineToForm,
  budgetVsActual,
  emptyBudgetForm,
  formToBudgetLine,
  progressPercent,
  type BudgetForm,
  type TripBudgetLine,
} from './model';

// Four families of 2 / 4 / 3 / 3 adults, as in the handoff.
const families: Family[] = [
  { id: 'a', adults: 2, kids: 0, order: 0, active: true },
  { id: 'b', adults: 4, kids: 0, order: 1, active: true },
  { id: 'c', adults: 3, kids: 0, order: 2, active: true },
  { id: 'd', adults: 3, kids: 0, order: 3, active: true },
];

const form = (over: Partial<BudgetForm> = {}): BudgetForm => ({
  ...emptyBudgetForm(families, 'a'),
  ...over,
});

const line = (over: Partial<TripBudgetLine>): TripBudgetLine => ({
  id: 'l',
  title: 'Line',
  category: 'other',
  amountPaise: 100,
  splitMode: 'equal_family',
  participants: [],
  order: 0,
  createdBy: 'u',
  ...over,
});

describe('formToBudgetLine', () => {
  it('splits a per-head line by adults and stores "everyone" as an empty list', () => {
    const r = formToBudgetLine(form({ amount: '36,000', splitMode: 'per_head' }), families, 0.5);
    expect(r.errors).toEqual({});
    expect(r.preview).toEqual({ a: 600000, b: 1200000, c: 900000, d: 900000 });
    expect(r.input).toMatchObject({
      amountPaise: 3600000,
      participants: [],
      familyId: null,
      title: 'Stay',
    });
  });

  it('keeps a chosen subset of families', () => {
    const r = formToBudgetLine(
      form({ amount: '1000', splitMode: 'equal_family', participants: ['a', 'b'] }),
      families,
      0.5,
    );
    expect(r.input?.participants).toEqual(['a', 'b']);
    expect(r.preview).toEqual({ a: 50000, b: 50000, c: 0, d: 0 });
  });

  it('puts a one-family line on that family only', () => {
    const r = formToBudgetLine(
      form({ amount: '500', splitMode: 'personal', familyId: 'c' }),
      families,
      0.5,
    );
    expect(r.input).toMatchObject({ familyId: 'c', participants: [] });
    expect(r.preview).toEqual({ a: 0, b: 0, c: 50000, d: 0 });
  });

  it('refuses custom amounts that do not add up', () => {
    const short = formToBudgetLine(
      form({ amount: '100', splitMode: 'custom', custom: { a: '40', b: '50' } }),
      families,
      0.5,
    );
    expect(short.input).toBeUndefined();
    expect(short.remainingPaise).toBe(1000);
    const exact = formToBudgetLine(
      form({ amount: '100', splitMode: 'custom', custom: { a: '40', b: '60' } }),
      families,
      0.5,
    );
    expect(exact.input?.customShares).toEqual({ a: 4000, b: 6000 });
  });

  it('rejects a missing amount or no families', () => {
    expect(formToBudgetLine(form({ amount: '' }), families, 0.5).errors.amount).toBeTruthy();
    expect(formToBudgetLine(form({ amount: '0' }), families, 0.5).errors.amount).toBeTruthy();
    expect(
      formToBudgetLine(form({ amount: '10', participants: [] }), families, 0.5).errors.participants,
    ).toBeTruthy();
  });

  it('round-trips through the form', () => {
    const saved = line({
      amountPaise: 123450,
      splitMode: 'custom',
      customShares: { a: 123450 },
      title: 'Snacks',
      category: 'food',
    });
    const r = formToBudgetLine(budgetLineToForm(saved, families), families, 0.5);
    expect(r.input).toMatchObject({
      amountPaise: 123450,
      customShares: { a: 123450 },
      title: 'Snacks',
      category: 'food',
    });
  });
});

describe('budgetVsActual', () => {
  it('compares plan and spending by category and by family', () => {
    const lines = [
      line({ id: 'l1', category: 'fuel', amountPaise: 1200000, splitMode: 'equal_family' }),
      line({ id: 'l2', category: 'stay', amountPaise: 3600000, splitMode: 'per_head' }),
    ];
    const expenses = [
      {
        id: 'e1',
        category: 'fuel',
        amountPaise: 400000,
        paidByFamilyId: 'b',
        splitMode: 'equal_family' as const,
      },
      {
        id: 'e2',
        category: 'food',
        amountPaise: 999,
        paidByFamilyId: 'a',
        splitMode: 'personal' as const,
      },
      {
        id: 'e3',
        category: 'fuel',
        amountPaise: 5000,
        paidByFamilyId: 'a',
        splitMode: 'personal' as const,
        deleted: true,
      },
    ];
    const r = budgetVsActual(lines, expenses, families, 0.5);
    expect(r.planned).toBe(4800000);
    expect(r.actual).toBe(400999);
    expect(r.byCategory).toEqual([
      { category: 'fuel', planned: 1200000, actual: 400000 },
      { category: 'food', planned: 0, actual: 999 },
      { category: 'stay', planned: 3600000, actual: 0 },
    ]);
    expect(r.byFamily).toEqual({
      a: { planned: 900000, actual: 100999 },
      b: { planned: 1500000, actual: 100000 },
      c: { planned: 1200000, actual: 100000 },
      d: { planned: 1200000, actual: 100000 },
    });
    expect(r.skipped).toBe(0);
  });

  it('skips documents that cannot be split instead of failing', () => {
    const r = budgetVsActual(
      [line({ splitMode: 'personal', familyId: 'gone' })],
      [
        {
          id: 'e',
          category: 'food',
          amountPaise: 1,
          paidByFamilyId: 'gone',
          splitMode: 'personal',
        },
      ],
      families,
      0.5,
    );
    expect(r.skipped).toBe(2);
    expect(r.planned).toBe(0);
  });
});

describe('progressPercent', () => {
  it('caps at 100 and handles no plan', () => {
    expect(progressPercent({ planned: 1000, actual: 250 })).toBe(25);
    expect(progressPercent({ planned: 1000, actual: 5000 })).toBe(100);
    expect(progressPercent({ planned: 0, actual: 1 })).toBe(100);
    expect(progressPercent({ planned: 0, actual: 0 })).toBe(0);
  });
});
