---
name: testing-winefolio
description: How to run and E2E-test the Winefolio app locally (dev server, hash routes, demo data, IndexedDB state).
---

# Testing Winefolio

## Run the app
- node/npm are NOT on PATH. `export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"` first.
- `npm run dev` starts `tsx server.ts` (Express + Vite middleware) on **port 3000**. Health check: `curl localhost:3000/api/health`.
- `npm test` = `tsx --test 'src/**/*.test.ts'` (node:test domain suites). `npm run lint` = `tsc --noEmit`.
- `npm run test:e2e` = Playwright (`e2e/*.spec.ts`), desktop Chrome + Pixel 7. It builds and starts the production server itself. In the Claude cloud container Chromium is preinstalled at `/opt/pw-browsers`; keep `@playwright/test` at the version that matches it and do not run `playwright install`.
- The label reading is mocked with `page.route('**/api/analyze-wine-label', ...)`; E2E never needs `GEMINI_API_KEY`.

## App facts
- All data is local in **IndexedDB `winefolio-local`** (stores: `records`, `photos`, `drafts`, `settings`). No auth, no backend data.
- Hash routing (src/app/navigation.ts): `#/caderno` journal, `#/passaporte` passport, `#/paladar` palate, `#/novo` entry editor (dialog), `#/ficha/<id>` detail dialog, `#/ficha/<id>/editar`, `#/ajustes` settings dialog, `#/adega` + `#/estatisticas` legacy pages (not in nav).
- Demo wines: journal empty-state button or Ajustes → "Traga as fichas de exemplo" → Carregar. **6 fictional entries**: Casa do Vento (PT, 5★), La Loma (AR, 4★), Rosé de Sol (FR, 4★), Linha da Serra (BR, 4★), Campo Claro (PT, 3★), Entre Rios (AR, 5★). `kind='demo'` — they obey the "Mostrar coleção de exemplo" toggle.
- Editor, detail and settings render as native `<dialog>` modals (`showModal`); ESC/backdrop close and navigate back to `#/caderno` or the ficha.
- To reset state between runs, clear the site data (DevTools → Application → Storage) or delete the IndexedDB via console.
- POST /api/analyze-wine-label needs `GEMINI_API_KEY` (dotenv). Without it, label OCR fails gracefully with a warn toast — do not treat as app breakage.

## Useful verifications
- Preferences live in the `settings` store under key `preferences` — read via browser console `indexedDB.open('winefolio-local')` for `reduceMotion`, `showDemo`, `demoFavorites`, `theme`, `textures`.
- `data-motion="reduce"` on `<html>` proves the reduce-motion preference took effect (`document.documentElement.getAttribute('data-motion')`); `body.flat` proves textures off.
- Dictation button (aria-label "Ditar impressão final", Conclusão tab) renders only when `SpeechRecognition`/`webkitSpeechRecognition` exists; in headless Chrome it may render but error with "Permita o microfone neste site..." — that is the graceful path, not a failure.
- Passaporte shows a country stamp per `origin.countryCode` in own entries; demos don't earn stamps. Paladar counts only own entries unless "Ver exemplo" is toggled.

## Devin Secrets Needed
- `GEMINI_API_KEY` — only if testing AI label OCR.

## Gotchas
- Buttons behind an open dialog still match `getByRole`; use `exact: true` for short names like `Exportar` or `Carregar`.
- `commitEntry` throws RevisionConflictError when re-loading demos over existing IDs — clicking "Carregar exemplos" a second time shows a failure toast; that is expected.
- A pre-existing React dev warning fires in the editor: `value` prop null on Tipo/Estilo selects (fields default to null in `createEntry`). Present before this PR — not a regression signal.
- Deleting a module imported by an HMR-loaded page can leave a stale Vite transform (`ReferenceError: X is not defined` even though source is fixed). Fix: restart the dev server (`rm -rf node_modules/.vite` if needed).
