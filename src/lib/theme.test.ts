import { afterEach, describe, expect, it } from 'vitest';
import { applyTheme, getThemePref, resolveTheme, setThemePref, THEME_KEY } from './theme';

afterEach(() => {
  setThemePref('system');
  document.documentElement.classList.remove('dark');
});

describe('resolveTheme', () => {
  it('follows the phone only when set to System', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('theme preference', () => {
  it('stores Light/Dark, forgets System, and applies the class', () => {
    setThemePref('dark');
    expect(getThemePref()).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    setThemePref('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    setThemePref('system');
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it('updates the status-bar colour', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
    applyTheme('dark');
    expect(meta.content).toBe('#020617');
    applyTheme('light');
    expect(meta.content).toBe('#0f766e');
    meta.remove();
  });
});
