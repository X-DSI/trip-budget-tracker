import { describe, expect, it } from 'vitest';
import { latestStamp, unseenExpenses } from './unseen';

const e = (
  id: string,
  createdBy: string,
  createdAtMs: number,
  over: Partial<{ updatedBy: string; updatedAtMs: number; deleted: boolean }> = {},
) => ({
  id,
  createdBy,
  createdAtMs,
  updatedBy: over.updatedBy ?? createdBy,
  updatedAtMs: over.updatedAtMs ?? createdAtMs,
  deleted: over.deleted ?? false,
});

describe('unseenExpenses', () => {
  const list = [
    e('old', 'anna', 100),
    e('mine', 'me', 300),
    e('new', 'anna', 300),
    e('edited', 'me', 100, { updatedBy: 'ravi', updatedAtMs: 300 }),
    e('editedByMe', 'anna', 100, { updatedBy: 'me', updatedAtMs: 300 }),
    e('gone', 'anna', 300, { deleted: true }),
    { id: 'pending', createdBy: 'me', updatedBy: 'me', deleted: false },
  ];

  it('counts only what someone else added or edited since you looked', () => {
    expect([...unseenExpenses(list, 'me', 200)]).toEqual([
      ['new', 'new'],
      ['edited', 'edited'],
    ]);
  });

  it('shows nothing on the first visit', () => {
    expect(unseenExpenses(list, 'me', null).size).toBe(0);
  });

  it('calls it new, not edited, when someone else added and then changed it', () => {
    const m = unseenExpenses([e('x', 'anna', 300, { updatedAtMs: 400 })], 'me', 200);
    expect(m.get('x')).toBe('new');
  });
});

describe('latestStamp', () => {
  it('is the newest server time, ignoring writes not on the server yet', () => {
    expect(
      latestStamp([
        e('a', 'x', 100, { updatedAtMs: 500 }),
        e('b', 'y', 300),
        { id: 'p', createdBy: 'z', updatedBy: 'z' },
      ]),
    ).toBe(500);
    expect(latestStamp([])).toBe(0);
  });
});
