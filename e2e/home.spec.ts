import { expect, test } from '@playwright/test';
import { signIn } from './helpers';
import { addFamily, createTrip, inviteGuest, pickMyFamily } from './trip-helpers';

test('Home: quick add, important info with tappable phones, budget and recent expenses @dashboard', async ({
  page,
  browser,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `home-org-${suffix}`, 'Olive Organiser');
  await createTrip(page, `Home trip ${suffix}`);
  await addFamily(page, 'Family A', 2);
  await addFamily(page, 'Family B', 2);
  await pickMyFamily(page, 'Family A');

  // Important info: organisers add it from Home.
  await page.goto('/');
  const info = page.getByTestId('important-info');
  await info.getByRole('button', { name: 'Add' }).click();
  await page
    .getByRole('dialog')
    .getByRole('textbox')
    .fill('Sterling Fern Hill, Ooty\nDriver Ravi: 98765 43210\nAdvance paid ₹25,000 on 01/12');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(info).toContainText('Sterling Fern Hill');
  await expect(info.getByRole('link', { name: '98765 43210' })).toHaveAttribute(
    'href',
    'tel:+919876543210',
  );
  await expect(info.getByRole('link')).toHaveCount(1); // the amount and date stay plain text
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });

  // A budget line, so "budget at a glance" appears.
  await page.goto('/money/budget');
  await page.getByRole('button', { name: 'Add budget line' }).click();
  const budgetSheet = page.getByRole('dialog');
  await budgetSheet.getByLabel('Amount (₹)').fill('10000');
  await budgetSheet.getByText('Equal per family', { exact: true }).click();
  await budgetSheet.getByRole('button', { name: 'Add to budget' }).click();
  await expect(budgetSheet).toBeHidden();
  // Full page loads below: let each write reach the server first (a write made a split second
  // before a reload can be lost; see docs/dry-run.md).
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });

  // Quick add opens the add-expense sheet directly.
  await page.goto('/');
  await page.getByTestId('quick-add').click();
  await expect(page).toHaveURL('/expenses');
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByLabel('Amount (₹)')).toBeVisible();
  await sheet.getByLabel('Amount (₹)').fill('2500');
  await sheet.getByLabel('What for').fill('Fuel at Hosur');
  await sheet.getByText('Equal per family', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Add expense' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });

  await page.getByRole('link', { name: 'Home' }).first().click();
  await expect(page.getByTestId('recent-expenses')).toContainText('Fuel at Hosur');
  await expect(page.getByTestId('budget-glance')).toContainText('₹2,500 of ₹10,000');
  await expect(page.getByTestId('budget-glance')).toContainText('Your family: ₹1,250 of ₹5,000');

  // A member sees the info, with the phone link, but can't edit it.
  const { guest, close } = await inviteGuest(
    page,
    browser,
    `home-guest-${suffix}`,
    'Gita Guest',
    'Family B',
  );
  await guest.goto('/');
  const guestInfo = guest.getByTestId('important-info');
  await expect(guestInfo).toContainText('Driver Ravi');
  await expect(guestInfo.getByRole('link', { name: '98765 43210' })).toBeVisible();
  await expect(guestInfo.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  await close();
});

test('Home renders every card from cache with no network @dashboard @offline', async ({
  page,
  context,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `home-off-${suffix}`, 'Omar Offline');
  await createTrip(page, `Home offline ${suffix}`);
  await addFamily(page, 'Family A', 2);
  await pickMyFamily(page, 'Family A');
  await page.goto('/');
  await page.getByTestId('important-info').getByRole('button', { name: 'Add' }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('Hotel desk: 0423 2444444');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('important-info')).toContainText('Hotel desk');
  await expect(page.getByTestId('quick-add')).toBeVisible();
  await context.setOffline(false);
});
