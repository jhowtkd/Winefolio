# Contexto técnico

- React 19, Vite 6, TypeScript, Tailwind 4, Express em `server.ts`
- Testes: `npm test` (`tsx --test`)
- Testes no navegador: `npm run test:e2e` (Playwright, Chromium desktop e Pixel 7). Sobem `npm run build && npm start`
- CI: `.github/workflows/ci.yml` roda lint, testes e E2E em todo PR
- Checagem de tipos: `npm run lint`
- Servidor de desenvolvimento: `npm run dev` em `0.0.0.0:3000`
- Gemini só entra em `POST /api/analyze-wine-label` e exige `GEMINI_API_KEY`. `GEMINI_MODEL` e `GEMINI_DAILY_CAP` são opcionais
- Lógica do servidor fica em `src/server` como função pura com teste
- O lockfile do projeto é `package-lock.json` (npm, igual ao template do AI Studio e ao CI)
