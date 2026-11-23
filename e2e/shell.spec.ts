import { expect, test } from '@playwright/test';
import { signIn, waitForServiceWorker } from './helpers';

test('signed-out visitors land on the sign-in page @auth', async ({ page }) => {
  await page.goto('/expenses');
  await expect(page).toHaveURL(/\/signin\?next=%2Fexpenses/);
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
});

test('phone shows bottom tabs, desktop shows the sidebar @layout', async ({ page }, testInfo) => {
  await signIn(page);
  await expect(page.getByRole('heading', { name: /Hi Alice!/ })).toBeVisible();

  const tabs = page.getByTestId('bottom-tabs');
  const sidebar = page.getByTestId('sidebar');

  if (testInfo.project.name === 'phone') {
    await expect(tabs).toBeVisible();
    await expect(sidebar).toBeHidden();
    await tabs.getByRole('link', { name: 'Expenses' }).click();
  } else {
    await expect(sidebar).toBeVisible();
    await expect(tabs).toBeHidden();
    await sidebar.getByRole('link', { name: 'Expenses' }).click();
  }
  await expect(page).toHaveURL('/expenses');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Expenses');

  // No horizontal scrolling at either size.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the app shell reloads with no network and says it is offline @offline', async ({
  page,
  context,
}) => {
  await signIn(page);
  await waitForServiceWorker(page);
  // Reload once online so the service worker controls the page.
  await page.reload();
  await expect(page.getByRole('heading', { name: /Hi Alice!/ })).toBeVisible();

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { name: /Hi Alice!/ })).toBeVisible();
  await expect(page.getByTestId('online-indicator')).toHaveText('Offline');
  await expect(page.getByTestId('top-bar')).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByTestId('online-indicator')).toHaveAttribute('data-online', 'true');
});
