// Gera os PNGs dos carimbos de marco em public/stamps/, com fundo transparente.
// Uso: npx tsx scripts/render-stamps.mjs [--ids a,b] [--family uva] [--sizes 512,1024] [--out public/stamps] [--sheet]
// Precisa do Chromium do Playwright e das fontes do app (Google Fonts, ou .woff2/.ttf locais em STAMP_FONTS_DIR).
// --sheet gera só a folha de contato (todos os modelos e estados) em test-results/stamps-sheet.png.
import { chromium } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { MilestoneStamp } from '../src/components/proto/MilestoneStamp.tsx';
import { STAMPS } from '../src/domain/stamps/index.ts';
import { modelFor } from '../src/components/proto/stamp-art/model-for.ts';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const outDir = resolve(option('out', 'public/stamps'));
const sizes = option('sizes', '512,1024').split(',').map(Number).filter(Boolean);
const onlyIds = option('ids', '').split(',').filter(Boolean);
const onlyFamily = option('family', '');

const GOOGLE_FONTS =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400;500&display=swap';

/** Fontes locais opcionais: arquivos cujo nome começa por Fraunces, DMMono ou Caveat. */
function localFontFaces(dir) {
  const families = { fraunces: 'Fraunces', dmmono: 'DM Mono', caveat: 'Caveat' };
  const faces = [];
  for (const file of readdirSync(dir)) {
    const key = Object.keys(families).find((prefix) => file.toLowerCase().replace(/[^a-z]/g, '').startsWith(prefix));
    const ext = extname(file).slice(1).toLowerCase();
    if (!key || !['woff2', 'woff', 'ttf', 'otf'].includes(ext)) continue;
    const format = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }[ext];
    const data = readFileSync(join(dir, file)).toString('base64');
    // "Fraunces-400-700.woff2" é variável de 400 a 700; "DMMono-500.woff2" é só 500.
    const range = file.match(/-(\d{3})(?:-(\d{3}))?\./);
    const weight = range ? [range[1], range[2]].filter(Boolean).join(' ') : '100 900';
    faces.push(
      `@font-face{font-family:'${families[key]}';font-weight:${weight};src:url(data:font/${ext};base64,${data}) format('${format}')}`
    );
  }
  return faces.join('\n');
}

function pageHtml() {
  const fontsDir = process.env.STAMP_FONTS_DIR;
  const fonts = fontsDir
    ? `<style>${localFontFaces(resolve(fontsDir))}</style>`
    : `<link rel="stylesheet" href="${GOOGLE_FONTS}">`;
  return `<!doctype html><html><head><meta charset="utf-8">${fonts}
<style>html,body{margin:0;background:transparent}#stage{display:inline-block;line-height:0}
.sheet{background:#fbf5e7;padding:16px;display:flex;flex-wrap:wrap;gap:14px;width:1200px;font:11px 'DM Mono',monospace;color:#312d26}
.sheet figure{margin:0;text-align:center;width:180px}.sheet h2{width:100%;margin:10px 0 0;font:600 16px Fraunces,serif}</style>
</head><body><div id="stage"></div></body></html>`;
}

/** Fontes carregadas de verdade. `document.fonts.check` diz sim para família que nunca foi declarada. */
async function ensureFonts(page) {
  const missing = await page.evaluate(async () => {
    const wanted = ['600 32px Fraunces', '500 16px "DM Mono"', '600 24px Caveat'];
    const results = await Promise.all(wanted.map((font) => document.fonts.load(font, 'Aa').catch(() => [])));
    return wanted.filter((_, i) => results[i].length === 0);
  });
  if (missing.length) {
    throw new Error(
      `Fontes não carregaram (${missing.join(', ')}). Confira a rede para o Google Fonts ou aponte STAMP_FONTS_DIR para arquivos locais.`
    );
  }
}

const markup = (props) => renderToStaticMarkup(createElement(MilestoneStamp, props));

