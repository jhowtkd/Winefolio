# Winefolio

Caderno pessoal de degustação de vinhos. A pessoa registra fichas sensoriais no navegador, sem conta, e enxerga a adega como rótulos, o passaporte de países e o próprio paladar.

## Rodar localmente

Requer Node 22 e Bun 1.4 (o `bun.lock` é o lockfile do projeto).

```bash
bun install
cp .env.example .env   # preencha GEMINI_API_KEY se quiser a leitura de rótulo
npm run dev            # http://localhost:3000
```

`npm run dev` sobe o Express de `server.ts` com o Vite em modo middleware. Sem `GEMINI_API_KEY`, tudo funciona, exceto a leitura de rótulo com IA, que mostra um aviso.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---|---|
| `GEMINI_API_KEY` | Para a leitura de rótulo | Chave do Gemini. No AI Studio, vai em Secrets. |
| `GEMINI_MODEL` | Não | Modelo da leitura. Padrão: `gemini-3.8-flash`. |
| `GEMINI_DAILY_CAP` | Não | Teto de leituras por dia, por instância. Padrão: 500. |
| `PORT` | Não | Porta do servidor. Padrão: 3000. |

A rota `POST /api/analyze-wine-label` também limita cada IP a 10 leituras a cada 10 minutos e recusa imagens acima de 5 MB ou fora de JPG, PNG e WEBP.

## Testes

```bash
npm run lint       # tsc --noEmit
npm test           # regras de domínio e do servidor (node:test)
npm run test:e2e   # Playwright: build de produção + Chromium desktop e Pixel 7
```

O CI (`.github/workflows/ci.yml`) instala com `bun install --frozen-lockfile` e roda os três em todo PR. Depois de mudar dependência, rode `bun install` e faça commit do `bun.lock`. Os testes E2E simulam a rota do Gemini e não precisam de chave.

## Deploy pelo Google AI Studio

O AI Studio publica o app no Cloud Run. Antes de cada deploy:

- [ ] A `main` está verde no CI e o AI Studio está no mesmo commit.
- [ ] `GEMINI_API_KEY` e `GEMINI_DAILY_CAP` definidos nos Secrets.
- [ ] Alerta de orçamento ativo no projeto do Google Cloud da chave.
- [ ] Na revisão do Cloud Run: `NODE_ENV=production` e máximo de instâncias limitado (sugestão: 3).
- [ ] Teste na URL publicada, não no preview do AI Studio: o preview roda em iframe com armazenamento separado.

O build de produção é `npm run build`, e o servidor sobe com `npm start`.

## Arquitetura

- `src/domain`: regras puras (agrupamento da adega, estatísticas, leitura de rótulo, lembrete de backup). Cada regra tem teste.
- `src/domain/asi-*.ts`: a ficha segue a grade de degustação da ASI. `asi-vocabulary` tem os termos (PT e EN), `asi-fields` os campos e os níveis Iniciante e Avançado, `asi-convert` a conversão de texto antigo. Especificação em `docs/superpowers/specs/2026-09-25-ficha-asi-design.md`.
- `src/repositories`: IndexedDB (`winefolio-local`), migrações (versão 1 e grade ASI), backup (formato 3) e importação (formatos 2 e 3).
- `src/features`: telas (caderno, ficha, editor, adega, estatísticas, passaporte, paladar, ajustes).
- `src/server`: regras do servidor (limite de uso, validação da foto).
- `server.ts`: Express. Serve o app e a única rota de API.
- `e2e`: testes Playwright.

Planos de trabalho ficam em `docs/superpowers/plans/`, e o contexto do projeto em `memory-bank/`.

## Privacidade

As fichas e fotos ficam só no IndexedDB do navegador. Nada vai para um servidor, exceto a foto do rótulo quando a pessoa pede a leitura com IA: na primeira vez o app pede licença, e ela pode ser revogada em Opções. A foto é enviada ao Google Gemini e não é guardada pelo servidor do Winefolio.

Como os dados são locais, o app lembra a pessoa de exportar um backup e pede ao navegador para não apagar o armazenamento.
