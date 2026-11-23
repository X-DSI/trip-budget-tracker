import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { headWeight, participantsFor, sortFamilies, splitExpense, SplitError } from './split';
import { fourFamilies } from './fixtures';
import { SHARED, type Expense, type Family } from './types';

const sum = (shares: Record<string, number>) => Object.values(shares).reduce((a, b) => a + b, 0);

const base = (overrides: Partial<Expense>): Expense => ({
  id: 'e1',
  amountPaise: 400000,
  paidByFamilyId: 'A',
  splitMode: 'equal_family',
  ...overrides,
});

describe('per_head', () => {
  it('gives families A/B/C/D 66667/133333/100000/100000 paise of ₹4,000', () => {
    const shares = splitExpense(base({ splitMode: 'per_head' }), fourFamilies());
    expect(shares).toEqual({ A: 66667, B: 133333, C: 100000, D: 100000 });
    expect(sum(shares)).toBe(400000);
  });

  it('weights kids by the trip setting', () => {
    const families: Family[] = [
      { id: 'A', adults: 2, kids: 2, order: 0, active: true }, // 3 heads at 0.5
      { id: 'B', adults: 3, kids: 0, order: 1, active: true },
    ];
    expect(splitExpense(base({ splitMode: 'per_head', amountPaise: 60000 }), families)).toEqual({
      A: 30000,
      B: 30000,
    });
    expect(splitExpense(base({ splitMode: 'per_head', amountPaise: 70000 }), families, 1)).toEqual({
      A: 40000,
      B: 30000,
    });
  });
});

describe('equal_family', () => {
  it('divides by family, whatever the family size', () => {
    expect(splitExpense(base({}), fourFamilies())).toEqual({
      A: 100000,
      B: 100000,
      C: 100000,
      D: 100000,
    });
  });

  it('splits only between the listed participants', () => {
    expect(
      splitExpense(base({ amountPaise: 1001, participants: ['C', 'A'] }), fourFamilies()),
    ).toEqual({ A: 501, C: 500 });
  });
});

describe('personal', () => {
  it('stays with the paying family', () => {
    expect(
      splitExpense(base({ splitMode: 'personal', paidByFamilyId: 'B' }), fourFamilies()),
    ).toEqual({ B: 400000 });
  });
});

describe('custom', () => {
  it('uses exact shares that add up to the total', () => {
    const shares = { A: 100000, B: 250000, D: 50000 };
    expect(
      splitExpense(base({ splitMode: 'custom', customShares: shares }), fourFamilies()),
    ).toEqual(shares);
  });

  it('rejects shares that do not add up', () => {
    expect(() =>
      splitExpense(
        base({ splitMode: 'custom', customShares: { A: 100000, B: 100000 } }),
        fourFamilies(),
      ),
    ).toThrow(SplitError);
  });

  it('rejects unknown families and fractional paise', () => {
    expect(() =>
      splitExpense(base({ splitMode: 'custom', customShares: { Z: 400000 } }), fourFamilies()),
    ).toThrow(SplitError);
    expect(() =>
      splitExpense(
        base({ splitMode: 'custom', customShares: { A: 199999.5, B: 200000.5 } }),
        fourFamilies(),
      ),
    ).toThrow();
  });
});

