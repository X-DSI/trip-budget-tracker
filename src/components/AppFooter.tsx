import { AUTHOR_URL, REPO_URL, build, channel, commitUrl, versionLabel } from '../lib/version';

const link = 'font-medium text-teal-700 underline-offset-2 hover:underline';

/**
 * Version and credits. `page` sits centred under every screen's content (phones and the sign-in
 * page); `sidebar` sits at the bottom of the desktop navigation.
 */
export function AppFooter({
  layout = 'page',
  className = '',
}: {
  layout?: 'page' | 'sidebar';
  className?: string;
}) {
  const site = channel(build.projectId);
  const commit = commitUrl(build);
  const align = layout === 'page' ? 'justify-center text-center' : 'justify-start text-left';
  return (
    <footer
      className={`space-y-1 text-xs text-slate-500 ${layout === 'page' ? 'pt-6 pb-2' : 'px-6 py-4'} ${className}`}
      data-testid={layout === 'page' ? 'app-footer' : 'sidebar-footer'}
    >
      <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${align}`}>
        {commit ? (
          <a
            href={REPO_URL + '/commit/' + commit}
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
      <p className={align}>
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
