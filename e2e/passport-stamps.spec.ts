import { test, expect } from '@playwright/test';
import { createEntry } from './helpers';

test('três fichas de Chardonnay ganham "Curioso de Chardonnay" com o selo NOVO', async ({ page }) => {
  await createEntry(page, 'Branco Um', { grapes: 'Chardonnay' });
  await createEntry(page, 'Branco Dois', { grapes: 'Chardonnay 100%' });
  await createEntry(page, 'Branco Três', { grapes: 'chardonnay' });

  // O aviso sai junto com a mensagem de ficha salva.
  const toast = page.locator('.toast');
  await expect(toast).toContainText('salva com sucesso');
  await expect(toast).toContainText('Curioso de Chardonnay');

  await page.goto('/#/passaporte');
  await page.getByRole('button', { name: /^Uvas/ }).click();
  const stamp = page.getByRole('button', { name: /Curioso de Chardonnay/ });
  await expect(stamp).toBeVisible();
  await expect(stamp).toContainText('NOVO');

  await stamp.click();
  const dialog = page.getByRole('dialog', { name: 'Curioso de Chardonnay' });
  await expect(dialog).toContainText('GANHO EM');
  await dialog.getByRole('button', { name: 'Ver a ficha que desbloqueou' }).click();
  await expect(page).toHaveURL(/#\/ficha\//);
  await expect(page.getByRole('heading', { name: 'Branco Três' })).toBeVisible();

  // Visto uma vez, deixa de ser novo.
  await page.goto('/#/passaporte');
  await page.reload();
  await page.getByRole('button', { name: /^Uvas/ }).click();
  await expect(page.getByRole('button', { name: /Curioso de Chardonnay/ })).not.toContainText('NOVO');
  await expect(page.getByText(/de 233 marcos/).first()).toBeVisible();
});

test('o modo de exemplo nunca mostra marco pessoal', async ({ page }) => {
  await createEntry(page, 'Branco Um', { grapes: 'Chardonnay' });
  await page.goto('/#/passaporte');
  await page.getByRole('button', { name: 'Ver exemplo' }).click();
  await expect(page.getByText('CARIMBOS ILUSTRATIVOS / COLEÇÃO DE EXEMPLO')).toBeVisible();
  await expect(page.locator('.milestone-new')).toHaveCount(0);
  await page.getByRole('button', { name: /^Uvas/ }).click();
  // Nas fichas de exemplo não há Chardonnay repetido; a uva pessoal não aparece.
  await expect(page.getByRole('button', { name: /Curioso de Chardonnay/ })).toContainText('1 DE 3');
  await page.getByRole('button', { name: /^Volume/ }).click();
  await expect(page.getByRole('button', { name: /Primeira taça/ })).toContainText('EXEMPLO');
});
