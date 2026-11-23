import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { allocate } from './allocate';
import { MAX_PAISE, MoneyError } from './money';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('allocate', () => {
  it('splits ₹4,000 per head over 2/4/3/3 people exactly', () => {
    expect(allocate(400000, [2, 4, 3, 3])).toEqual([66667, 133333, 100000, 100000]);
  });

  it('splits equally, giving leftover paise to the earliest shares on ties', () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(2, [1, 1, 1])).toEqual([1, 1, 0]);
  });

  it('handles kid weights', () => {
    // 2 adults + 1 kid at 0.5 = 2.5; 2 adults = 2. Total 4.5.
    expect(allocate(90000, [2.5, 2])).toEqual([50000, 40000]);
  });

  it('gives nothing to zero weights', () => {
    expect(allocate(1000, [0, 1, 0])).toEqual([0, 1000, 0]);
  });

  it('allows a zero total with zero weights, but not money with no one to pay it', () => {
    expect(allocate(0, [0, 0])).toEqual([0, 0]);
    expect(() => allocate(10, [0, 0])).toThrow(MoneyError);
    expect(() => allocate(10, [])).toThrow(MoneyError);
  });

  it('rejects bad weights and totals', () => {
    expect(() => allocate(10, [-1, 2])).toThrow(MoneyError);
    expect(() => allocate(10, [Number.POSITIVE_INFINITY])).toThrow(MoneyError);
    expect(() => allocate(10.5, [1])).toThrow(MoneyError);
  });

  it('property: always sums to the total and stays within 1 paisa of the exact share', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_PAISE }),
        fc.array(fc.integer({ min: 0, max: 40 }), { minLength: 1, maxLength: 12 }),
        (total, halfWeights) => {
          // Weights in steps of 0.5, like adults + kids × 0.5.
          const weights = halfWeights.map((w) => w / 2);
          const weightSum = sum(weights);
          fc.pre(weightSum > 0);
          const shares = allocate(total, weights);
          expect(sum(shares)).toBe(total);
          shares.forEach((share, i) => {
            expect(Number.isInteger(share)).toBe(true);
            const exact = (total * weights[i]!) / weightSum;
            expect(Math.abs(share - exact)).toBeLessThan(1);
          });
        },
      ),
      { seed: 20261204, numRuns: 2000 },
    );
  });
});
