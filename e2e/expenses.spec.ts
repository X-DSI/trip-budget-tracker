import { expect, test, type Page } from '@playwright/test';
import { signIn } from './helpers';
import { addFamily, createTrip } from './trip-helpers';

async function pickMyFamily(page: Page, name: string) {
  await page.goto('/trip');
  await page.getByRole('combobox').filter({ hasText: 'Not chosen' }).selectOption({ label: name });
}

async function openAddExpense(page: Page) {
  await page.goto('/expenses');
  await page
    .getByRole('button', { name: /Add expense/ })
    .filter({ visible: true })
    .click();
  return page.getByRole('dialog');
}

test('a per-head dinner splits exactly, and only its creator or an organiser can edit it @expenses', async ({
  page,
  browser,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `exp-org-${suffix}`, 'Olive Organiser');
  await createTrip(page, `Expenses trip ${suffix}`);
  await addFamily(page, 'Family A', 2);
  await addFamily(page, 'Family B', 4);
  await addFamily(page, 'Family C', 3);
  await addFamily(page, 'Family D', 3);
  await pickMyFamily(page, 'Family A');

  const sheet = await openAddExpense(page);
  await sheet.getByLabel('Amount (₹)').fill('4000');
  await sheet.getByLabel('What for').fill('Dinner at the dhaba');
  await sheet.getByText('Per head', { exact: true }).click();
  const preview = sheet.getByTestId('share-preview');
  await expect(preview).toContainText('₹666.67');
  await expect(preview).toContainText('₹1,333.33');
  await expect(preview.getByText('₹1,000.00')).toHaveCount(2);
  await sheet.getByRole('button', { name: 'Add expense' }).click();
  await expect(sheet).toBeHidden();

  await expect(page.getByTestId('expense-list')).toContainText('Dinner at the dhaba');
  await expect(page.getByTestId('trip-total')).toHaveText('₹4,000');

  // A second adult joins and tries to change the organiser's expense.
  await page.goto('/trip');
  await page.getByRole('button', { name: 'Create invite link' }).click();
  const link = await page.getByTestId('invite-link').inputValue();

  const other = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  const guest = await other.newPage();
  await signIn(guest, `exp-guest-${suffix}`, 'Gita Guest');
  await guest.goto(new URL(link).pathname);
  await guest.getByRole('button', { name: 'Join the trip' }).click();
  await guest.getByRole('button', { name: /Family B/ }).click();
  await expect(guest).toHaveURL('/trip');

  await guest.goto('/expenses');
  await guest.getByText('Dinner at the dhaba').click();
  await expect(guest.getByTestId('expense-details')).toBeVisible();
  await expect(guest.getByRole('button', { name: 'Save changes' })).toHaveCount(0);
  await guest.getByRole('button', { name: 'Close' }).click();

  // The guest adds their own expense; the organiser can still edit it.
  const guestSheet = await openAddExpense(guest);
  await guestSheet.getByLabel('Amount (₹)').fill('2000');
  await guestSheet.getByLabel('What for').fill('Fuel top-up');
  await guestSheet.getByText('Equal per family', { exact: true }).click();
  await guestSheet.getByRole('button', { name: 'Add expense' }).click();
  await expect(guest.getByTestId('expense-list')).toContainText('Fuel top-up');
  await other.close();

  await page.goto('/expenses');
  await page.getByText('Fuel top-up').click();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
});

test('an expense added offline shows at once and syncs later @expenses @offline', async ({
  page,
  context,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `exp-off-${suffix}`, 'Omar Offline');
  await createTrip(page, `Offline expenses ${suffix}`);
  await addFamily(page, 'Family A', 2);
  await addFamily(page, 'Family B', 2);
  await pickMyFamily(page, 'Family A');
  await page.goto('/expenses');
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });

  await context.setOffline(true);
  await page
    .getByRole('button', { name: /Add expense/ })
    .filter({ visible: true })
    .click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Amount (₹)').fill('850');
  await sheet.getByLabel('What for').fill('Toll plaza');
  await sheet.getByText('Equal per family', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Add expense' }).click();

  await expect(page.getByTestId('expense-list')).toContainText('Toll plaza');
  await expect(page.getByTestId('expense-pending')).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByTestId('expense-pending')).toBeHidden({ timeout: 30_000 });
});
