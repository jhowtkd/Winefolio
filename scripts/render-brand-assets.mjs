// Gera favicon, ícones do app e imagem de compartilhamento a partir da rolha do sprite.
// Uso: node scripts/render-brand-assets.mjs (precisa do Chromium do Playwright).
import { writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const WINE = '#793b46';
const SHEET = '#fffaf0';
const PAPER = '#f2ecdf';

const CORK = `
  <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <path d="M24 7q11-5 21 0l-1 18q-2 17 10 24l2 49q-19 7-40 0l1-49q12-9 9-23Z" />
    <path d="M24 12q10 3 21 0M25 25h19M17 61q20 3 38 0M16 84q18 4 39 0M21 52v42M39 36l7 12" />
    <path d="M32 67q12-6 14 3t-11 8q-9-3-3-11Z" />
  </g>`;

/** Ícone quadrado: rolha creme sobre vinho. `inset` é a margem em fração do lado. */
function iconSvg(size, inset) {
  const box = size * (1 - inset * 2);
  const scale = box / 110;
  const x = (size - 70 * scale) / 2;
  const y = (size - 110 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${WINE}"/>
  <g transform="translate(${x} ${y}) scale(${scale})" color="${SHEET}" style="color:${SHEET}">${CORK.replace('stroke-width="1.5"', 'stroke-width="3"')}</g>
</svg>`;
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 110">
  <style>g{color:${WINE}}@media (prefers-color-scheme: dark){g{color:#e7b3bc}}</style>
  ${CORK.replace('stroke-width="1.5"', 'stroke-width="4"')}
</svg>
`;

const ogHtml = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=DM+Mono&display=swap" rel="stylesheet">
<style>
  body{margin:0;width:1200px;height:630px;background:${PAPER};display:flex;align-items:center;gap:80px;padding:0 110px;box-sizing:border-box;border-top:14px solid ${WINE}}
  h1{font:500 132px 'Fraunces',Georgia,serif;letter-spacing:-5px;color:#312d26;margin:0}
  h1 span{color:${WINE}}
  p{font:22px 'DM Mono',monospace;letter-spacing:6px;text-transform:uppercase;color:${WINE};margin:18px 0 0 6px}
  svg{width:210px;height:330px;color:${WINE};transform:rotate(-6deg)}
</style></head><body>
<svg viewBox="0 0 70 110">${CORK}</svg>
<div><h1>Winefolio<span>.</span></h1><p>Um caderno de descobertas</p></div>
</body></html>`;

async function main() {
  await mkdir('public/icons', { recursive: true });
  await writeFile('public/favicon.svg', favicon);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const renders = [
    { file: 'public/icons/icon-192.png', size: 192, inset: 0.14 },
    { file: 'public/icons/icon-512.png', size: 512, inset: 0.14 },
    { file: 'public/icons/icon-maskable-512.png', size: 512, inset: 0.24 },
    { file: 'public/apple-touch-icon.png', size: 180, inset: 0.16 },
  ];
  for (const { file, size, inset } of renders) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<body style="margin:0">${iconSvg(size, inset)}</body>`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: size, height: size } });
  }

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(ogHtml, { waitUntil: 'networkidle' }).catch(() => undefined);
  await page.screenshot({ path: 'public/og-image.png' });

  await browser.close();
}

main();
