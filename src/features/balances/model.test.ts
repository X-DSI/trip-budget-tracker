import { describe, expect, it } from 'vitest';
import type { Expense, Settlement } from '../../domain';
import {
  canDeleteSettlement,
  canRecordPayment,
  formToSettlement,
  netLabel,
  paymentLink,
  tripBalances,
  yourNetLabel,
} from './model';

const families = [
  {
    id: 'a',
    name: 'Family A',
    adults: 2,
    kids: 0,
    order: 0,
    active: true,
    upiId: 'family.a@okicici',
  },
  { id: 'b', name: 'Family B', adults: 4, kids: 0, order: 1, active: true, upiId: null },
  { id: 'c', name: 'Family C', adults: 3, kids: 0, order: 2, active: true, upiId: 'bad id' },
];

const exp = (id: string, paidBy: string, paise: number, over: Partial<Expense> = {}): Expense => ({
  id,
  amountPaise: paise,
  paidByFamilyId: paidBy,
  splitMode: 'equal_family',
  ...over,
});

describe('tripBalances', () => {
  it('nets to zero, suggests at most n − 1 payments, and settles after paying them', () => {
    const expenses = [exp('e1', 'a', 900000), exp('e2', 'b', 300000)];
    const before = tripBalances(expenses, [], families, 0.5);
    const nets = Object.values(before.balances).map((b) => b.net);
    expect(nets.reduce((s, n) => s + n, 0)).toBe(0);
    expect(before.balances).toMatchObject({
      a: { net: 500000 },
      b: { net: -100000 },
      c: { net: -400000 },
    });
    expect(before.payments.length).toBeLessThanOrEqual(families.length - 1);

    const settlements: Settlement[] = before.payments.map((p, i) => ({ id: `s${i}`, ...p }));
    const after = tripBalances(expenses, settlements, families, 0.5);
    expect(Object.values(after.balances).every((b) => b.net === 0)).toBe(true);
    expect(after.payments).toEqual([]);
  });

  it('ignores deleted settlements and skips ones it cannot place', () => {
    const r = tripBalances(
      [exp('e1', 'a', 300000), exp('bad', 'gone', 100)],
      [
        { id: 's1', fromFamilyId: 'b', toFamilyId: 'a', amountPaise: 100000, deleted: true },
        { id: 's2', fromFamilyId: 'b', toFamilyId: 'gone', amountPaise: 100 },
      ],
      families,
      0.5,
    );
    expect(r.skipped).toBe(2);
    expect(r.balances.b?.net).toBe(-100000);
  });
});

describe('labels', () => {
  it('words a net figure', () => {
    expect(netLabel(-120000)).toBe('owes ₹1,200');
    expect(netLabel(66667)).toBe('gets back ₹666.67');
    expect(netLabel(0)).toBe('is settled');
    expect(yourNetLabel(-50)).toBe('You owe ₹0.50');
    expect(yourNetLabel(0)).toBe('You’re all square');
  });
});

describe('paymentLink', () => {
  it('fills payee, amount and a note when the receiver has a UPI ID', () => {
    const link = paymentLink(
      { fromFamilyId: 'b', toFamilyId: 'a', amountPaise: 125050 },
      families,
      'Ooty trip',
    );
    expect(link).toBe(
      'upi://pay?pa=family.a@okicici&pn=Family%20A&am=1250.50&cu=INR&tn=Ooty%20trip%20%C2%B7%20Family%20B',
    );
  });

  it('gives no link without a valid UPI ID', () => {
    expect(paymentLink({ fromFamilyId: 'a', toFamilyId: 'b', amountPaise: 1 }, families, 'T')).toBe(
      null,
    );
    expect(paymentLink({ fromFamilyId: 'a', toFamilyId: 'c', amountPaise: 1 }, families, 'T')).toBe(
      null,
    );
  });
});

describe('permissions', () => {
  it('lets only the paying or receiving family record a payment', () => {
    const p = { fromFamilyId: 'b', toFamilyId: 'a' };
    expect(canRecordPayment(p, 'a')).toBe(true);
    expect(canRecordPayment(p, 'b')).toBe(true);
    expect(canRecordPayment(p, 'c')).toBe(false);
    expect(canRecordPayment(p, null)).toBe(false);
  });

  it('lets the recorder or an organiser delete', () => {
    expect(canDeleteSettlement({ createdBy: 'u1' }, 'u1', false)).toBe(true);
    expect(canDeleteSettlement({ createdBy: 'u1' }, 'u2', true)).toBe(true);
    expect(canDeleteSettlement({ createdBy: 'u1' }, 'u2', false)).toBe(false);
  });
});

describe('formToSettlement', () => {
  const p = { fromFamilyId: 'b', toFamilyId: 'a' };
  const f = { amount: '1,250.50', method: 'upi' as const, date: '2026-12-07', note: ' thanks ' };

  it('records exact paise', () => {
    expect(formToSettlement(f, p).input).toEqual({
      fromFamilyId: 'b',
      toFamilyId: 'a',
      amountPaise: 125050,
      date: '2026-12-07',
      method: 'upi',
      note: 'thanks',
    });
  });

  it('refuses a bad amount or date', () => {
    expect(formToSettlement({ ...f, amount: '0' }, p).error).toBeTruthy();
    expect(formToSettlement({ ...f, amount: '-5' }, p).error).toBeTruthy();
    expect(formToSettlement({ ...f, date: '' }, p).error).toBeTruthy();
  });
});
