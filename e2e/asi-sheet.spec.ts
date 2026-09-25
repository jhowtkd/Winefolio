import { test, expect, type Page } from '@playwright/test';

const NAME = 'Ex: Malbec Argentino, Don Melchor';

async function openTab(page: Page, name: RegExp) {
  await page.getByRole('tab', { name }).click();
}

test('a ficha essencial pede só cor, aromas, doçura, corpo e nota', async ({ page }) => {
  await page.goto('/#/novo');
  await page.getByPlaceholder(NAME).fill('Tinto Essencial');
  await expect(page.getByRole('tab', { name: /Serviço/ })).toHaveCount(0);

  await openTab(page, /Visual/);
  await page.getByRole('button', { name: 'Rubi · Ruby' }).click();
  await expect(page.getByText('Limpidez')).toHaveCount(0);

  await openTab(page, /Nariz/);
  await page.getByRole('button', { name: 'Framboesa', exact: true }).click();

  await openTab(page, /Boca/);
  await page.getByRole('button', { name: 'Seco · Dry' }).click();
  await page.getByRole('button', { name: 'Encorpado · Full' }).click();
  await expect(page.getByText('Acidez')).toHaveCount(0);

  await openTab(page, /Conclusões/);
  await page.getByRole('button', { name: '4 de 5 estrelas' }).click();
  await page.getByRole('button', { name: /Guardar no caderno/ }).click();

  await expect(page).toHaveURL(/#\/ficha\//);
  await expect(page.getByText('Rubi (Ruby)')).toBeVisible();
  await expect(page.getByText('Encorpado (Full)')).toBeVisible();
  await expect(page.getByText('Framboesa')).toBeVisible();
  // A cor escolhida definiu o estilo.
  await expect(page.getByRole('dialog').getByText('Tinto', { exact: true })).toBeVisible();
});

test('a grade completa acrescenta serviço e os campos avançados', async ({ page }) => {
  await page.goto('/#/novo');
  await page.getByPlaceholder(NAME).fill('Tinto Completo');
  await page.getByLabel('Cor principal').selectOption('tinto');
  await page.getByRole('button', { name: 'Mostrar grade completa' }).click();

  await openTab(page, /Boca/);
  const acidity = page.getByRole('group', { name: /^Acidez/ });
  await acidity.getByRole('button', { name: 'Alta · High' }).click();
  await expect(acidity.getByText(/Crocante, salivante, cortante/)).toBeVisible();
  await page.getByRole('button', { name: 'Sedosos · Silky' }).click();

  await openTab(page, /Serviço/);
  await page.getByLabel('De', { exact: true }).fill('16');
  await page.getByLabel('até', { exact: true }).fill('18');
  await page.getByRole('button', { name: /Bojuda de tinto/ }).click();

  await page.getByRole('button', { name: /Guardar no caderno/ }).click();
  await expect(page).toHaveURL(/#\/ficha\//);
  await expect(page.getByText('16 a 18 °C')).toBeVisible();
  await expect(page.getByText('Bojuda de tinto')).toBeVisible();
  await expect(page.getByText('Sedosos (Silky)')).toBeVisible();
});

test('a faixa de temperatura maior que 3 °C ganha um aviso', async ({ page }) => {
  await page.goto('/#/novo');
  await page.getByRole('button', { name: 'Mostrar grade completa' }).click();
  await openTab(page, /Serviço/);
  await page.getByLabel('De', { exact: true }).fill('12');
  await page.getByLabel('até', { exact: true }).fill('18');
  await expect(page.getByText(/A ASI pede uma faixa de até 3 °C/)).toBeVisible();
});

test('a ficha salva antes da grade ASI é convertida e guarda o que não coube', async ({ page }) => {
  await page.goto('/#/caderno');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

  // Grava uma ficha no formato 2 e desfaz a marca da migração, como num app antigo.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('winefolio-local');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(['records', 'meta'], 'readwrite');
          const now = Date.now();
          tx.objectStore('records').put({
            id: 'wine-antiga',
            schemaVersion: 2,
            revision: 1,
            produtor: 'Bodega Antiga',
            vinho: 'Tinto Antigo',
            safra: '2019',
            uvas: 'Malbec',
            regiaoPais: 'Mendoza',
            tipo: 'tranquilo',
            estilo: 'tinto',
            visual: { limpidez: 'Límpido', transparencia: 'Opaco', intensidade: 'Profunda', corNucleoBorda: 'Granada' },
            olfato: { condicao: 'Limpo / Correto', intensidade: 'Alta', aromas: '', desenvolvimento: 'Em evolução' },
            paladar: {
              docura: 'Seco',
              acidez: 'Média+',
              tanino: 'Alto',
              aromasBoca: '',
              corpo: 'Encorpado',
              alcool: 'Alto (14.5%)',
              retrogosto: '',
              persistencia: 'Longa (8s+)',
            },
            conclusao: { guarda: 'Pronto', preco: '', qualidade: 'Excelente', avaliacaoEstrelas: 5, harmonizacao: '', impressaoFinal: 'Memorável.' },
            tags: [],
            dataDegustacao: '2025-01-10',
            temperaturaServico: '16°C - 18°C',
            criadoEm: now,
            atualizadoEm: now,
            kind: 'personal',
            sourceFormat: 'native-v2',
            favorite: false,
            occasion: '',
            origin: { countryCode: 'AR', region: 'Mendoza' },
            aromaTags: ['Ameixa preta'],
            photoId: null,
            provenance: {},
            evidence: { noteAuthoredAt: null, aromasAuthoredAt: null, originConfirmedAt: null, revisitedAt: null },
            importMetadata: {},
          });
          tx.objectStore('meta').delete('migration:asi-v3');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      })
  );

  await page.reload();
  await page.getByRole('button', { name: 'Abrir ficha de Tinto Antigo' }).click();
  await expect(page.getByText('Granada (Garnet)')).toBeVisible();
  await expect(page.getByText('Encorpado (Full)')).toBeVisible();
  await expect(page.getByText('16 a 18 °C')).toBeVisible();
  await expect(page.getByText(/Fora da grade ASI: Média\+/)).toBeVisible();
  await expect(page.getByText(/Qualidade anotada antes da grade ASI: Excelente/)).toBeVisible();

  // Quem já tinha fichas começa na grade completa.
  await page.goto('/#/ajustes');
  await expect(page.getByRole('checkbox', { name: 'Ficha completa da ASI' })).toBeChecked();
});

