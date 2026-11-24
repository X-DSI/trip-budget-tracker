// Light / dark theme. The choice (System, Light, Dark) is stored on this device; "System" follows
// the phone's setting. index.html applies it before React renders, so there's no flash.

export type ThemePref = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'tbt.theme';
const STATUS_BAR: Record<Theme, string> = { light: '#0f766e', dark: '#020617' };

export function resolveTheme(pref: ThemePref, systemDark: boolean): Theme {
  if (pref === 'system') return systemDark ? 'dark' : 'light';
  return pref;
}

function readPref(): ThemePref {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemDark(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', STATUS_BAR[theme]);
}

// ---------- a tiny store, shared by the setting in More and the controller in App ----------

type Listener = () => void;
const listeners = new Set<Listener>();
let current: ThemePref = typeof window === 'undefined' ? 'system' : readPref();

export function getThemePref(): ThemePref {
  return current;
}

export function setThemePref(pref: ThemePref) {
  current = pref;
  try {
    if (pref === 'system') window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Not remembered, but still applied for this visit.
  }
  applyTheme(resolveTheme(pref, systemDark()));
  listeners.forEach((l) => l());
}

export function subscribeThemePref(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Keep the page in step with the phone's setting while the preference is "System". */
export function watchSystemTheme(): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (current === 'system') applyTheme(resolveTheme('system', mq.matches));
  };
  applyTheme(resolveTheme(current, mq.matches));
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
