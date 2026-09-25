import { promises as fs } from 'fs';
import { test, expect, type Page } from '@playwright/test';
import { BASE_URL, card, createEntry } from './helpers';

async function exportBackupFile(page: Page) {
  await page.goto('/#/ajustes');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar', exact: true }).click(),
  ]);
  return download.path();
}

async function chooseBackup(page: Page, file: string) {
  await page.goto('/#/ajustes');
  await page.locator('input[type="file"][accept=".json,application/json"]').setInputFiles(file);
  await expect(page.getByRole('heading', { name: 'O que tem neste backup' })).toBeVisible();
}

test('exporta e restaura fichas com foto', async ({ page, browser }) => {
  await createEntry(page, 'Vinho Um', { photo: true });
  await createEntry(page, 'Vinho Dois', { photo: true });

  const file = await exportBackupFile(page);
  const backup = JSON.parse(await fs.readFile(file, 'utf8'));
  expect(backup.entries).toHaveLength(2);
  expect(backup.photos).toHaveLength(2);

  const fresh = await browser.newContext({ baseURL: BASE_URL });
  const other = await fresh.newPage();
  await chooseBackup(other, file);
  await expect(other.getByTestId('import-summary')).toContainText('2 novas');
  await other.getByRole('button', { name: 'Importar 2 fichas' }).click();
  await expect(other).toHaveURL(/#\/caderno$/);
  await expect(card(other, 'Vinho Um').locator('img')).toBeVisible();
  await expect(card(other, 'Vinho Dois').locator('img')).toBeVisible();
  await fresh.close();
});

test('em conflito, mantém a minha ficha por padrão e deixa escolher a do backup', async ({ page }) => {
  await createEntry(page, 'Vinho Um');
  const file = await exportBackupFile(page);

  await page.goto('/#/caderno');
  await page.getByRole('button', { name: 'Abrir ficha de Vinho Um' }).click();
  await page.getByRole('button', { name: /Editar Ficha/ }).click();
  await page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor').fill('Vinho Um Editado');
  await page.getByRole('button', { name: /Guardar alterações/ }).click();
  // Sai de #/ficha/<id>/editar para #/ficha/<id> só quando o salvamento termina.
  await expect(page).toHaveURL(/#\/ficha\/[^/]+$/);

  await chooseBackup(page, file);
  await expect(page.getByTestId('import-summary')).toContainText('1 em conflito');
  await expect(page.getByRole('radio', { name: /Manter a minha/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Importar 0 fichas' })).toBeDisabled();

  await page.getByRole('radio', { name: /Usar a do backup/ }).check();
  await page.getByRole('button', { name: 'Importar 1 ficha' }).click();
  await expect(page).toHaveURL(/#\/caderno$/);
  await expect(card(page, 'Vinho Um')).toBeVisible();
  await expect(card(page, 'Vinho Um Editado')).toHaveCount(0);
});
