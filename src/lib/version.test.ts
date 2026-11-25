import { describe, expect, it } from 'vitest';
import { build, channel, commitUrl, versionLabel } from './version';

describe('version', () => {
  it('reads the build-time values', () => {
    expect(build.version).toBe('9.9.9');
    expect(build.commit).toBe('abc1234');
  });

  it('labels the build with version, commit and date in India', () => {
    expect(versionLabel({ ...build, builtAt: '2026-11-24T20:00:00.000Z' })).toBe(
      'v9.9.9 · abc1234 · 25 Nov 2026',
    );
  });

  it('links to the commit, except for local builds', () => {
    expect(commitUrl(build)).toBe('https://github.com/X-DSI/trip-budget-tracker/commit/abc1234');
    expect(commitUrl({ ...build, commit: 'local' })).toBeNull();
  });

  it('knows the live site from the test site', () => {
    expect(channel('x-dsi-trip-budget')).toBe('live');
    expect(channel('x-dsi-trip-budget-dev')).toBe('test');
    expect(channel('demo-trip-budget')).toBe('local');
  });
});
