import { promises as fs } from 'fs';
import { test, expect } from '@playwright/test';
import { BASE_URL, card, createEntry } from './helpers';

test('exporta e restaura fichas com foto', async ({ page, browser }) => {
  await createEntry(page, 'Vinho Um', { photo: true });
  await createEntry(page, 'Vinho Dois', { photo: true });

  await page.goto('/#/ajustes');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar', exact: true }).click(),
  ]);
  const file = await download.path();
  const backup = JSON.parse(await fs.readFile(file, 'utf8'));
  expect(backup.entries).toHaveLength(2);
  expect(backup.photos).toHaveLength(2);

  const fresh = await browser.newContext({ baseURL: BASE_URL });
  const other = await fresh.newPage();
  await other.goto('/#/ajustes');
  await other.locator('input[type="file"][accept=".json,application/json"]').setInputFiles(file);
  await other.goto('/#/caderno');
  await expect(card(other, 'Vinho Um').locator('img')).toBeVisible();
  await expect(card(other, 'Vinho Dois').locator('img')).toBeVisible();
  await fresh.close();
});
