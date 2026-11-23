import { expect, test, type Page } from '@playwright/test';
import { signIn } from './helpers';

async function createTrip(page: Page, name: string) {
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

async function addLeg(page: Page, mode: string, from: string, to: string, km: string) {
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

async function addFamily(page: Page, name: string, adults: number) {
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

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test('an organiser plans a trip and a second adult joins by link @trip @layout', async ({
  page,
  browser,
}, testInfo) => {
  const suffix = testInfo.project.name;
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
  await expect(page.getByText('Gita Guest', { exact: true })).toBeVisible();
});

test('editing a leg offline shows it at once and syncs later @offline', async ({
  page,
  context,
}, testInfo) => {
  const suffix = testInfo.project.name;
  await signIn(page, `offline-${suffix}`, 'Omar Offline');
  await createTrip(page, `Offline trip ${suffix}`);
  await addLeg(page, 'Car', 'Hosur', 'Coorg', '280');
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Edit' }).nth(1).click(); // [0] is the trip's Edit link
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Distance (km)').fill('310');
  await sheet.getByRole('button', { name: 'Save leg' }).click();

  await expect(page.getByText('310 km').first()).toBeVisible();
  await expect(page.getByTestId('pending-sync')).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 30_000 });
});
