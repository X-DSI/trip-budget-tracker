// What build this is, for the footer on the More page and for bug reports.

export const REPO_URL = 'https://github.com/X-DSI/trip-budget-tracker';
export const AUTHOR_URL = 'https://github.com/X-DSI';

export interface BuildInfo {
  version: string;
  commit: string;
  builtAt: string;
  projectId: string;
}

export const build: BuildInfo = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  builtAt: __APP_BUILT_AT__,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
};

/** Which site this is: the real trip, the test site, or a local or e2e build. */
export function channel(projectId: string): 'live' | 'test' | 'local' {
  if (projectId === 'x-dsi-trip-budget') return 'live';
  if (projectId === 'x-dsi-trip-budget-dev') return 'test';
  return 'local';
}

/** "v0.2.0 · 40bc231 · 25 Nov 2026" */
export function versionLabel(b: BuildInfo, timeZone = 'Asia/Kolkata'): string {
  const date = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(new Date(b.builtAt));
  return `v${b.version} · ${b.commit} · ${date}`;
}

/** Link to the exact commit this build came from (none for local builds). */
export function commitUrl(b: BuildInfo): string | null {
  return /^[0-9a-f]{7,40}$/.test(b.commit) ? `${REPO_URL}/commit/${b.commit}` : null;
}
