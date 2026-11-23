import { AppLogo } from './Icons';

export function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50" aria-busy="true">
      <AppLogo className="h-14 w-14 animate-pulse motion-reduce:animate-none" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
