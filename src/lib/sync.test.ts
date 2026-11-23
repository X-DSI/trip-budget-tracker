import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getPendingCount,
  reportPending,
  resetSyncState,
  subscribePending,
  trackWrite,
} from './sync';

afterEach(() => resetSyncState());

describe('pending sync tracking', () => {
  it('counts a write until the server acknowledges it', async () => {
    let resolve!: () => void;
    const write = trackWrite(new Promise<void>((r) => (resolve = r)));
    expect(getPendingCount()).toBe(1);
    resolve();
    await write;
    expect(getPendingCount()).toBe(0);
  });

  it('stops counting a write that fails', async () => {
    const write = trackWrite(Promise.reject(new Error('denied')));
    expect(getPendingCount()).toBe(1);
    await expect(write).rejects.toThrow('denied');
    expect(getPendingCount()).toBe(0);
  });

  it('counts each listener with pending writes once', () => {
    reportPending('users/a', true);
    reportPending('users/a', true);
    reportPending('trips/x', true);
    expect(getPendingCount()).toBe(2);
    reportPending('users/a', false);
    expect(getPendingCount()).toBe(1);
  });

  it('notifies subscribers only on change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribePending(listener);
    reportPending('a', true);
    reportPending('a', true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    reportPending('a', false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
