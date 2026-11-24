import { expect, test } from '@playwright/test';
import { signIn } from './helpers';
import { addFamily, addLeg, createTrip, expectNoHorizontalScroll } from './trip-helpers';

test('an organiser plans a trip and a second adult joins by link @trip @layout', async ({
  page,
  browser,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `organiser-${suffix}`, 'Olive Organiser');
  await createTrip(page, `Ooty trip ${suffix}`);

  await addLeg(page, 'Car', 'Hosur', 'Ooty', '300');
  await addLeg(page, 'Train', 'Ooty', 'Mettupalayam', '46');
  await expect(page.getByText('346 km')).toBeVisible();

  await addFamily(page, 'Family A', 2);
  await addFamily(page, 'Family B', 4);
  await addFamily(page, 'Family C', 3);
  await addFamily(page, 'Family D', 3);
  await expect(page.getByText('4 families · 12 adults')).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.getByRole('button', { name: 'Create invite link' }).click();
  const link = await page.getByTestId('invite-link').inputValue();
  expect(link).toMatch(/\/join\/[A-Za-z0-9_-]{22}$/);

  // A second adult, on their own phone.
  const other = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  const guest = await other.newPage();
  await signIn(guest, `guest-${suffix}`, 'Gita Guest');
  await guest.goto(new URL(link).pathname);
  await expect(guest.getByTestId('inviter')).toHaveText('Olive Organiser invited you to');
  await expect(guest.getByTestId('invite-trip-name')).toHaveText(`Ooty trip ${suffix}`);
  await guest.getByRole('button', { name: 'Join the trip' }).click();
  await expect(guest.getByTestId('joined-trip-name')).toHaveText(`Ooty trip ${suffix}`);
  await guest.getByRole('button', { name: /Family B/ }).click();

  await expect(guest).toHaveURL('/trip');
  await expect(guest.getByTestId('trip-name')).toHaveText(`Ooty trip ${suffix}`);
  await expect(guest.getByText('Hosur → Ooty')).toBeVisible();
  // Members can't edit the plan.
  await expect(guest.getByRole('button', { name: 'Add leg' })).toHaveCount(0);
  await expectNoHorizontalScroll(guest);
  await other.close();

  // The organiser sees the new person in Family B.
  await expect(page.getByText('Gita Guest', { exact: true }).first()).toBeVisible();
});

test('editing a leg offline shows it at once and syncs later @offline', async ({
  page,
  context,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `offline-${suffix}`, 'Omar Offline');
  await createTrip(page, `Offline trip ${suffix}`);
  await addLeg(page, 'Car', 'Hosur', 'Coorg', '280');
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });

  await context.setOffline(true);
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Hosur → Coorg' })
    .getByRole('button', { name: 'Edit' })
    .click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Distance (km)').fill('310');
  await sheet.getByRole('button', { name: 'Save leg' }).click();

  await expect(page.getByText('310 km').first()).toBeVisible();
  await expect(page.getByTestId('pending-sync')).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 30_000 });
});
