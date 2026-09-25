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
  await expect(page).toHaveURL(/#\/ficha\/[^/]+$/);
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

async function deleteEntry(page: import('@playwright/test').Page, name: string) {
  await page.goto('/#/caderno');
  await page.getByRole('button', { name: `Abrir ficha de ${name}` }).click();
  await page.getByRole('button', { name: 'Excluir ficha' }).click();
  await page.getByRole('button', { name: 'Sim, excluir' }).click();
  await expect(page).toHaveURL(/#\/caderno/);
  await expect(card(page, name)).toHaveCount(0);
}

test('excluir pode ser desfeito', async ({ page }) => {
  await createEntry(page, 'Rosé da Praia');
  await deleteEntry(page, 'Rosé da Praia');
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect(card(page, 'Rosé da Praia')).toBeVisible();
  await page.waitForTimeout(6_500);
  await page.reload();
  await expect(card(page, 'Rosé da Praia')).toBeVisible();
});

test('sem desfazer, a exclusão vale depois do prazo', async ({ page }) => {
  await createEntry(page, 'Rosé da Praia');
  await deleteEntry(page, 'Rosé da Praia');
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeHidden({ timeout: 8_000 });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(card(page, 'Rosé da Praia')).toHaveCount(0);
});

test('registrar outra ficha enquanto a anterior ainda carrega não reaproveita o editor velho', async ({ page }) => {
  // Simula rede lenta no chunk da ficha, que chega depois do salvamento.
  await page.route('**/assets/TastingSheetDetails-*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.goto('/#/novo');
  await page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor').fill('Primeiro');
  await page.getByRole('button', { name: /Guardar no caderno/ }).click();
  await expect(page).toHaveURL(/#\/ficha\//);

  await page.goto('/#/novo');
  await expect(page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor')).toHaveValue('');
  await page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor').fill('Segundo');
  await page.getByRole('button', { name: /Guardar no caderno/ }).click();
  await expect(page).toHaveURL(/#\/ficha\//);

  await page.goto('/#/caderno');
  await expect(card(page, 'Primeiro')).toBeVisible();
  await expect(card(page, 'Segundo')).toBeVisible();
});
