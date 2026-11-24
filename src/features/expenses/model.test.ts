import { describe, expect, it } from 'vitest';
import { SHARED } from '../../domain';
import { fourFamilies } from '../../domain/fixtures';
import {
  canEditExpense,
  expenseToForm,
  formToExpense,
  groupByDay,
  type ExpenseForm,
  type TripExpense,
} from './model';

const families = fourFamilies();
const all = ['A', 'B', 'C', 'D'];

const form = (over: Partial<ExpenseForm> = {}): ExpenseForm => ({
  amount: '4,000',
  title: 'Dinner',
  category: 'food',
  paidByFamilyId: 'A',
  date: '2026-12-05',
  splitMode: 'per_head',
  participants: all,
  items: [],
  extras: '',
  custom: {},
  note: '',
  ...over,
});

describe('formToExpense', () => {
  it('previews and saves a per-head dinner in exact paise', () => {
    const r = formToExpense(form(), families, 0.5);
    expect(r.errors).toEqual({});
    expect(r.preview).toEqual({ A: 66667, B: 133333, C: 100000, D: 100000 });
    expect(r.input).toMatchObject({
      amountPaise: 400000,
      splitMode: 'per_head',
      participants: [], // everyone active
      title: 'Dinner',
    });
  });

  it('keeps an explicit subset of participants', () => {
    const r = formToExpense(
      form({ splitMode: 'equal_family', participants: ['B', 'A'], amount: '1001' }),
      families,
      0.5,
    );
    expect(r.input?.participants).toEqual(['B', 'A']);
    expect(r.preview).toEqual({ A: 50050, B: 50050 });
  });

  it('defaults the title to the category', () => {
    expect(formToExpense(form({ title: ' ', category: 'fuel' }), families, 0.5).input?.title).toBe(
      'Fuel',
    );
  });

  it('needs an amount, a payer, a date and someone to share with', () => {
    const r = formToExpense(
      form({ amount: '', paidByFamilyId: 'Z', date: '', participants: [] }),
      families,
      0.5,
    );
    expect(r.input).toBeUndefined();
    expect(Object.keys(r.errors).sort()).toEqual(['amount', 'date', 'paidBy', 'participants']);
    expect(formToExpense(form({ amount: '12.345' }), families, 0.5).errors.amount).toBeTruthy();
  });

  it('itemizes dishes, shared dishes and extras, and tracks what is left to assign', () => {
    const items = [
      { key: '1', name: 'Thali', amount: '600', familyId: 'A' },
      { key: '2', name: 'Biryani', amount: '1800', familyId: 'B' },
      { key: '3', name: 'Starters', amount: '1200', familyId: SHARED },
    ];
    const short = formToExpense(
      form({ splitMode: 'itemized', amount: '4000', items, extras: '300' }),
      families,
      0.5,
    );
    expect(short.remainingPaise).toBe(10000);
    expect(short.input).toBeUndefined();
    expect(short.errors.split).toMatch(/isn’t assigned/);

    const ok = formToExpense(
      form({ splitMode: 'itemized', amount: '3900', items, extras: '300' }),
      families,
      0.5,
    );
    expect(ok.remainingPaise).toBe(0);
    expect(ok.input?.items).toHaveLength(3);
    expect(ok.input?.extrasPaise).toBe(30000);
    const total = Object.values(ok.preview ?? {}).reduce((a, b) => a + b, 0);
    expect(total).toBe(390000);
  });

  it('ignores blank dish rows, and rejects bad dish amounts', () => {
    const items = [
      { key: '1', name: 'Tea', amount: '50', familyId: 'A' },
      { key: '2', name: '', amount: '', familyId: SHARED },
    ];
    expect(
      formToExpense(form({ splitMode: 'itemized', amount: '50', items }), families, 0.5).input
        ?.items,
    ).toEqual([{ name: 'Tea', amountPaise: 5000, familyId: 'A' }]);
    expect(
      formToExpense(
        form({ splitMode: 'itemized', amount: '50', items: [{ ...items[0]!, amount: 'x' }] }),
        families,
        0.5,
      ).errors.split,
    ).toBeTruthy();
  });

  it('custom amounts must add up to the bill', () => {
    const over = formToExpense(
      form({ splitMode: 'custom', amount: '1000', custom: { A: '600', B: '500' } }),
      families,
      0.5,
    );
    expect(over.remainingPaise).toBe(-10000);
    expect(over.input).toBeUndefined();
    const ok = formToExpense(
      form({ splitMode: 'custom', amount: '1000', custom: { A: '600', B: '400', C: '' } }),
      families,
      0.5,
    );
    expect(ok.input?.customShares).toEqual({ A: 60000, B: 40000 });
  });

  it('personal expenses stay with the payer', () => {
    const r = formToExpense(form({ splitMode: 'personal', paidByFamilyId: 'C' }), families, 0.5);
    expect(r.preview).toEqual({ C: 400000 });
  });
});

describe('editing round trip', () => {
  it('turns a saved expense back into the same form values', () => {
    const saved: TripExpense = {
      id: 'e1',
      title: 'Lunch',
      category: 'food',
      amountPaise: 125050,
      paidByFamilyId: 'B',
      date: '2026-12-05',
      splitMode: 'itemized',
      participants: [],
      items: [{ name: 'Dosa', amountPaise: 100000, familyId: 'B' }],
      extrasPaise: 25050,
      note: '',
      createdBy: 'u1',
      updatedBy: 'u1',
      pending: false,
    };
    const f = expenseToForm(saved, families);
    expect(f.amount).toBe('1250.50');
    expect(f.participants).toEqual(all);
    expect(f.extras).toBe('250.50');
    const again = formToExpense(f, families, 0.5).input;
    expect(again).toMatchObject({ amountPaise: 125050, extrasPaise: 25050, participants: [] });
  });
});

describe('helpers', () => {
  it('lets the creator and organisers edit', () => {
    expect(canEditExpense({ createdBy: 'u1' }, 'u1', false)).toBe(true);
    expect(canEditExpense({ createdBy: 'u1' }, 'u2', false)).toBe(false);
    expect(canEditExpense({ createdBy: 'u1' }, 'u2', true)).toBe(true);
  });

  it('groups by day, newest first', () => {
    const g = groupByDay([{ date: '2026-12-04' }, { date: '2026-12-05' }, { date: '2026-12-04' }]);
    expect(g.map(([d, l]) => [d, l.length])).toEqual([
      ['2026-12-05', 1],
      ['2026-12-04', 2],
    ]);
  });
});