describe('itemized', () => {
  // Bill: A had 600, B had 1,800, C had 900; 1,200 of shared starters; 500 tax + tip. Total 5,000.
  const bill = base({
    splitMode: 'itemized',
    amountPaise: 500000,
    items: [
      { name: 'Thali ×2', amountPaise: 60000, familyId: 'A' },
      { name: 'Biryani ×4', amountPaise: 180000, familyId: 'B' },
      { name: 'Dosa ×3', amountPaise: 90000, familyId: 'C' },
      { name: 'Starters', amountPaise: 120000, familyId: SHARED },
    ],
    extrasPaise: 50000,
  });

  it('charges each family its dishes, its per-head part of shared dishes, and extras in proportion', () => {
    const shares = splitExpense(bill, fourFamilies());
    // Shared 1,200 per head over 12: A 200, B 400, C 300, D 300.
    // Food: A 800, B 2,200, C 1,200, D 300 → total 4,500. Extras 500 × food/4,500.
    // Extras floor to 8,888 / 24,444 / 13,333 / 3,333 paise; the 2 leftover paise go to A (.89) and B (.44).
    expect(shares).toEqual({ A: 88889, B: 244445, C: 133333, D: 33333 });
    expect(sum(shares)).toBe(500000);
  });

  it('matches the definition for every family', () => {
    const shares = splitExpense(bill, fourFamilies());
    const food = { A: 80000, B: 220000, C: 120000, D: 30000 };
    for (const [id, f] of Object.entries(food)) {
      const exact = f + (50000 * f) / 450000;
      expect(Math.abs(shares[id]! - exact)).toBeLessThan(1);
    }
  });

  it('works with no shared items and no extras', () => {
    const shares = splitExpense(
      base({
        splitMode: 'itemized',
        amountPaise: 1500,
        items: [
          { name: 'Tea', amountPaise: 500, familyId: 'A' },
          { name: 'Coffee', amountPaise: 1000, familyId: 'D' },
        ],
      }),
      fourFamilies(),
    );
    expect(shares).toEqual({ A: 500, D: 1000 });
  });

  it('rejects bills whose items and extras do not match the total', () => {
    expect(() => splitExpense({ ...bill, amountPaise: 499999 }, fourFamilies())).toThrow(
      SplitError,
    );
    expect(() => splitExpense({ ...bill, items: [] }, fourFamilies())).toThrow(SplitError);
    expect(() =>
      splitExpense(
        { ...bill, items: [{ name: 'x', amountPaise: 450000, familyId: 'Z' }] },
        fourFamilies(),
      ),
    ).toThrow(SplitError);
  });

  it('property: shares always add up to the bill', () => {
    const families = fourFamilies();
    const owner = fc.constantFrom('A', 'B', 'C', 'D', SHARED);
    fc.assert(
      fc.property(
        fc.array(fc.record({ amountPaise: fc.integer({ min: 0, max: 500000 }), familyId: owner }), {
          minLength: 1,
          maxLength: 15,
        }),
        fc.integer({ min: 0, max: 100000 }),
        (items, extras) => {
          const itemsTotal = items.reduce((a, i) => a + i.amountPaise, 0);
          fc.pre(itemsTotal > 0 || extras === 0);
          const expense = base({
            splitMode: 'itemized',
            amountPaise: itemsTotal + extras,
            items: items.map((i, n) => ({ ...i, name: `item ${n}` })),
            extrasPaise: extras,
          });
          expect(sum(splitExpense(expense, families))).toBe(itemsTotal + extras);
        },
      ),
      { seed: 20261205, numRuns: 1000 },
    );
  });
});

describe('participants and validation', () => {
  it('defaults to active families only', () => {
    const families = fourFamilies().map((f) => (f.id === 'D' ? { ...f, active: false } : f));
    expect(Object.keys(splitExpense(base({ amountPaise: 300 }), families))).toEqual([
      'A',
      'B',
      'C',
    ]);
  });

  it('still lets an inactive family be named explicitly (it left midway)', () => {
    const families = fourFamilies().map((f) => (f.id === 'D' ? { ...f, active: false } : f));
    expect(participantsFor(base({ participants: ['D', 'A'] }), families).map((f) => f.id)).toEqual([
      'A',
      'D',
    ]);
  });

  it('rejects unknown payers, unknown participants and empty groups', () => {
    expect(() => splitExpense(base({ paidByFamilyId: 'Z' }), fourFamilies())).toThrow(SplitError);
    expect(() => splitExpense(base({ participants: ['Z'] }), fourFamilies())).toThrow(SplitError);
    const inactive = fourFamilies().map((f) => ({ ...f, active: false }));
    expect(() => splitExpense(base({}), inactive)).toThrow(SplitError);
  });

  it('rejects unknown split modes', () => {
    expect(() =>
      splitExpense(base({ splitMode: 'bogus' as Expense['splitMode'] }), fourFamilies()),
    ).toThrow(SplitError);
  });

  it('sorts by order, then id', () => {
    expect(
      sortFamilies([
        { id: 'b', order: 1 },
        { id: 'a', order: 1 },
        { id: 'z', order: 0 },
      ]).map((f) => f.id),
    ).toEqual(['z', 'a', 'b']);
  });

  it('counts heads', () => {
    expect(headWeight({ id: 'x', adults: 2, kids: 3, order: 0, active: true })).toBe(3.5);
  });
});