// PNG: só o necessário para ler o canal alfa (8 bits, RGBA, sem entrelaçamento).
function decodeRgba(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('PNG sem canal alfa de 8 bits.');
    }
    if (type === 'IDAT') idat.push(data);
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const value = raw[y * (stride + 1) + 1 + x];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upLeft = x >= 4 && y > 0 ? pixels[(y - 1) * stride + x - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      pixels[y * stride + x] = (value + predictor) & 0xff;
    }
  }
  return { width, height, alpha: (x, y) => pixels[y * stride + x * 4 + 3] };
}

/** Critério de aceite: nenhum pixel de fundo, então os quatro cantos têm alfa 0. */
function assertTransparentCorners(buffer, label) {
  const { width, height, alpha } = decodeRgba(buffer);
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  for (const [x, y] of corners) {
    if (alpha(x, y) !== 0) throw new Error(`${label}: pixel (${x}, ${y}) com alfa ${alpha(x, y)}; o fundo deveria ser transparente.`);
  }
}

async function renderSheet(page) {
  const models = new Map();
  for (const def of STAMPS) if (!models.has(modelFor(def))) models.set(modelFor(def), def);
  const secret = STAMPS.find((def) => def.hidden);
  const figure = (props, caption) => `<figure>${markup({ ...props, size: 180 })}<figcaption>${caption}</figcaption></figure>`;
  const sections = [...models].map(
    ([model, def]) =>
      `<h2>${model}</h2>` +
      figure({ def, status: 'earned' }, `${def.id} · ganho`) +
      figure({ def, status: 'earned', postmark: true, earnedAt: '2026-03-12' }, 'com carimbo') +
      figure({ def: { ...def, tier: 3 }, status: 'earned' }, 'nível 3') +
      figure({ def, status: 'earned', compact: true }, 'compact') +
      figure({ def, status: 'locked' }, 'bloqueado')
  );
  sections.push(`<h2>secreto</h2>` + figure({ def: secret, status: 'locked' }, 'secreto bloqueado'));
  await page.evaluate((html) => {
    document.getElementById('stage').innerHTML = `<div class="sheet">${html}</div>`;
  }, sections.join(''));
  await page.evaluate(() => document.fonts.ready);
  mkdirSync('test-results', { recursive: true });
  await page.locator('#stage .sheet').screenshot({ path: 'test-results/stamps-sheet.png' });
  console.log('Folha de contato em test-results/stamps-sheet.png');
}

async function main() {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch(proxy ? { proxy: { server: proxy } } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1240, height: 900 } });
    await page.setContent(pageHtml(), { waitUntil: 'networkidle' });
    await ensureFonts(page);

    if (flag('sheet')) {
      await renderSheet(page);
      return;
    }

    const defs = STAMPS.filter(
      (def) => (!onlyIds.length || onlyIds.includes(def.id)) && (!onlyFamily || def.family === onlyFamily)
    );
    if (!defs.length) throw new Error('Nenhum marco corresponde aos filtros.');
    mkdirSync(outDir, { recursive: true });
    const largest = Math.max(...sizes);

    for (const def of defs) {
      for (const size of sizes) {
        await page.evaluate((html) => {
          document.getElementById('stage').innerHTML = html;
        }, markup({ def, status: 'earned', size }));
        await page.evaluate(() => document.fonts.ready);
        const png = await page.locator('#stage > svg').screenshot({ omitBackground: true });
        assertTransparentCorners(png, `${def.id} @${size}`);
        const file = size === largest ? `${def.id}.png` : `${def.id}-${size}.png`;
        writeFileSync(join(outDir, file), png);
      }
    }

    const manifestPath = join(outDir, 'manifest.json');
    const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')).ids ?? [] : [];
    const ids = [...new Set([...previous, ...defs.map((def) => def.id)])].sort();
    writeFileSync(manifestPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), sizes, ids }, null, 2)}\n`);
    console.log(`${defs.length} carimbos em ${basename(outDir)}/ (${sizes.join(' e ')} px), manifesto com ${ids.length} ids.`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
