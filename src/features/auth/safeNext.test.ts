import { describe, expect, it } from 'vitest';
import { safeNext } from './safeNext';
import { firstName } from '../../lib/names';

describe('safeNext', () => {
  it('keeps same-app paths and rejects anything that could leave the app', () => {
    expect(safeNext('/trip?x=1')).toBe('/trip?x=1');
    expect(safeNext(null)).toBe('/');
    expect(safeNext('https://evil.example')).toBe('/');
    expect(safeNext('//evil.example')).toBe('/');
  });
});

describe('firstName', () => {
  it('uses the first word of the display name, with a friendly fallback', () => {
    expect(firstName('Daniel S I')).toBe('Daniel');
    expect(firstName('  ')).toBe('there');
    expect(firstName(undefined)).toBe('there');
  });
});
