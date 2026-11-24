import { expect, test, type Page } from '@playwright/test';
import { signIn } from './helpers';
import {
  addFamily,
  createTrip,
  istDate,
  openAddExpense,
  pickMyFamily,
  setDates,
} from './trip-helpers';

async function addBudgetLine(page: Page, amount: string, category: string, split: string) {
  await page.getByRole('button', { name: 'Add budget line' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Amount (₹)').fill(amount);
  await sheet.getByText(category, { exact: true }).click();
  await sheet.getByText(split, { exact: true }).click();
  await sheet.getByRole('button', { name: 'Add to budget' }).click();
  await expect(sheet).toBeHidden();
}

async function addEqualExpense(page: Page, amount: string, title: string, paidBy: string) {
  const sheet = await openAddExpense(page);
  await sheet.getByLabel('Amount (₹)').fill(amount);
  await sheet.getByLabel('What for').fill(title);
  await sheet.getByLabel('Paid by').selectOption({ label: paidBy });
  await sheet.getByText('Equal per family', { exact: true }).click();
  await sheet.getByRole('button', { name: 'Add expense' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByTestId('expense-list')).toContainText(title);
}

async function nets(page: Page): Promise<number[]> {
  const rows = page.getByTestId('family-balance');
  const values = await rows.evaluateAll((els) =>
    els.map((el) => Number(el.getAttribute('data-net'))),
  );
  return values;
}

test('a budget shows each family its planned share @budget', async ({ page }, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `bud-org-${suffix}`, 'Bina Budget');
  await createTrip(page, `Budget trip ${suffix}`);
  await addFamily(page, 'Family A', 2);
  await addFamily(page, 'Family B', 4);
  await addFamily(page, 'Family C', 3);
  await addFamily(page, 'Family D', 3);
  await pickMyFamily(page, 'Family A');

  // ₹12,000 equal: ₹3,000 each. ₹36,000 per head over 12 adults: ₹3,000 an adult.
  await addBudgetLine(page, '12000', '⛽ Fuel', 'Equal per family');
  await addBudgetLine(page, '36000', '🏨 Stay', 'Per head');

  await expect(page.getByTestId('budget-total')).toHaveText('₹48,000');
  const planned = (family: string) =>
    page.getByTestId('planned-share').filter({ hasText: family }).getByTestId('planned');
  await expect(planned('Family A')).toHaveText('₹9,000');
  await expect(planned('Family B')).toHaveText('₹15,000');
  await expect(planned('Family C')).toHaveText('₹12,000');
  await expect(planned('Family D')).toHaveText('₹12,000');
  await expect(page.getByTestId('budget-vs-actual')).toContainText('Fuel');
  await expect(page.getByTestId('budget-vs-actual')).toContainText('Stay');

  // The dashboard's checklist ticks "Budget set" before the trip.
  await setDates(page, istDate(10), istDate(13));
  await expect(page.getByTestId('checklist')).toContainText('Budget set (done)');
});

test('balances net to zero and settle with "Mark as paid", even offline @balances @offline', async ({
  page,
  context,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `bal-org-${suffix}`, 'Bala Balance');
  await createTrip(page, `Balances trip ${suffix}`);
  await addFamily(page, 'Family A', 2);
  await addFamily(page, 'Family B', 4);
  await addFamily(page, 'Family C', 3);
  await pickMyFamily(page, 'Family A');

  // Two families pay: shares are ₹4,000 each, so A gets ₹5,000, B owes ₹1,000, C owes ₹4,000.
  await addEqualExpense(page, '9000', 'Villa deposit', 'Family A');
  await addEqualExpense(page, '3000', 'Fuel', 'Family B');

  await page.goto('/balances');
  await expect(page.getByTestId('family-balance')).toHaveCount(3);
  await expect(page.getByTestId('my-balance')).toHaveText('You get back ₹5,000');
  const before = await nets(page);
  expect(before.reduce((s, n) => s + n, 0)).toBe(0);
  expect([...before].sort((a, b) => a - b)).toEqual([-400000, -100000, 500000]);

  const suggested = page.getByTestId('suggested-payment');
  await expect(suggested.first()).toBeVisible();
  const count = await suggested.count();
  expect(count).toBeLessThanOrEqual(3 - 1);

  // Mark each suggested payment as paid; the first one with no signal.
  await expect(page.getByTestId('pending-sync')).toBeHidden({ timeout: 15_000 });
  await context.setOffline(true);
  for (let n = count; n > 0; n--) {
    await suggested.first().getByRole('button', { name: 'Mark as paid' }).click();
    const sheet = page.getByRole('dialog');
    await sheet.getByRole('button', { name: 'Record payment' }).click();
    await expect(sheet).toBeHidden();
    await expect(suggested).toHaveCount(n - 1);
    if (n === count) {
      await expect(page.getByTestId('settlement-pending')).toBeVisible();
      await context.setOffline(false);
      await expect(page.getByTestId('settlement-pending')).toBeHidden({ timeout: 30_000 });
    }
  }

  await expect(page.getByTestId('all-settled')).toHaveText('Everyone is settled. 🎉');
  await expect(page.getByTestId('my-balance')).toHaveText('You’re all square');
  expect(await nets(page)).toEqual([0, 0, 0]);
  await expect(page.getByTestId('settlement')).toHaveCount(count);

  // During the trip the dashboard shows the family's balance.
  await setDates(page, istDate(-1), istDate(2));
  await expect(page.getByTestId('dashboard-balance')).toHaveText('You’re all square');

  // Deleting a payment (soft) brings the debt back.
  await page.goto('/balances');
  const first = page.getByTestId('settlement').first();
  await first.getByRole('button', { name: 'Delete' }).click();
  await first.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(page.getByTestId('settlement')).toHaveCount(count - 1);
  await expect(suggested).toHaveCount(1);
});
