import { expect, type Page } from '@playwright/test';

export async function createTrip(page: Page, name: string) {
  await page.goto('/trips/new');
  await page.getByLabel('Trip name').fill(name);
  await page.getByLabel('Where to').fill('Ooty, Coorg');
  await page.getByLabel('Starts').fill('2026-12-04');
  await page.getByLabel('Ends').fill('2026-12-07');
  await page.getByLabel('Expected driving (km)').fill('850');
  await page.getByRole('button', { name: 'Create trip' }).click();
  await expect(page).toHaveURL('/trip');
  await expect(page.getByTestId('trip-name')).toHaveText(name);
}

export async function addLeg(page: Page, mode: string, from: string, to: string, km: string) {
  await page.getByRole('button', { name: 'Add leg' }).first().click();
  const sheet = page.getByRole('dialog');
  await sheet.getByText(mode, { exact: false }).first().click();
  await sheet.getByLabel('From').fill(from);
  await sheet.getByLabel('To', { exact: true }).fill(to);
  await sheet.getByLabel('Distance (km)').fill(km);
  await sheet.getByRole('button', { name: 'Add leg' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText(`${from} → ${to}`)).toBeVisible();
}

export async function addFamily(page: Page, name: string, adults: number) {
  await page.getByRole('button', { name: 'Add family' }).first().click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Family name').fill(name);
  for (let n = 2; n < adults; n++) await sheet.getByRole('button', { name: 'More adults' }).click();
  await sheet.getByRole('button', { name: 'Add family' }).click();
  await expect(sheet).toBeHidden();
  await expect(
    page.getByRole('paragraph').filter({ hasText: new RegExp(`^${name}$`) }),
  ).toBeVisible();
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Today ± `offset` days as YYYY-MM-DD in India, without depending on the runner's timezone. */
export function istDate(offset: number): string {
  const ist = new Date(Date.now() + 5.5 * 3600_000 + offset * 86_400_000);
  return ist.toISOString().slice(0, 10);
}

export async function setDates(page: Page, start: string, end: string) {
  await page.goto('/trip/edit');
  await page.getByLabel('Starts').fill(start);
  await page.getByLabel('Ends').fill(end);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL('/trip');
  await page.getByRole('link', { name: 'Home' }).first().click();
}

export async function pickMyFamily(page: Page, name: string) {
  await page.goto('/trip');
  await page.getByRole('combobox').filter({ hasText: 'Not chosen' }).selectOption({ label: name });
  // Let the write reach the server before the caller navigates away and reloads the page.
  await expect(page.getByText('Pick your family under')).toBeHidden();
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });
}

export async function openAddExpense(page: Page) {
  await page.goto('/expenses');
  await page
    .getByRole('button', { name: /Add expense/ })
    .filter({ visible: true })
    .click();
  return page.getByRole('dialog');
}
