import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test('More shows the version and the credits @more', async ({ page }, testInfo) => {
  await signIn(page, `footer-${testInfo.project.name}-${testInfo.retry}`, 'Fay Footer');
  await page.goto('/more');
  const footer = page.getByTestId('app-footer');
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
});
