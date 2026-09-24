import { test, expect } from '@playwright/test';
import { card, createEntry } from './helpers';

test('registra, favorita, busca e edita uma ficha', async ({ page }) => {
  await createEntry(page, 'Tinto da Casa');
  await createEntry(page, 'Branco do Vale');

  await page.goto('/#/caderno');
  await page.getByRole('button', { name: 'Adicionar aos favoritos: Tinto da Casa' }).click();
  await expect(page.getByRole('button', { name: 'Remover dos favoritos: Tinto da Casa' })).toBeVisible();

  await page.getByLabel('Buscar nas anotações').fill('Branco');
  await expect(card(page, 'Branco do Vale')).toBeVisible();
  await expect(card(page, 'Tinto da Casa')).toHaveCount(0);

  await page.getByRole('button', { name: 'Abrir ficha de Branco do Vale' }).click();
  await page.getByRole('button', { name: /Editar Ficha/ }).click();
  await page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor').fill('Branco do Vale Reserva');
  await page.getByRole('button', { name: /Guardar alterações/ }).click();
  await page.goto('/#/caderno');
  await expect(card(page, 'Branco do Vale Reserva')).toBeVisible();
});

test('esconde as fichas de exemplo quando o ajuste é desligado', async ({ page }) => {
  await page.goto('/#/ajustes');
  await page.getByRole('button', { name: 'Carregar', exact: true }).click();
  await expect(page.locator('article.wine-card').first()).toBeVisible();
  await page.goto('/#/ajustes');
  // A caixa é controlada: só muda depois que a preferência é gravada.
  const toggle = page.getByRole('checkbox', { name: 'Mostrar coleção de exemplo' });
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await page.goto('/#/caderno');
  await expect(page.locator('article.wine-card')).toHaveCount(0);
});

test('chega na adega e nas estatísticas pelo menu', async ({ page, isMobile }) => {
  await createEntry(page, 'Tinto da Casa');
  await page.goto('/#/caderno');
  if (isMobile) {
    await page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('button', { name: 'Opções' }).click();
    await page.getByRole('button', { name: 'Adega', exact: true }).click();
  } else {
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('button', { name: 'Adega' }).click();
  }
  await expect(page).toHaveURL(/#\/adega$/);
  await expect(page.getByRole('heading', { name: 'Garrafas do caderno' })).toBeVisible();

  if (isMobile) {
    await page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('button', { name: 'Opções' }).click();
    await page.getByRole('button', { name: 'Estatísticas', exact: true }).click();
  } else {
    const nav = page.getByRole('navigation', { name: 'Principal' });
    await nav.getByRole('button', { name: 'Estatísticas' }).click();
    await expect(nav.getByRole('button', { name: 'Estatísticas' })).toHaveAttribute('aria-current', 'page');
  }
  await expect(page).toHaveURL(/#\/estatisticas$/);
  await expect(page.getByRole('heading', { name: 'O que o caderno mostra' })).toBeVisible();
});
