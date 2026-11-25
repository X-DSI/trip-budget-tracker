import { Outlet, useLocation } from 'react-router';
import { BottomTabs } from './BottomTabs';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { titleForPath } from './nav';
import { InstallHint } from '../InstallHint';
import { AppFooter } from '../AppFooter';

export function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={titleForPath(pathname)} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 lg:px-8 lg:pt-8 lg:pb-12">
          <InstallHint />
          <Outlet />
          {/* Desktop shows this in the sidebar instead. */}
          <AppFooter className="lg:hidden" />
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
