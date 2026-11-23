import { describe, expect, it } from 'vitest';
import { retryDelay } from './live';

describe('retryDelay', () => {
  it('backs off exponentially up to 30 seconds', () => {
    expect([0, 1, 2, 3].map(retryDelay)).toEqual([500, 1000, 2000, 4000]);
    expect(retryDelay(10)).toBe(30_000);
  });
});
