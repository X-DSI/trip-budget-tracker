import { describe, expect, it } from 'vitest';
import type { TripExpense } from './model';
import { changeLines, expensesToCsv, formatWhen, spendingByCategory } from './report';

const families = [
  { id: 'A', name: 'Anna’s family', adults: 2, kids: 2, order: 1, active: true },
  { id: 'D', name: 'Danny’s family', adults: 2, kids: 0, order: 0, active: true },
];
const names: Record<string, string> = { u1: 'Anna', u2: 'Danny' };
const memberName = (uid: string) => names[uid] ?? 'Someone';

const base = (over: Partial<TripExpense>): TripExpense => ({
  id: 'x',
  title: 'Dinner',
  category: 'food',
  amountPaise: 100000,
  paidByFamilyId: 'A',
  date: '2026-12-04',
  splitMode: 'equal_family',
  participants: [],
  note: '',
  createdBy: 'u1',
  updatedBy: 'u1',
  pending: false,
  ...over,
});

describe('expensesToCsv', () => {
  const csv = expensesToCsv(
    [
      base({
        id: '2',
        title: 'Hotel, "deluxe"',
        category: 'stay',
        amountPaise: 1200001,
        date: '2026-12-05',
        updatedBy: 'u2',
      }),
      base({ id: '1', title: '=SUM(A1)', splitMode: 'per_head', amountPaise: 99999 }),
      base({ id: '3', title: 'Gone', deleted: true }),
    ],
    families,
    0.5,
    memberName,
  );
  const lines = csv
    .replace(/^\uFEFF/, '')
    .trim()
    .split('\r\n');

  it('starts with a BOM and a header with one share column per family, in family order', () => {
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(lines[0]).toBe(
      'Date,Title,Category,Amount (₹),Paid by,Split,Shared by,Danny’s family share (₹),Anna’s family share (₹),Note,Added by,Last edited by',
    );
  });

  it('has one row per non-deleted expense, oldest first', () => {
    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatch(/^2026-12-04,'=SUM\(A1\),Food,999\.99,/);
    expect(lines[2]).toMatch(/^2026-12-05,"Hotel, ""deluxe""",Stay,12000\.01,/);
    expect(lines[2]).toMatch(/,Anna,Danny$/);
  });

  it('gives shares that add up to the amount', () => {
    for (const line of lines.slice(1)) {
      // Amount is the 4th column; shares are columns 8 and 9 (no commas inside these rows' other cells but the quoted title).
      const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, ''));
      const amount = Math.round(Number(cells[3]) * 100);
      const shares = Math.round(Number(cells[7]) * 100) + Math.round(Number(cells[8]) * 100);
      expect(shares).toBe(amount);
    }
  });
});

describe('spendingByCategory', () => {
  it('sorts by spend, gives percentages and your family’s share, and skips deleted', () => {
    const r = spendingByCategory(
      [
        base({ category: 'food', amountPaise: 30000 }),
        base({ category: 'stay', amountPaise: 60000 }),
        base({ category: 'fuel', amountPaise: 10000 }),
        base({ category: 'stay', amountPaise: 99999, deleted: true }),
      ],
      families,
      0.5,
      'D',
    );
    expect(r.totalPaise).toBe(100000);
    expect(r.rows.map((x) => [x.category, x.percent, x.minePaise])).toEqual([
      ['stay', 60, 30000],
      ['food', 30, 15000],
      ['fuel', 10, 5000],
    ]);
  });

  it('leaves your share empty when you have no family', () => {
    const r = spendingByCategory([base({})], families, 0.5, null);
    expect(r.rows[0]!.minePaise).toBeNull();
  });
});

describe('who changed it', () => {
  const t = Date.UTC(2026, 11, 4, 15, 40); // 9:10 pm in India
  it('formats times in the trip’s time zone', () => {
    expect(formatWhen(t)).toBe('4 Dec, 9:10 pm');
  });
  it('shows the editor only when someone changed it later', () => {
    expect(changeLines(base({ createdAtMs: t, updatedAtMs: t }), memberName)).toEqual([
      'Added by Anna on 4 Dec, 9:10 pm',
    ]);
    expect(
      changeLines(
        base({ updatedBy: 'u2', createdAtMs: t, updatedAtMs: t + 86_400_000 }),
        memberName,
      ),
    ).toEqual(['Added by Anna on 4 Dec, 9:10 pm', 'Last edited by Danny on 5 Dec, 9:10 pm']);
    expect(changeLines(base({ createdBy: 'zz', updatedBy: 'zz' }), memberName)).toEqual([
      'Added by Someone',
    ]);
  });
});
