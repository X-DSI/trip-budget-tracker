import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test('every screen shows the version and the credits @more', async ({ page }, testInfo) => {
  const desktop = testInfo.project.name === 'desktop';
  await signIn(page, `footer-${testInfo.project.name}-${testInfo.retry}`, 'Fay Footer');

  for (const path of ['/', '/expenses', '/more']) {
    await page.goto(path);
    // Phones: under each screen's content. Desktop: at the bottom of the sidebar.
    const footer = page.getByTestId(desktop ? 'sidebar-footer' : 'app-footer');
    await expect(footer).toBeVisible();
    await expect(page.getByTestId(desktop ? 'app-footer' : 'sidebar-footer')).toBeHidden();
    await expect(footer.getByTestId('app-version')).toHaveText(
      /^v\d+\.\d+\.\d+ · \w+ · \d{1,2} \w{3} \d{4}$/,
    );
    await expect(footer.getByTestId('site-badge')).toHaveText('Local build');
    await expect(footer.getByRole('link', { name: 'Built' })).toHaveAttribute(
      'href',
      'https://github.com/X-DSI/trip-budget-tracker',
    );
    await expect(footer.getByRole('link', { name: 'DSI' })).toHaveAttribute(
      'href',
      'https://github.com/X-DSI',
    );
  }
});
