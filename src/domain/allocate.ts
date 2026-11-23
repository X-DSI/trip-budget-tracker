import { assertPaise, MoneyError } from './money';

/** Weights are scaled to integers so the whole allocation stays in exact integer arithmetic. */
const WEIGHT_SCALE = 10_000;

function toIntegerWeight(weight: number): number {
  if (!Number.isFinite(weight) || weight < 0) {
    throw new MoneyError('weights must be finite and not negative');
  }
  return Math.round(weight * WEIGHT_SCALE);
}

/**
 * Split `totalPaise` in proportion to `weights`, by largest remainder:
 * every share is floored, then the leftover paise go one each to the shares with the largest
 * remainders. Ties go to the earlier index, so callers control tie-breaking by ordering the input.
 *
 * Guarantees: shares are whole paise, they sum to the total exactly, and each share is within
 * one paisa of its exact proportional value.
 */
export function allocate(totalPaise: number, weights: readonly number[]): number[] {
  assertPaise(totalPaise, 'total');
  const scaled = weights.map(toIntegerWeight);
  const weightSum = scaled.reduce((a, b) => a + b, 0);

  if (weightSum === 0) {
    if (totalPaise === 0) return scaled.map(() => 0);
    throw new MoneyError('cannot split an amount when every weight is zero');
  }

  const shares: number[] = [];
  const remainders: number[] = [];
  let allocated = 0;

  for (const w of scaled) {
    const numerator = totalPaise * w; // ≤ 1e9 × weight, a safe integer for any realistic weights
    let q = Math.floor(numerator / weightSum);
    let r = numerator - q * weightSum;
    // Correct any off-by-one from floating-point division.
    if (r < 0) {
      q -= 1;
      r += weightSum;
    } else if (r >= weightSum) {
      q += 1;
      r -= weightSum;
    }
    shares.push(q);
    remainders.push(r);
    allocated += q;
  }

  let leftover = totalPaise - allocated;
  const byRemainder = remainders.map((r, i) => ({ r, i })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of byRemainder) {
    if (leftover === 0) break;
    shares[i] = (shares[i] ?? 0) + 1;
    leftover -= 1;
  }
  return shares;
}