test('o ajuste de nível abre a grade completa em toda ficha nova', async ({ page }) => {
  await page.goto('/#/ajustes');
  const toggle = page.getByRole('checkbox', { name: 'Ficha completa da ASI' });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();

  await page.goto('/#/novo');
  await expect(page.getByRole('tab', { name: /Serviço/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mostrar grade completa' })).toHaveCount(0);
});

test('desmarcar a cor tira também a cor da taça', async ({ page }) => {
  await page.goto('/#/novo');
  await page.getByPlaceholder(NAME).fill('Sem Cor');
  await openTab(page, /Visual/);
  const ruby = page.getByRole('button', { name: 'Rubi · Ruby' });
  await ruby.click();
  await expect(ruby).toHaveAttribute('aria-pressed', 'true');
  await ruby.click();
  await expect(ruby).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: /Guardar no caderno/ }).click();
  await expect(page).toHaveURL(/#\/ficha\//);
  await expect(page.locator('[title^="Cor: #"]')).toHaveCount(0);
});

test('no nível essencial, desmarcar um campo avançado não o faz sumir', async ({ page }) => {
  await page.goto('/#/novo');
  await page.getByRole('button', { name: 'Mostrar grade completa' }).click();
  await openTab(page, /Boca/);
  const acidity = page.getByRole('group', { name: /^Acidez/ });
  await acidity.getByRole('button', { name: 'Alta · High' }).click();
  await page.getByRole('button', { name: 'Voltar à ficha essencial' }).click();
  await acidity.getByRole('button', { name: 'Alta · High' }).click();
  await expect(acidity).toBeVisible();
  await expect(acidity.getByRole('button', { name: 'Alta · High' })).toHaveAttribute('aria-pressed', 'false');
});

test('temperatura fora da faixa avisa e não é guardada', async ({ page }) => {
  await page.goto('/#/novo');
  await page.getByRole('button', { name: 'Mostrar grade completa' }).click();
  await openTab(page, /Serviço/);
  await page.getByLabel('De', { exact: true }).fill('16');
  await page.getByLabel('até', { exact: true }).fill('35');
  await expect(page.getByRole('alert')).toContainText('entre -5 e 30 °C');
  await expect(page.getByRole('alert')).toContainText('ficou 16 °C');
});
