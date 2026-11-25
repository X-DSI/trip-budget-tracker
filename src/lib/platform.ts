export interface PlatformInfo {
  userAgent: string;
  maxTouchPoints: number;
  standalone: boolean;
}

export function currentPlatform(): PlatformInfo {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    standalone:
      nav.standalone === true ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches),
  };
}

/** iPhone, iPad, or an iPad that reports itself as a Mac. */
export function isIOS(p: PlatformInfo): boolean {
  return (
    /iPhone|iPad|iPod/.test(p.userAgent) || (/Macintosh/.test(p.userAgent) && p.maxTouchPoints > 1)
  );
}

/** Safari proper — not Chrome, Firefox or Edge on iOS, which can't add web apps the same way. */
export function isIOSSafari(p: PlatformInfo): boolean {
  return isIOS(p) && /Safari/.test(p.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(p.userAgent);
}

/** Show the "Add to Home Screen" hint only where it applies and isn't done yet. */
export function shouldShowInstallHint(p: PlatformInfo): boolean {
  return isIOSSafari(p) && !p.standalone;
}

/** One line telling this phone or computer how to install the app. */
export function installSteps(p: PlatformInfo): string {
  if (isIOSSafari(p)) return 'In Safari, tap Share, then Add to Home Screen';
  if (isIOS(p)) return 'Open this page in Safari, then tap Share → Add to Home Screen';
  if (/Android/.test(p.userAgent))
    return 'In Chrome, tap ⋮, then Install app or Add to Home screen';
  return 'Use the install icon in the address bar, or the browser menu → Install';
}
