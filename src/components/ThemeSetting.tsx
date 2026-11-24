import { useEffect, useSyncExternalStore } from 'react';
import {
  getThemePref,
  setThemePref,
  subscribeThemePref,
  watchSystemTheme,
  type ThemePref,
} from '../lib/theme';

/** Mounted once in App: follows the phone's light/dark setting while the choice is "System". */
export function ThemeController() {
  useEffect(() => watchSystemTheme(), []);
  return null;
}

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSetting() {
  const pref = useSyncExternalStore(subscribeThemePref, getThemePref, getThemePref);
  return (
    <fieldset data-testid="theme-setting">
      <legend className="font-medium text-slate-900">Appearance</legend>
      <p className="mt-1 text-sm text-slate-600">System follows your phone's light or dark mode.</p>
      <div className="mt-3 flex rounded-2xl bg-slate-200/70 p-1">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-center text-sm font-medium select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 ${
              pref === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={o.value}
              checked={pref === o.value}
              onChange={() => setThemePref(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
