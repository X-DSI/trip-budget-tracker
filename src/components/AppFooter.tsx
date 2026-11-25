import { AUTHOR_URL, REPO_URL, build, channel, commitUrl, versionLabel } from '../lib/version';

const link = 'font-medium text-teal-700 underline-offset-2 hover:underline';

/** Version and credits, at the bottom of the More page. */
export function AppFooter() {
  const site = channel(build.projectId);
  const commit = commitUrl(build);
  return (
    <footer
      className="space-y-1 pt-2 pb-4 text-center text-xs text-slate-500"
      data-testid="app-footer"
    >
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {commit ? (
          <a
            href={commit}
            target="_blank"
            rel="noopener noreferrer"
            className="tabular-nums hover:underline"
            data-testid="app-version"
          >
            {versionLabel(build)}
          </a>
        ) : (
          <span className="tabular-nums" data-testid="app-version">
            {versionLabel(build)}
          </span>
        )}
        {site !== 'live' && (
          <span
            className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900"
            data-testid="site-badge"
          >
            {site === 'test' ? 'Test site' : 'Local build'}
          </span>
        )}
      </p>
      <p>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={link}>
          Built
        </a>{' '}
        with{' '}
        <span role="img" aria-label="love" className="text-rose-500">
          ♥
        </span>{' '}
        by{' '}
        <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer" className={link}>
          DSI
        </a>
      </p>
    </footer>
  );
}
