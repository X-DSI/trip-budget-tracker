import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { balances, suggestSettlements, type Balances } from './settle';
import { SplitError } from './split';
import { fourFamilies } from './fixtures';
import type { Expense, Settlement } from './types';

const netTotal = (b: Balances) => Object.values(b).reduce((a, x) => a + x.net, 0);

const expenses: Expense[] = [
  { id: 'fuel', amountPaise: 800000, paidByFamilyId: 'A', splitMode: 'equal_family' },
  { id: 'dinner', amountPaise: 600000, paidByFamilyId: 'B', splitMode: 'per_head' },
  { id: 'snacks', amountPaise: 30000, paidByFamilyId: 'C', splitMode: 'personal' },
  {
    id: 'oops',
    amountPaise: 999999,
    paidByFamilyId: 'D',
    splitMode: 'equal_family',
    deleted: true,
  },
];

describe('balances', () => {
  it('nets what each family paid against its share', () => {
    const b = balances(expenses, [], fourFamilies());
    // Fuel: 2,000 each. Dinner per head (2/4/3/3 of 6,000): 1,000 / 2,000 / 1,500 / 1,500.
    expect(b.A).toMatchObject({ paid: 800000, share: 300000, net: 500000 });
    expect(b.B).toMatchObject({ paid: 600000, share: 400000, net: 200000 });
    expect(b.C).toMatchObject({ paid: 30000, share: 380000, net: -350000 });
    expect(b.D).toMatchObject({ paid: 0, share: 350000, net: -350000 });
    expect(netTotal(b)).toBe(0);
  });

  it('ignores deleted expenses and settlements', () => {
    const b = balances(
      expenses,
      [{ id: 's', fromFamilyId: 'C', toFamilyId: 'A', amountPaise: 1, deleted: true }],
      fourFamilies(),
    );
    expect(b.D!.paid).toBe(0);
    expect(b.C!.sent).toBe(0);
  });

  it('counts settlements: paying back reduces what you owe', () => {
    const settlements: Settlement[] = [
      { id: 's1', fromFamilyId: 'C', toFamilyId: 'A', amountPaise: 350000 },
    ];
    const b = balances(expenses, settlements, fourFamilies());
    expect(b.C!.net).toBe(0);
    expect(b.A!.net).toBe(150000);
    expect(netTotal(b)).toBe(0);
  });

  it('leaves out inactive families that took no part', () => {
    const families = fourFamilies().map((f) => (f.id === 'D' ? { ...f, active: false } : f));
    const b = balances([expenses[0]!], [], families);
    expect(Object.keys(b).sort()).toEqual(['A', 'B', 'C']);
    expect(netTotal(b)).toBe(0);
  });

  it('keeps an inactive family that did take part', () => {
    const families = fourFamilies().map((f) => (f.id === 'D' ? { ...f, active: false } : f));
    const b = balances([{ ...expenses[0]!, participants: ['A', 'B', 'C', 'D'] }], [], families);
    expect(b.D!.share).toBe(200000);
    expect(netTotal(b)).toBe(0);
  });

  it('rejects unknown families and self-payments', () => {
    expect(() => balances([{ ...expenses[0]!, paidByFamilyId: 'Z' }], [], fourFamilies())).toThrow(
      SplitError,
    );
    expect(() =>
      balances(
        [],
        [{ id: 's', fromFamilyId: 'A', toFamilyId: 'A', amountPaise: 5 }],
        fourFamilies(),
      ),
    ).toThrow(SplitError);
    expect(() =>
      balances(
        [],
        [{ id: 's', fromFamilyId: 'A', toFamilyId: 'Z', amountPaise: 5 }],
        fourFamilies(),
      ),
    ).toThrow(SplitError);
  });
});

describe('suggestSettlements', () => {
  it('settles four families in at most three payments', () => {
    const b = balances(expenses, [], fourFamilies());
    const payments = suggestSettlements(b, fourFamilies());
    expect(payments).toEqual([
      { fromFamilyId: 'C', toFamilyId: 'A', amountPaise: 350000 },
      { fromFamilyId: 'D', toFamilyId: 'B', amountPaise: 200000 },
      { fromFamilyId: 'D', toFamilyId: 'A', amountPaise: 150000 },
    ]);
  });

  it('returns nothing when everyone is square', () => {
    expect(suggestSettlements(balances([], [], fourFamilies()))).toEqual([]);
  });

  it('property: at most n − 1 payments, and applying them zeroes every balance', () => {
    const families = fourFamilies();
    const familyId = fc.constantFrom('A', 'B', 'C', 'D');
    const mode = fc.constantFrom('equal_family' as const, 'per_head' as const, 'personal' as const);
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            amountPaise: fc.integer({ min: 1, max: 2_000_000 }),
            paidByFamilyId: familyId,
            splitMode: mode,
          }),
          { maxLength: 40 },
        ),
        (raw) => {
          const list: Expense[] = raw.map((e, i) => ({ ...e, id: `e${i}` }));
          const before = balances(list, [], families);
          const payments = suggestSettlements(before, families);
          expect(payments.length).toBeLessThanOrEqual(families.length - 1);

          const settlements: Settlement[] = payments.map((p, i) => ({ ...p, id: `s${i}` }));
          const after = balances(list, settlements, families);
          for (const b of Object.values(after)) expect(b.net).toBe(0);
          for (const p of payments) expect(p.amountPaise).toBeGreaterThan(0);
        },
      ),
      { seed: 20261206, numRuns: 1000 },
    );
  });
});
