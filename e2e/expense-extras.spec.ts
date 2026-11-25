import { expect, test, type Page } from '@playwright/test';
import { signIn } from './helpers';
import { addFamily, createTrip, openAddExpense, pickMyFamily } from './trip-helpers';

async function addExpense(page: Page, amount: string, title: string, category: string) {
  const sheet = await openAddExpense(page);
  await sheet.getByLabel('Amount (₹)').fill(amount);
  await sheet.getByLabel('What for').fill(title);
  await sheet.getByText(category, { exact: false }).first().click();
  await sheet.getByText('Equal per family', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Add expense' }).click();
  await expect(sheet).toBeHidden();
}

async function setUp(page: Page, uid: string, tripName: string) {
  await signIn(page, uid, 'Esha Export');
  await createTrip(page, tripName);
  await addFamily(page, 'Family A', 2);
  await addFamily(page, 'Family B', 4);
  await pickMyFamily(page, 'Family A');
  await addExpense(page, '3000', 'Dinner', 'Food');
  await addExpense(page, '9000', 'Hotel advance', 'Stay');
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });
}

test('the expense spreadsheet downloads offline with each family’s share @export @offline', async ({
  page,
  context,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  // Force the plain download path (headless phones may offer a share sheet instead).
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
  await setUp(page, `exp-csv-${suffix}`, `Export trip ${suffix}`);

  await context.setOffline(true);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-expenses').click(),
  ]);
  await context.setOffline(false);

  expect(download.suggestedFilename()).toMatch(/^export-trip-.*-expenses-\d{4}-\d{2}-\d{2}\.csv$/);
  const text = (await download.createReadStream().toArray()).map(String).join('');
  const lines = text
    .replace(/^\uFEFF/, '')
    .trim()
    .split('\r\n');
  expect(lines[0]).toContain('Family A share (₹),Family B share (₹)');
  expect(lines).toHaveLength(3);
  expect(text).toContain(',Dinner,Food,3000.00,Family A,Equal per family,');
  expect(text).toContain(',Hotel advance,Stay,9000.00,');
  expect(text).toContain(',4500.00,4500.00,');
});

test('where the money went shows without a budget and filters expenses @money', async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await setUp(page, `exp-cat-${suffix}`, `Spending trip ${suffix}`);

  // Who added it shows in the list and in the edit form.
  await expect(page.getByTestId('expense-added-by').first()).toHaveText('by you');
  await page.getByText('Dinner', { exact: true }).click();
  await expect(page.getByTestId('expense-changed-by')).toContainText('Added by you on');
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('link', { name: 'Money' }).first().click();
  await page.getByRole('link', { name: 'Budget' }).first().click();
  await expect(page).toHaveURL('/money/budget');
  const card = page.getByTestId('spending-by-category');
  await expect(card).toContainText('Where the money went');
  const rows = card.getByTestId('spending-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toHaveAttribute('data-category', 'stay');
  await expect(rows.nth(0)).toContainText('75%');
  await expect(rows.nth(1)).toContainText('25%');
  await expect(rows.nth(0)).toContainText('Your family’s share ₹4,500');

  await rows.nth(1).getByRole('link').click();
  await expect(page).toHaveURL('/expenses?category=food');
  await expect(page.getByTestId('category-filter')).toContainText('Only food');
  const list = page.getByTestId('expense-list');
  await expect(list).toContainText('Dinner');
  await expect(list).not.toContainText('Hotel advance');
  await page.getByRole('button', { name: 'Show all' }).click();
  await expect(list).toContainText('Hotel advance');
});
