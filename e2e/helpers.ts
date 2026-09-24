import { fileURLToPath } from 'url';
import { expect, type Page } from '@playwright/test';

export const BASE_URL = 'http://localhost:3000';
export const LABEL_PHOTO = fileURLToPath(new URL('./fixtures/label.jpg', import.meta.url));

/** Escolhe a foto do rótulo pelo seletor de arquivo (não o da câmera). */
export async function pickLabelPhoto(page: Page) {
  await page.locator('input[type="file"][accept="image/*"]:not([capture])').setInputFiles(LABEL_PHOTO);
}

/** Registra uma ficha pelo editor. Com foto, recusa o envio ao Gemini. */
export async function createEntry(page: Page, name: string, options: { photo?: boolean } = {}) {
  await page.goto('/#/novo');
  if (options.photo) {
    await pickLabelPhoto(page);
    await page.getByRole('button', { name: 'Só guardar a foto' }).click();
  }
  await page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor').fill(name);
  await page.getByRole('button', { name: /Guardar no caderno/ }).click();
  await expect(page).toHaveURL(/#\/ficha\//);
}

export function card(page: Page, name: string) {
  return page.locator('article.wine-card', { hasText: name });
}
