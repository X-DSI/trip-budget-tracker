import { expect, test } from '@playwright/test';
import { signIn, waitForServiceWorker } from './helpers';
import { istDate, setDates } from './trip-helpers';

test('the dashboard counts down, welcomes you during the trip, and wraps up after @dashboard @offline', async ({
  page,
  context,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `dash-${suffix}`, 'Dev Dashboard');

  // No trip yet: friendly empty state.
  await expect(page.getByTestId('dashboard')).toHaveAttribute('data-phase', 'none');
  await expect(page.getByRole('link', { name: 'Plan a trip' })).toBeVisible();

  // Before: countdown and checklist.
  await page.goto('/trips/new');
  await page.getByLabel('Trip name').fill('Coorg getaway');
  await page.getByLabel('Where to').fill('Coorg');
  await page.getByLabel('Starts').fill(istDate(10));
  await page.getByLabel('Ends').fill(istDate(13));
  await page.getByRole('button', { name: 'Create trip' }).click();
  await expect(page).toHaveURL('/trip');
  await page.getByRole('link', { name: 'Home' }).first().click();

  const dashboard = page.getByTestId('dashboard');
  await expect(dashboard).toHaveAttribute('data-phase', 'before');
  await expect(page.getByRole('heading', { name: 'Coorg getaway starts in' })).toBeVisible();
  await expect(page.getByTestId('countdown')).toContainText(/\d\d\s*days/i);
  await expect(page.getByTestId('checklist')).toContainText('Everyone has joined');

  // Works offline after an online visit.
  await waitForServiceWorker(page);
  await page.reload();
  await expect(dashboard).toHaveAttribute('data-phase', 'before');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('dashboard')).toHaveAttribute('data-phase', 'before');
  await expect(page.getByTestId('countdown')).toBeVisible();
  await context.setOffline(false);

  // During: second day of a four-day trip.
  await setDates(page, istDate(-1), istDate(2));
  await expect(dashboard).toHaveAttribute('data-phase', 'during');
  await expect(page.getByTestId('day-of-trip')).toHaveText('Day 2 of 4');
  await expect(page.getByRole('heading', { name: 'Enjoy Coorg, Dev!' })).toBeVisible();

  // After: welcome back and a nudge to settle up.
  await setDates(page, istDate(-5), istDate(-2));
  await expect(dashboard).toHaveAttribute('data-phase', 'after');
  await expect(
    page.getByRole('heading', { name: 'Hope Coorg getaway was wonderful' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'See balances' })).toBeVisible();
});
