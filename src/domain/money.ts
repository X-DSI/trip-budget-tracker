// Money is always an integer number of paise (docs/adr/2026-11-23-money-as-integer-paise.md).

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

/** Largest amount we accept: ₹1 crore. Keeps every intermediate product a safe integer. */
export const MAX_PAISE = 1_000_000_000;

export function assertPaise(value: number, label = 'amount'): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_PAISE) {
    throw new MoneyError(`${label} must be a whole number of paise between 0 and ${MAX_PAISE}`);
  }
  return value;
}

/**
 * Parse what someone typed ("1,250.5", "₹ 1250", "99.99") into paise, without floating point.
 * Rejects negatives, more than two decimals, and anything that isn't a number.
 */
export function toPaise(input: string): number {
  const cleaned = input.replace(/[₹,\s]/g, '').replace(/^Rs\.?/i, '');
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match) {
    throw new MoneyError(`"${input}" is not an amount in rupees (up to 2 decimals)`);
  }
  const rupees = Number(match[1]);
  const fraction = (match[2] ?? '').padEnd(2, '0');
  const paise = rupees * 100 + Number(fraction);
  return assertPaise(paise);
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Display only. "₹1,25,000.50"; whole rupees drop the ".00" unless `alwaysPaise` is set. */
export function formatINR(paise: number, { alwaysPaise = false } = {}): string {
  if (!Number.isSafeInteger(paise)) throw new MoneyError('formatINR needs whole paise');
  const value = paise / 100;
  return !alwaysPaise && paise % 100 === 0 ? inrWhole.format(value) : inr.format(value);
}

/** "1250.50" — the plain decimal form UPI links expect. */
export function paiseToDecimalString(paise: number): string {
  assertPaise(paise);
  return `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, '0')}`;
}
