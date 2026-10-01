import { test, expect } from '@playwright/test';
import { pickLabelPhoto } from './helpers';

const READING = { produtor: 'Quinta Teste', vinho: 'Reserva', safra: '2020', resumo: 'Texto do modelo' };

test('só guardar a foto não envia nada ao servidor', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/analyze-wine-label', (route) => {
    calls++;
    return route.fulfill({ json: { success: true, data: READING } });
  });
  await page.goto('/#/novo');
  await pickLabelPhoto(page);
  await expect(page.getByRole('heading', { name: 'Ler o rótulo com IA?' })).toBeVisible();
  await page.getByRole('button', { name: 'Só guardar a foto' }).click();
  await expect(page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor')).toHaveValue('');
  expect(calls).toBe(0);
});

test('com licença, preenche os dados do rótulo e não a impressão final', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/analyze-wine-label', (route) => {
    calls++;
    return route.fulfill({ json: { success: true, data: READING } });
  });
  await page.goto('/#/novo');
  await pickLabelPhoto(page);
  await page.getByRole('button', { name: 'Enviar e ler' }).click();
  await expect(page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor')).toHaveValue('Reserva');
  await expect(page.getByPlaceholder('Ex: 2020 ou N/V')).toHaveValue('2020');
  expect(calls).toBe(1);

  // A segunda leitura não pergunta de novo.
  await pickLabelPhoto(page);
  await expect.poll(() => calls).toBe(2);
  await expect(page.getByRole('heading', { name: 'Ler o rótulo com IA?' })).toHaveCount(0);

  await page.getByRole('button', { name: /Guardar no caderno/ }).click();
  await expect(page).toHaveURL(/#\/ficha\//);
  await expect(page.getByText('Nenhuma anotação final registrada.')).toBeVisible();
  await expect(page.getByText(/Sugerido pela IA e não revisado/)).toBeVisible();

  // Conferida a leitura, os campos passam a valer como da pessoa.
  await page.getByRole('button', { name: 'Confirmar leitura do rótulo' }).click();
  await expect(page.getByText('Leitura do rótulo confirmada.')).toBeVisible();
  await expect(page.getByText(/Sugerido pela IA e não revisado/)).toHaveCount(0);
});

test('erro do servidor em HTML vira aviso e o editor continua aberto', async ({ page }) => {
  await page.route('**/api/analyze-wine-label', (route) =>
    route.fulfill({ status: 502, contentType: 'text/html', body: '<html>Bad Gateway</html>' })
  );
  await page.goto('/#/novo');
  await pickLabelPhoto(page);
  await page.getByRole('button', { name: 'Enviar e ler' }).click();
  await expect(page.getByText('Não foi possível ler as informações do rótulo.')).toBeVisible();
  await expect(page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor')).toBeVisible();
});
