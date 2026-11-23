import { describe, expect, it } from 'vitest';
import { isIOS, isIOSSafari, shouldShowInstallHint, type PlatformInfo } from './platform';

const iphoneSafari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const iphoneChrome =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1';
const ipadAsMac =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';
const android =
  'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';

const p = (userAgent: string, extra: Partial<PlatformInfo> = {}): PlatformInfo => ({
  userAgent,
  maxTouchPoints: 0,
  standalone: false,
  ...extra,
});

describe('platform detection', () => {
  it('recognises iPhones and iPads that report as Macs', () => {
    expect(isIOS(p(iphoneSafari))).toBe(true);
    expect(isIOS(p(ipadAsMac, { maxTouchPoints: 5 }))).toBe(true);
    expect(isIOS(p(ipadAsMac))).toBe(false); // a real Mac has no touch points
    expect(isIOS(p(android))).toBe(false);
  });

  it('only treats real Safari as Safari', () => {
    expect(isIOSSafari(p(iphoneSafari))).toBe(true);
    expect(isIOSSafari(p(iphoneChrome))).toBe(false);
  });

  it('shows the install hint only in iOS Safari, not once installed', () => {
    expect(shouldShowInstallHint(p(iphoneSafari))).toBe(true);
    expect(shouldShowInstallHint(p(iphoneSafari, { standalone: true }))).toBe(false);
    expect(shouldShowInstallHint(p(android))).toBe(false);
  });
});
