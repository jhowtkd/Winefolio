import { test, expect } from '@playwright/test';
import { card, createEntry } from './helpers';

test('o passaporte libera os selos das anotações e mantém os exemplos separados', async ({ page, isMobile }, testInfo) => {
  // A rolagem fecha o popup de propósito. Com a virada de página e a rolagem suave, o hover
  // pode terminar antes de a página parar de rolar, e o popup fecha no meio da verificação.
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const nextBtn = page.getByRole('button', { name: 'Próxima página', exact: true });
  const prevBtn = page.getByRole('button', { name: 'Página anterior', exact: true });

  await page.goto('/#/passaporte');
  await expect(page.locator('.passport-book')).toBeVisible();

  // Seleciona explicitamente Minhas anotações para evidência do livro pessoal vazio
  await page.getByRole('button', { name: 'Minhas anotações', exact: true }).click();
  await expect(page.locator('.journey-stat strong')).toHaveText('00');
  await expect(page.locator('.passport-page-indicator')).toHaveText(isMobile ? 'Página 1 de 3' : 'Páginas 1–2 de 3');
  await expect(page.locator('.book-page-origins p.muted')).toHaveText('0 origens registradas nas suas próprias anotações.');

  // Captura do livro vazio pessoal no início (visão completa sem cortes)
  if (isMobile) {
    await page.screenshot({ path: 'output/playwright/passaporte-livro/passaporte-vazio-mobile.png', fullPage: true, animations: 'disabled' });
  } else {
    await page.screenshot({ path: 'output/playwright/passaporte-livro/passaporte-vazio-desktop.png', fullPage: true, animations: 'disabled' });
  }

  // Alterna para Ver exemplo
  await page.getByRole('button', { name: 'Ver exemplo', exact: true }).click();
  await expect(page.locator('.journey-stat strong')).toHaveText('05');

  if (isMobile) {
    // Celular: Folha 1 = Origens (4 países de exemplo)
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 1 de 3');
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).toBeEnabled();

    // Folheia para Folha 2 = Conquistas 1 (marcos 0..5)
    await nextBtn.click();
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 2 de 3');
    await expect(page.locator('.journey-stamp')).toHaveCount(6);
    for (const id of ['legado.first', 'legado.vocabulary', 'legado.origin']) {
      await expect(page.locator(`img[src$="${id}.webp"]`)).toBeVisible();
    }

    // Folheia para Folha 3 = Conquistas 2 (marcos 6..10)
    await nextBtn.click();
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 3 de 3');
    await expect(nextBtn).toBeDisabled();
    await expect(page.locator('.journey-stamp')).toHaveCount(5);
    for (const id of ['critica.primeira-nota', 'critica.cinco']) {
      await expect(page.locator(`img[src$="${id}.webp"]`)).toBeVisible();
    }
  } else {
    // Desktop: Abertura 1 = Folhas 1 e 2 (Origens + Conquistas 1)
    await expect(page.locator('.passport-page-indicator')).toHaveText('Páginas 1–2 de 3');
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).toBeEnabled();
    for (const id of ['legado.first', 'legado.vocabulary', 'legado.origin']) {
      await expect(page.locator(`img[src$="${id}.webp"]`)).toBeVisible();
    }

    // Folheia para Abertura 2 = Folha 3 + Folha decorativa
    await nextBtn.click();
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 3 de 3');
    await expect(nextBtn).toBeDisabled();
    await expect(page.locator('.book-page-decorative')).toBeVisible();
    for (const id of ['critica.primeira-nota', 'critica.cinco']) {
      await expect(page.locator(`img[src$="${id}.webp"]`)).toBeVisible();
    }
    await page.screenshot({ path: 'output/playwright/passaporte-livro/passaporte-decorativa-desktop.png', fullPage: true, animations: 'disabled' });
  }

  // Alternar modo reseta para a primeira abertura
  await page.getByRole('button', { name: 'Minhas anotações', exact: true }).click();
  await expect(page.locator('.journey-stat strong')).toHaveText('00');

  if (isMobile) {
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 1 de 3');
    await nextBtn.click();
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 2 de 3');
  } else {
    await expect(page.locator('.passport-page-indicator')).toHaveText('Páginas 1–2 de 3');
  }

  const firstSeal = page.getByRole('button', { name: 'Primeira página — Ainda não conquistado', exact: true });
  const tooltip = page.locator('[id="milestone-legado.first"]');
  await expect(tooltip).toBeHidden();
  if (isMobile) {
    await firstSeal.tap();
  } else {
    await firstSeal.hover();
  }
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('Uma impressão pessoal guardada');
  const popupBounds = await tooltip.boundingBox();
  expect(popupBounds!.x).toBeGreaterThanOrEqual(0);
  expect(popupBounds!.x + popupBounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  if (isMobile) {
    await page.locator('#passport-title').tap();
    await expect(tooltip).toBeHidden();
  } else {
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
    await firstSeal.focus();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
  }

  // Teste de navegação por teclado dentro do livro e fechamento de tooltip ao virar
  if (isMobile) {
    await firstSeal.tap();
  } else {
    await firstSeal.hover();
  }
  await expect(tooltip).toBeVisible();
  await nextBtn.click();
  // Tooltip deve fechar ao virar a página
  await expect(tooltip).toBeHidden();
  await prevBtn.click();
  if (isMobile) {
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 2 de 3');
  } else {
    await expect(page.locator('.passport-page-indicator')).toHaveText('Páginas 1–2 de 3');
  }

  // Regressão: foco no selo -> ArrowRight muda folha e transfere foco para o livro; próximo ArrowLeft funciona SEM book.focus intermediário
  await firstSeal.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.passport-page-indicator')).toHaveText('Página 3 de 3');

  await page.keyboard.press('ArrowLeft');
  if (isMobile) {
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 2 de 3');
  } else {
    await expect(page.locator('.passport-page-indicator')).toHaveText('Páginas 1–2 de 3');
  }

  // Regressão adicional: foco em carimbo de país -> ArrowRight muda folha e transfere foco para o livro; próximo ArrowLeft funciona SEM book.focus intermediário
  await page.getByRole('button', { name: 'Ver exemplo', exact: true }).click();
  const countryLink = page.locator('.country-stamp').first();
  await countryLink.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.passport-page-indicator')).toHaveText(isMobile ? 'Página 2 de 3' : 'Página 3 de 3');

  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.passport-page-indicator')).toHaveText(isMobile ? 'Página 1 de 3' : 'Páginas 1–2 de 3');

  // Setas com foco fora do livro (ex: no título ou modo) não folheiam
  await page.locator('#passport-title').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.passport-page-indicator')).toHaveText(isMobile ? 'Página 1 de 3' : 'Páginas 1–2 de 3');

  await page.getByRole('button', { name: 'Minhas anotações', exact: true }).click();

  // Insere ficha pessoal com tipo sugerido por IA não confirmado
  await page.evaluate(async () => {
    const dbRequest = indexedDB.open('winefolio-local');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = () => reject(dbRequest.error);
    });
    const tx = db.transaction('records', 'readwrite');
    const store = tx.objectStore('records');
    const aiEntry = {
      id: 'ai-espumante',
      schemaVersion: 3,
      revision: 1,
      vinho: 'Espumante da IA',
      produtor: 'Casa da IA',
      safra: '2023',
      uvas: '',
      regiaoPais: '',
      tipo: 'espumante',
      estilo: 'branco',
      skinContact: false,
      tags: [],
      occasion: '',
      favorite: false,
      visual: { coreColour: null, faults: [] },
      olfato: { condition: null, faults: [], intensity: null, oak: null, maturity: null, aromas: '' },
      paladar: { condition: null, faults: [], sweetness: null, sparkle: null, body: null, texture: [], acidity: null, flavourIntensity: null, oak: null, maturity: null, tanninLevel: null, tanninQuality: [], alcohol: null, abv: '', finish: null, aromasBoca: '', retrogosto: '' },
      conclusao: { avaliacaoEstrelas: null, impressaoFinal: '', harmonizacao: '', preco: '', asiQuality: null, ageing: null, vinification: [], climate: null, climateType: null },
      servico: { temperature: null, glass: null, decant: null, dishStyle: null, pairingComponents: [] },
      aromaTags: [],
      dataDegustacao: '2026-10-10',
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
      evidence: { revisitedAt: null },
      provenance: { tipo: 'ai-unverified', vinho: 'ai-unverified' },
    };
    store.put(aiEntry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });

  // Ficha pessoal com sugestão não confirmada não libera o selo
  await page.goto('/#/passaporte');
  await page.reload();
  await page.getByRole('button', { name: 'Minhas anotações', exact: true }).click();
  if (isMobile) {
    await nextBtn.click();
  }
  await expect(page.locator('.journey-item:not(.locked) img[src$="estilo.primeiro-espumante.webp"]')).toHaveCount(0);

  // Duplicar a ficha sem alterar tipo preserva a proveniência e mantém selo pendente
  await page.goto('/#/ficha/ai-espumante');
  await page.getByRole('button', { name: 'Duplicar', exact: true }).click();
  await expect(page.locator('#entry-tipo')).toHaveValue('espumante');
  await page.getByRole('button', { name: /Guardar no caderno/ }).click();
  await expect(page).toHaveURL(/#\/ficha\//);
  await page.goto('/#/passaporte');
  if (isMobile) {
    await nextBtn.click();
  }
  await expect(page.locator('.journey-item:not(.locked) img[src$="estilo.primeiro-espumante.webp"]')).toHaveCount(0);

  await page.goto('/#/novo');
  await page.getByPlaceholder('Ex: Malbec Argentino, Don Melchor').fill('Memória do passaporte');
  await page.locator('#entry-tipo').selectOption('espumante');
  await page.getByRole('tab', { name: /Conclusões/ }).click();
  await page.getByLabel('Impressão final', { exact: true }).fill('Lembrou ameixa.');
  await page.getByLabel('Harmonização', { exact: true }).fill('Risoto de cogumelos');
  await page.getByRole('button', { name: '5 de 5 estrelas' }).click();
  await page.getByRole('button', { name: /Guardar no caderno/ }).click();
  await expect(page).toHaveURL(/#\/ficha\//);
  await page.getByRole('button', { name: /Editar Ficha/ }).click();
  await page.getByRole('tab', { name: /Conclusões/ }).click();
  await page.getByLabel('Impressão final', { exact: true }).fill('Lembrou ameixa e chocolate.');
  await page.getByRole('button', { name: /Guardar alterações/ }).click();
  await expect(page).toHaveURL(/#\/ficha\/[^/]+$/);

  await page.goto('/#/passaporte');
  await expect(page.locator('.journey-stat strong')).toHaveText('06');

  // Verifica selos conquistados na folha 1 de conquistas
  if (isMobile) {
    await nextBtn.click();
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 2 de 3');
  } else {
    await expect(page.locator('.passport-page-indicator')).toHaveText('Páginas 1–2 de 3');
  }

  for (const id of ['legado.first', 'legado.revisited', 'estilo.primeiro-espumante']) {
    const image = page.locator(`img[src$="${id}.webp"]`);
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(320);
  }

  // Verifica selos conquistados na folha 2 de conquistas
  await nextBtn.click();
  if (isMobile) {
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 3 de 3');
  } else {
    await expect(page.locator('.passport-page-indicator')).toHaveText('Página 3 de 3');
  }

  for (const id of ['harmonizacao.1', 'critica.primeira-nota', 'critica.cinco']) {
    const image = page.locator(`img[src$="${id}.webp"]`);
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(320);
  }

  // Retorna para a folha 1 de conquistas para conferir o popup do espumante
  await prevBtn.click();
  await page.reload();
  await expect(page.locator('.journey-stat strong')).toHaveText('06');
  if (isMobile) {
    await nextBtn.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  }

  const earnedSeal = page.getByRole('button', { name: 'Primeiras bolhas — Conquistado', exact: true });
  await earnedSeal.scrollIntoViewIfNeeded();
  if (isMobile) await earnedSeal.tap();
  else await earnedSeal.hover();

  const earnedTooltip = page.locator('[id="milestone-estilo.primeiro-espumante"]');
  await expect(earnedTooltip).toBeVisible();
  await expect(earnedTooltip).toContainText('Conquistado');
  const earnedBounds = await earnedTooltip.boundingBox();
  expect(earnedBounds!.y).toBeGreaterThanOrEqual(0);
  expect(earnedBounds!.y + earnedBounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);

  if (isMobile) {
    await page.screenshot({ path: 'output/playwright/passaporte-livro/passaporte-abertura-mobile.png', fullPage: true, animations: 'disabled' });
    await page.screenshot({ path: 'output/playwright/passaporte-livro/passaporte-conquistas-popup-mobile.png', fullPage: false, animations: 'disabled' });
  } else {
    await page.screenshot({ path: 'output/playwright/passaporte-livro/passaporte-abertura-desktop.png', fullPage: true, animations: 'disabled' });
    await page.screenshot({ path: 'output/playwright/passaporte-livro/passaporte-conquistas-popup.png', fullPage: false, animations: 'disabled' });
  }
  await page.screenshot({ path: testInfo.outputPath('passport.png'), fullPage: true, animations: 'disabled' });
});

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

test('no celular, fontes mais largas não empurram a página para fora da tela', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'O cabeçalho estreito só existe no celular.');
  await page.addInitScript(() =>
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = '* { letter-spacing: .12em !important; }';
      document.head.appendChild(style);
    })
  );
  await page.goto('/#/caderno');
  await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();
  // Quando a página transborda, o Chrome móvel alarga a janela de layout: compara com a tela.
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
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
