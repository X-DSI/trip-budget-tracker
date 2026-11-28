import { expect, test } from '@playwright/test';
import { signIn } from './helpers';
import { addFamily, createTrip, openAddExpense, pickMyFamily } from './trip-helpers';

test('someone else’s new expense shows on the Expenses tab until you look @unseen', async ({
  page,
  browser,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `unseen-org-${suffix}`, 'Olive Organiser');
  await createTrip(page, `Unseen trip ${suffix}`);
  await addFamily(page, 'Family A', 2);
  await addFamily(page, 'Family B', 3);
  await pickMyFamily(page, 'Family A');

  // My own expense never counts as new.
  const sheet = await openAddExpense(page);
  await sheet.getByLabel('Amount (₹)').fill('120');
  await sheet.getByLabel('What for').fill('Tea');
  await sheet.getByText('Equal per family', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Add expense' }).click();
  await expect(page.getByTestId('expense-list')).toContainText('Tea');
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });

  await page.goto('/trip');
  await page.getByRole('button', { name: 'Create invite link' }).click();
  const link = await page.getByTestId('invite-link').inputValue();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  // Bottom tabs on phones, sidebar on desktop: only the visible one is the 'Main' navigation.
  const tab = page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: /^Expenses/ });
  await expect(tab).toHaveAccessibleName('Expenses');
  await expect(page.getByTestId('nav-badge')).toHaveCount(0);

  // A second adult joins and adds an expense.
  const other = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  const guest = await other.newPage();
  await signIn(guest, `unseen-guest-${suffix}`, 'Gita Guest');
  await guest.goto(new URL(link).pathname);
  await guest.getByRole('button', { name: 'Join the trip' }).click();
  await guest.getByRole('button', { name: /Family B/ }).click();
  await expect(guest).toHaveURL('/trip');
  const guestSheet = await openAddExpense(guest);
  await guestSheet.getByLabel('Amount (₹)').fill('2000');
  await guestSheet.getByLabel('What for').fill('Fuel top-up');
  await guestSheet.getByText('Equal per family', { exact: true }).click();
  await guestSheet.getByRole('button', { name: 'Add expense' }).click();
  await expect(guest.getByTestId('expense-list')).toContainText('Fuel top-up');
  await expect(guest.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });
  // Their own expense doesn't badge their tab.
  await expect(guest.getByTestId('nav-badge')).toHaveCount(0);
  await other.close();

  // The organiser, still on Home, sees the count arrive.
  await expect(tab).toHaveAccessibleName('Expenses, 1 new', { timeout: 15_000 });
  await tab.click();
  await expect(page).toHaveURL('/expenses');
  const list = page.getByTestId('expense-list');
  await expect(list.getByRole('button', { name: /Fuel top-up/ })).toHaveAttribute(
    'data-unseen',
    'new',
  );
  await expect(list.getByRole('button', { name: /Tea/ })).not.toHaveAttribute('data-unseen');
  await expect(list.getByTestId('unseen-label')).toHaveText(['New']);
  // Looking clears the count; coming back later, nothing is new.
  await expect(tab).toHaveAccessibleName('Expenses');
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await tab.click();
  await expect(list.getByRole('button', { name: /Fuel top-up/ })).toBeVisible();
  await expect(list.getByTestId('unseen-label')).toHaveCount(0);
});
