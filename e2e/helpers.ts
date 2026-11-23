import type { Page } from '@playwright/test';

/** Sign in through the auth emulator (test-only hook exposed in e2e builds). */
export async function signIn(page: Page, uid = 'alice', name = 'Alice Traveller') {
  await page.goto('/signin');
  await page.waitForFunction(() => '__e2eSignIn' in window);
  await page.evaluate(
    ([u, n]) =>
      (
        window as unknown as {
          __e2eSignIn: (uid: string, name: string, email: string) => Promise<void>;
        }
      ).__e2eSignIn(u!, n!, `${u}@example.com`),
    [uid, name],
  );
  await page.waitForURL('/');
}

/** Wait until the service worker controls the page, so the shell is precached. */
export async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
}
