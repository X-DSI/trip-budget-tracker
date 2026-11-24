import { expect, test } from '@playwright/test';
import { signIn } from './helpers';
import { addFamily, addPlan, createTrip, expectNoHorizontalScroll } from './trip-helpers';

test('an organiser plans the days and a second adult joins by link @trip @itinerary @layout', async ({
  page,
  browser,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `organiser-${suffix}`, 'Olive Organiser');
  await createTrip(page, `Ooty trip ${suffix}`);

  await addPlan(page, {
    kind: 'Travel',
    title: 'Drive to Ooty',
    day: 0,
    time: '07:30',
    place: 'Ooty',
    mode: 'Car',
    km: '300',
  });
  await addPlan(page, {
    kind: 'Sightseeing',
    title: 'Botanical Garden',
    day: 1,
    time: '10:00',
    place: 'Government Botanical Garden, Ooty',
  });
  await addPlan(page, { kind: 'Travel', title: 'Toy train', day: 1, mode: 'Train', km: '46' });

  // The itinerary page has every day, with its plans and a Maps link.
  await expect(page.getByTestId('itinerary-day')).toHaveCount(4);
  await expect(page.getByTestId('itinerary-day').nth(1)).toContainText('Botanical Garden');
  await expect(page.getByTestId('itinerary-day').nth(2)).toContainText('Nothing planned yet');
  await expect(
    page
      .getByTestId('itinerary-item')
      .filter({ hasText: 'Botanical Garden' })
      .getByTestId('maps-link'),
  ).toHaveAttribute('href', /google\.com\/maps\/search\/\?api=1&query=Government%20Botanical/);
  await expectNoHorizontalScroll(page);

  // The Trip page shows what's coming up and the travel totals.
  await page.goto('/trip');
  const comingUp = page.getByTestId('coming-up');
  await expect(comingUp).toContainText('Drive to Ooty');
  await expect(comingUp).toContainText('Botanical Garden');
  await expect(comingUp).toContainText('346 km');

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
  await expect(guest.getByTestId('coming-up')).toContainText('Drive to Ooty');
  // Members can read the itinerary but not change it, and see their family instead of the invite.
  await guest.getByRole('link', { name: 'See full itinerary' }).click();
  await expect(guest).toHaveURL('/itinerary');
  await expect(guest.getByTestId('itinerary-item')).toHaveCount(3);
  await expect(guest.getByRole('button', { name: 'Add to itinerary' })).toHaveCount(0);
  await expect(guest.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  await guest.goto('/trip');
  await expect(guest.getByTestId('your-family')).toContainText('Family B');
  await expect(guest.getByTestId('invite-link')).toHaveCount(0);
  await expect(guest.getByTestId('your-family')).toContainText(
    'Need to invite someone? Ask Olive Organiser',
  );
  await expectNoHorizontalScroll(guest);
  await other.close();

  // The organiser sees the new person in Family B.
  await expect(page.getByText('Gita Guest', { exact: true }).first()).toBeVisible();
});

test('editing the itinerary offline shows at once and syncs later @itinerary @offline', async ({
  page,
  context,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `offline-${suffix}`, 'Omar Offline');
  await createTrip(page, `Offline trip ${suffix}`);
  await addPlan(page, { kind: 'Travel', title: 'Drive to Coorg', mode: 'Car', km: '280' });
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });

  await context.setOffline(true);
  await page
    .getByTestId('itinerary-item')
    .filter({ hasText: 'Drive to Coorg' })
    .getByRole('button', { name: 'Edit' })
    .click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Distance (km)').fill('310');
  await sheet.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Car · 1 car · 310 km')).toBeVisible();
  await expect(page.getByTestId('pending-sync')).toBeVisible();
  // Adding offline works too.
  await addPlan(page, { kind: 'Food', title: 'Lunch at Madikeri', day: 0, time: '13:00' });

  await context.setOffline(false);
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 30_000 });
});
