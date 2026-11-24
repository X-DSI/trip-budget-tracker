import { expect, test, type Page } from '@playwright/test';
import { signIn, waitForServiceWorker } from './helpers';
import { addFamily, addPlan, createTrip, openAddExpense } from './trip-helpers';

const isDark = (page: Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'));

const pageBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

/**
 * Visible, opaque elements whose background is still light (lightness above 0.7) in dark mode.
 * Small things (dots, toggles' knobs) are ignored; so is the teal hero.
 */
async function lightPanels(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      const style = getComputedStyle(el);
      const bg = style.backgroundColor;
      // Chrome reports Tailwind's colours as lab() and plain ones as rgb(); handle both.
      const lab = /lab\(([\d.]+)%?\s+[-\d.]+\s+[-\d.]+(?:\s*\/\s*([\d.]+))?\)/.exec(bg);
      const rgb = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/.exec(bg);
      let lum: number;
      let alpha: number;
      if (lab) {
        lum = Number(lab[1]) / 100;
        alpha = lab[2] === undefined ? 1 : Number(lab[2]);
      } else if (rgb) {
        const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((v) => Number(v) / 255) as [
          number,
          number,
          number,
        ];
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        alpha = rgb[4] === undefined ? 1 : Number(rgb[4]);
      } else {
        continue;
      }
      if (alpha < 0.5) continue;
      const rect = el.getBoundingClientRect();
      if (lum > 0.7 && rect.width * rect.height > 1500 && style.visibility !== 'hidden') {
        found.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} ${bg}`);
      }
    }
    return found;
  });
}

test('Dark theme from More: applied everywhere, survives reload and offline @theme', async ({
  page,
  context,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await signIn(page, `theme-${suffix}`, 'Dina Dark');
  await createTrip(page, `Theme trip ${suffix}`);
  await addFamily(page, 'Family A', 2);
  await addPlan(page, { kind: 'Travel', title: 'Drive', mode: 'Car', km: '120', place: 'Ooty' });

  // The scanner must see the white cards in light mode, or the dark checks below prove nothing.
  await page.goto('/trip');
  await expect(page.getByTestId('coming-up')).toContainText('Drive');
  expect((await lightPanels(page)).length).toBeGreaterThan(3);

  await page.goto('/more');
  await page.getByTestId('theme-setting').getByText('Dark', { exact: true }).click();
  expect(await isDark(page)).toBe(true);
  expect(await pageBackground(page)).toBe('rgb(2, 6, 23)');

  // Each page is scanned only once its own content has rendered.
  const pages: [string, string][] = [
    ['/', 'dashboard'],
    ['/trip', 'coming-up'],
    ['/itinerary', 'itinerary-item'],
    ['/expenses', 'trip-total'],
    ['/money/budget', 'budget'],
    ['/money/balances', 'money-switch'],
    ['/more', 'theme-setting'],
  ];
  for (const [path, ready] of pages) {
    await page.goto(path);
    await expect(page.getByTestId(ready).first()).toBeVisible();
    expect(await lightPanels(page), `light panels on ${path}`).toEqual([]);
  }
  const sheet = await openAddExpense(page);
  await expect(sheet.getByLabel('Amount (₹)')).toBeVisible();
  expect(await lightPanels(page), 'light panels in the add-expense sheet').toEqual([]);

  // The choice survives a reload, and works offline.
  await waitForServiceWorker(page);
  await page.goto('/');
  expect(await isDark(page)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  expect(await isDark(page)).toBe(true);
  await context.setOffline(false);

  // Back to Light.
  await page.goto('/more');
  await page.getByTestId('theme-setting').getByText('Light', { exact: true }).click();
  expect(await isDark(page)).toBe(false);
  expect(await pageBackground(page)).not.toBe('rgb(2, 6, 23)');
});

test('System follows the phone’s setting @theme', async ({ page }, testInfo) => {
  const suffix = `${testInfo.project.name}-${testInfo.retry}`;
  await page.emulateMedia({ colorScheme: 'dark' });
  await signIn(page, `theme-sys-${suffix}`, 'Sam System');
  expect(await isDark(page)).toBe(true);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => isDark(page)).toBe(false);
  // The sign-in page is dark too, before anyone signs in.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/signin');
  expect(await lightPanels(page)).toEqual([]);
});
