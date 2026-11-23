import { describe, expect, it } from 'vitest';
import {
  assertPaise,
  formatINR,
  MAX_PAISE,
  MoneyError,
  paiseToDecimalString,
  toPaise,
} from './money';

describe('toPaise', () => {
  it.each([
    ['1250', 125000],
    ['1,250.5', 125050],
    ['₹ 1,25,000.75', 12500075],
    ['Rs. 99.9', 9990],
    ['0.01', 1],
    ['12.', 1200],
    ['0', 0],
  ])('parses %s as %i paise', (input, paise) => {
    expect(toPaise(input)).toBe(paise);
  });

  it.each(['-5', '1.234', 'abc', '', '1e3', '12..5', '.5'])('rejects %j', (input) => {
    expect(() => toPaise(input)).toThrow(MoneyError);
  });

  it('rejects amounts above the ceiling', () => {
    expect(() => toPaise('10000001')).toThrow(MoneyError);
  });
});

describe('assertPaise', () => {
  it('accepts whole paise in range and rejects the rest', () => {
    expect(assertPaise(0)).toBe(0);
    expect(assertPaise(MAX_PAISE)).toBe(MAX_PAISE);
    expect(() => assertPaise(1.5)).toThrow(MoneyError);
    expect(() => assertPaise(-1)).toThrow(MoneyError);
    expect(() => assertPaise(Number.NaN)).toThrow(MoneyError);
  });
});

describe('formatINR', () => {
  it('uses Indian digit grouping', () => {
    expect(formatINR(12500075)).toBe('₹1,25,000.75');
    expect(formatINR(400000)).toBe('₹4,000');
    expect(formatINR(400000, { alwaysPaise: true })).toBe('₹4,000.00');
    expect(formatINR(-5050)).toBe('-₹50.50');
  });

  it('refuses fractional paise', () => {
    expect(() => formatINR(1.5)).toThrow(MoneyError);
  });
});

describe('paiseToDecimalString', () => {
  it('formats without floating point', () => {
    expect(paiseToDecimalString(125050)).toBe('1250.50');
    expect(paiseToDecimalString(7)).toBe('0.07');
    expect(paiseToDecimalString(100)).toBe('1.00');
  });
});
