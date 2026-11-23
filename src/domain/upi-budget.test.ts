import { describe, expect, it } from 'vitest';
import { isValidUpiId, upiLink } from './upi';
import { familyBudgetShares, type BudgetLine } from './budget';
import { fourFamilies } from './fixtures';
import { MoneyError } from './money';
import { SplitError } from './split';

describe('upiLink', () => {
  it('builds an NPCI deep link with encoded name and note', () => {
    expect(
      upiLink({
        upiId: 'daniel@okicici',
        payeeName: 'Daniel & Family',
        amountPaise: 125050,
        note: 'Coorg trip settle-up',
      }),
    ).toBe(
      'upi://pay?pa=daniel@okicici&pn=Daniel%20%26%20Family&am=1250.50&cu=INR&tn=Coorg%20trip%20settle-up',
    );
  });

  it('omits an empty note and trims input', () => {
    expect(upiLink({ upiId: ' a.b-1@ybl ', payeeName: ' Asha ', amountPaise: 100 })).toBe(
      'upi://pay?pa=a.b-1@ybl&pn=Asha&am=1.00&cu=INR',
    );
  });

  it('rejects bad UPI IDs and non-positive amounts', () => {
    expect(isValidUpiId('not-an-id')).toBe(false);
    expect(isValidUpiId('x@y')).toBe(false);
    expect(() => upiLink({ upiId: 'nope', payeeName: 'X', amountPaise: 100 })).toThrow(MoneyError);
    expect(() => upiLink({ upiId: 'ab@ybl', payeeName: 'X', amountPaise: 0 })).toThrow(MoneyError);
  });
});

describe('familyBudgetShares', () => {
  const lines: BudgetLine[] = [
    { id: 'fuel', amountPaise: 1200000, splitMode: 'equal_family' },
    { id: 'stay', amountPaise: 3600000, splitMode: 'per_head' },
    { id: 'gifts', amountPaise: 200000, splitMode: 'personal', familyId: 'B' },
    {
      id: 'jeep',
      amountPaise: 300000,
      splitMode: 'custom',
      customShares: { C: 150000, D: 150000 },
    },
  ];

  it('applies the split rules to planned amounts', () => {
    const { totalPaise, byFamily } = familyBudgetShares(lines, fourFamilies());
    expect(totalPaise).toBe(5300000);
    expect(byFamily).toEqual({
      A: 300000 + 600000,
      B: 300000 + 1200000 + 200000,
      C: 300000 + 900000 + 150000,
      D: 300000 + 900000 + 150000,
    });
    expect(Object.values(byFamily).reduce((a, b) => a + b, 0)).toBe(totalPaise);
  });

  it('rejects personal lines without a family, itemized lines and empty family lists', () => {
    expect(() =>
      familyBudgetShares([{ id: 'x', amountPaise: 1, splitMode: 'personal' }], fourFamilies()),
    ).toThrow(SplitError);
    expect(() =>
      familyBudgetShares(
        [{ id: 'x', amountPaise: 1, splitMode: 'itemized' as BudgetLine['splitMode'] }],
        fourFamilies(),
      ),
    ).toThrow(SplitError);
    expect(() =>
      familyBudgetShares([{ id: 'x', amountPaise: 1, splitMode: 'equal_family' }], []),
    ).toThrow(SplitError);
  });
});
