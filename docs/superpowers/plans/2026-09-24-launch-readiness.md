# Winefolio pronto para lançar

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lançar o Winefolio publicamente pelo Google AI Studio (deploy no Cloud Run) sem perder dados de usuário, sem deixar a chave do Gemini exposta a abuso e com a IA declarada de forma honesta.

**Contexto de hospedagem:** o AI Studio empacota `server.ts` (Express) e publica no Cloud Run. A chave `GEMINI_API_KEY` é do dono do app, então toda leitura de rótulo sai da conta dele. O Cloud Run roda atrás de proxy, pode ter várias instâncias e escala para zero. O preview do AI Studio roda dentro de um iframe com armazenamento particionado. Testes de armazenamento, câmera e instalação valem só na URL publicada do Cloud Run.

**Architecture:** Regra nova mora em função pura (`src/domain` ou `src/server`) com teste `node:test`. A UI e o `server.ts` só chamam essas funções. Fluxos que dependem do navegador real (IndexedDB, download, câmera) ganham teste E2E com Playwright, porque o bug da tarefa 1 passou pelos testes em Node.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Express 4, `@google/genai` 2, zod 4, `idb` 8, testes com `tsx --test` e Playwright.

---

## Priorização ICE com a lente de lançamento

Nota de 1 a 10 para Impacto (I), Confiança (C) e Facilidade (E). Score = I × C × E.

| Tarefa | Item | I | C | E | Score | Classe |
|---|---|---|---|---|---|---|
| 1 | Backup quebra com 2 ou mais fotos | 9 | 10 | 9 | 810 | Bloqueia lançamento |
| 2 | Rota do Gemini protegida e deploy em modo produção | 9 | 8 | 8 | 576 | Bloqueia lançamento |
| 6 | Adega e Estatísticas no menu | 6 | 9 | 10 | 540 | Deveria entrar |
| 4 | Armazenamento persistente e lembrete de backup | 8 | 8 | 8 | 512 | Bloqueia lançamento |
| 3 | IA declarada: consentimento e campos marcados | 7 | 9 | 8 | 504 | Bloqueia lançamento |
| 5 | Portão de release: E2E e CI | 7 | 9 | 6 | 378 | Bloqueia lançamento |
| 7 | Pacote de lançamento: ícones, manifest, README | 5 | 9 | 8 | 360 | Deveria entrar |
| 8 | Importação com prévia, validação e fotos corretas | 7 | 8 | 6 | 336 | Deveria entrar |
| 9 | Desfazer exclusão | 6 | 8 | 7 | 336 | Pode ficar para depois |
| 10 | Bundle inicial abaixo de 300 kB | 5 | 8 | 8 | 320 | Pode ficar para depois |

O que mudou em relação à auditoria:
- A rota do Gemini subiu. No lançamento público, a chave do dono fica aberta para qualquer um.
- A IA declarada entrou. A nota de privacidade diz "Nada é enviado para servidores sem o seu consentimento", mas a leitura automática vem ligada por padrão e manda a foto ao Google logo depois da captura.
- CI virou portão de release com E2E, porque o teste unitário não pega o bug da tarefa 1.
- O estoque real da adega saiu para depois do lançamento: muda o modelo de dados e não é pré-requisito.
- O PWA com service worker saiu para depois do lançamento: um service worker com erro no dia 1 prende usuários em versão velha. Fica só o manifest (tarefa 7).

A numeração é a ordem de execução, não a ordem do score.

## Estado da execução (2026-09-24)

As 10 tarefas estão implementadas na branch `claude/auditoria-features-ice-865qwj`, uma por commit. Resultado final: 61 testes unitários e 22 cenários E2E (desktop e Pixel 7) verdes, e o chunk principal caiu de 809 kB para 295 kB.

Desvios em relação ao texto das tarefas:
- Tarefa 3: `readPath` trata `undefined` e `null` como vazio. Sem isso, campos que `createEntry` deixa `undefined` apareciam como preenchidos pela IA.
- Tarefa 4: `BackupStatus` guarda `lastBackupAt` e `snoozedUntil`. A contagem usa `atualizadoEm` das fichas pessoais, como no plano.
- Tarefa 6: entre 680 e 1023 px, Adega e Estatísticas saem do cabeçalho (estourava a largura) e ficam em Opções, como no celular.
- Tarefa 8: antes de validar, `normalizeImportedEntry` completa a ficha com os padrões de `createEntry`. Validar direto descartaria fichas reais do app sem `origin`. O teste de "ficha inválida" usa `schemaVersion: 1`.
- Tarefa 10: cada componente sob demanda tem seu próprio `Suspense`. Com um só, um chunk lento reexibia o editor anterior com estado velho, e o segundo registro falhava por conflito de revisão. Há um E2E que atrasa o chunk da ficha para cobrir isso. O backup, a importação e a migração v1 também carregam sob demanda.

O CI só roda em PR ou push na `main`, então ainda não rodou no GitHub. Os itens do critério de lançamento abaixo continuam abertos: dependem do merge e de configurações fora do código.

## Critério de lançamento (go / no-go)

O lançamento só acontece com tudo abaixo verdadeiro:

- [ ] Tarefas 1 a 5 na `main`.
- [ ] `npm run lint`, `npm test` e `npm run test:e2e` verdes no CI.
- [ ] No AI Studio: `GEMINI_API_KEY` e `GEMINI_DAILY_CAP` definidos.
- [ ] No Google Cloud: alerta de orçamento ativo no projeto da chave.
- [ ] No Cloud Run: `NODE_ENV=production` confirmado na revisão ativa e máximo de instâncias limitado (sugestão: 3).
- [ ] Teste manual na URL do Cloud Run em iPhone (Safari) e Android (Chrome): criar ficha com foto, ler rótulo, exportar backup, importar em outro navegador, adicionar à tela inicial.

## Global Constraints

- Textos de interface em português. Identificadores novos em inglês. Campos existentes continuam em português.
- Não subir `schemaVersion` de 2. `DB_VERSION` do IndexedDB continua 1 (o store `meta` já existe).
- Dependências novas só em `devDependencies` e só estas: `@playwright/test`, `fake-indexeddb`. Nenhuma dependência de runtime nova.
- `server.ts` continua sendo o único servidor. Lógica nova do servidor fica em `src/server/*.ts` como função pura com teste.
- Mensagem de erro para o usuário nunca repete `err.message` do servidor ou do Gemini. O detalhe vai só para o log.
- Comando de um arquivo: `npx tsx --test <arquivo>`. Suíte: `npm test`. Tipos: `npm run lint`. E2E: `npm run test:e2e` (existe a partir da tarefa 5).
- Commit em inglês, no imperativo, uma tarefa por commit.

---

### Task 1: O backup exporta todas as fotos

`exportBackup` espera `blob.arrayBuffer()` no meio da transação. O Chromium fecha a transação nesse ponto e a leitura da foto seguinte falha com `InvalidStateError: The transaction has finished`. Com duas fotos (incluindo a do rascunho) o backup quebra. `fake-indexeddb` não reproduz o erro, então a regressão automática entra na tarefa 5.

A exportação também leva fotos de fichas de exemplo, que o próprio arquivo não exporta.

**Files:**
- Create: `src/domain/backup-photos.ts`
- Test: `src/domain/backup-photos.test.ts`
- Modify: `src/repositories/transfer.ts` (`exportBackup`, linha 205 em diante)

**Interfaces:**
- Produces:
  - `DRAFT_PHOTO_ID = 'draft:active'`
  - `backupPhotoIds(entries: WineEntry[], draft: EntryDraft | null): Set<string>`
  - `bytesToBase64(bytes: Uint8Array): string`

- [x] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { backupPhotoIds, bytesToBase64, DRAFT_PHOTO_ID } from './backup-photos.js';

describe('backupPhotoIds', () => {
  it('leva só as fotos das fichas exportadas', () => {
    const withPhoto = createEntry('a');
    withPhoto.photoId = 'photo-a';
    const withoutPhoto = createEntry('b');
    assert.deepStrictEqual([...backupPhotoIds([withPhoto, withoutPhoto], null)], ['photo-a']);
  });

  it('inclui a foto do rascunho quando há rascunho', () => {
    const draft = { id: 'active' as const, entry: createEntry('d'), editingId: null, baseRevision: null, updatedAt: 0 };
    assert.ok(backupPhotoIds([], draft).has(DRAFT_PHOTO_ID));
  });
});

describe('bytesToBase64', () => {
  it('codifica igual ao Buffer, inclusive acima de 32 KB', () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 256);
    assert.strictEqual(bytesToBase64(bytes), Buffer.from(bytes).toString('base64'));
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/backup-photos.test.ts`
Expected: FAIL with `Cannot find module './backup-photos.js'`

- [x] **Step 3: Write minimal implementation**

`src/domain/backup-photos.ts`:

```ts
import type { EntryDraft, WineEntry } from './wine-entry';

export const DRAFT_PHOTO_ID = 'draft:active';

export function backupPhotoIds(entries: WineEntry[], draft: EntryDraft | null): Set<string> {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (entry.photoId) ids.add(entry.photoId);
  }
  if (draft) ids.add(DRAFT_PHOTO_ID);
  return ids;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
```

Em `src/repositories/transfer.ts`, trocar o corpo de `exportBackup` até a montagem de `backupObject`:

```ts
export async function exportBackup(db: IDBPDatabase<WineDb>): Promise<Blob> {
  // Todos os pedidos saem no mesmo tick. Esperar qualquer promessa que não seja
  // do IndexedDB dentro da transação faz o navegador fechá-la.
  const tx = db.transaction(['records', 'photos', 'drafts', 'settings'], 'readonly');
  const photoStore = tx.objectStore('photos');
  const [records, draft, preferences, photoKeys, photoBlobs] = await Promise.all([
    tx.objectStore('records').getAll(),
    tx.objectStore('drafts').get('active'),
    tx.objectStore('settings').get('preferences'),
    photoStore.getAllKeys(),
    photoStore.getAll(),
    tx.done,
  ]);

  const entries = records.filter((r) => r.kind !== 'demo');
  const wanted = backupPhotoIds(entries, draft ?? null);
  const photosData: Array<{ id: string; mimeType: string; base64: string }> = [];
  for (let i = 0; i < photoKeys.length; i++) {
    const id = String(photoKeys[i]);
    const blob = photoBlobs[i];
    if (!blob || !wanted.has(id)) continue;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    photosData.push({ id, mimeType: blob.type, base64: bytesToBase64(bytes) });
  }

  const backupObject = {
    format: 'winefolio',
    version: 2,
    exportedAt: new Date().toISOString(),
    entries,
    draft: draft || null,
    preferences: preferences || null,
    photos: photosData,
  };
  // resto igual
```

`getAllKeys` e `getAll` no mesmo store e na mesma transação devolvem a mesma ordem de chave. Importar `backupPhotoIds` e `bytesToBase64` de `../domain/backup-photos`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/backup-photos.test.ts && npm test && npm run lint`
Expected: PASS.

Manual (Chromium, `npm run dev`): criar duas fichas com foto, abrir Ajustes, Exportar. Antes da correção aparece toast de erro. Depois, o JSON baixado tem `photos.length === 2`.

- [x] **Step 5: Commit**

```bash
git add src/domain/backup-photos.ts src/domain/backup-photos.test.ts src/repositories/transfer.ts
git commit -m "fix: export every photo in the backup"
```

---

### Task 2: A rota do Gemini aguenta o público e o servidor sobe em modo produção

Hoje `POST /api/analyze-wine-label` aceita qualquer chamador sem limite, corpo de até 25 MB, qualquer `mimeType`, e devolve `err.message` cru. O modelo está fixo no código. A resposta do Gemini vai para o cliente sem validação. `npm start` roda `node dist/server.cjs` sem `NODE_ENV`, e `server.ts` só serve o `dist` quando `NODE_ENV === 'production'`; fora disso sobe o Vite em modo dev. O Cloud Run passa o IP do cliente em `X-Forwarded-For`, então `req.ip` só é correto com `trust proxy`.

Limitador em memória é por instância e zera quando o Cloud Run escala para zero. Para o lançamento isso basta, junto com o teto diário e o máximo de instâncias do critério de lançamento. Um limitador compartilhado (Redis, Firestore) fica para depois do lançamento.

**Files:**
- Create: `src/server/rate-limit.ts`, `src/server/label-request.ts`, `src/domain/label-schema.ts`
- Test: `src/server/rate-limit.test.ts`, `src/server/label-request.test.ts`, `src/domain/label-schema.test.ts`
- Modify: `server.ts`, `src/services/wineOcrService.ts`, `package.json` (script `start`), `.env.example`

**Interfaces:**
- Produces:
  - `createRateLimiter(options: { windowMs: number; max: number }): { hit(key: string, now?: number): { allowed: boolean; retryAfterSeconds: number } }`
  - `parseLabelRequest(body: unknown): { ok: true; mimeType: string; data: string } | { ok: false; status: 400 | 413 | 415; error: string }`
  - `MAX_IMAGE_BYTES = 5 * 1024 * 1024`
  - `LabelAnalysisSchema` (zod), compatível com `LabelAnalysis` de `src/domain/label-fill.ts`

- [x] **Step 1: Write the failing tests**

`src/server/rate-limit.test.ts`:

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRateLimiter } from './rate-limit.js';

describe('createRateLimiter', () => {
  it('bloqueia depois do máximo e libera quando a janela passa', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
    assert.strictEqual(limiter.hit('ip', 0).allowed, true);
    assert.strictEqual(limiter.hit('ip', 1_000).allowed, true);
    const blocked = limiter.hit('ip', 2_000);
    assert.strictEqual(blocked.allowed, false);
    assert.strictEqual(blocked.retryAfterSeconds, 58);
    assert.strictEqual(limiter.hit('ip', 61_000).allowed, true);
  });

  it('conta cada chave separada', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    assert.strictEqual(limiter.hit('a', 0).allowed, true);
    assert.strictEqual(limiter.hit('b', 0).allowed, true);
  });
});
```

`src/server/label-request.test.ts`:

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseLabelRequest, MAX_IMAGE_BYTES, type LabelRequest } from './label-request.js';

// O tsconfig não usa strict, então `ok` não discrimina a união.
const statusOf = (result: LabelRequest) => ('status' in result ? result.status : null);

describe('parseLabelRequest', () => {
  it('aceita data URL jpeg', () => {
    const result = parseLabelRequest({ imageBase64: 'data:image/jpeg;base64,QUJD' });
    assert.deepStrictEqual(result, { ok: true, mimeType: 'image/jpeg', data: 'QUJD' });
  });

  it('recusa corpo sem imagem', () => {
    assert.strictEqual(parseLabelRequest({}).ok, false);
    assert.strictEqual(parseLabelRequest(null).ok, false);
  });

  it('recusa tipo fora da lista', () => {
    const result = parseLabelRequest({ imageBase64: 'data:image/svg+xml;base64,QUJD' });
    assert.strictEqual(statusOf(result), 415);
  });

  it('recusa base64 inválido', () => {
    const result = parseLabelRequest({ imageBase64: 'data:image/png;base64,<script>' });
    assert.strictEqual(statusOf(result), 400);
  });

  it('recusa imagem acima do limite', () => {
    const big = 'A'.repeat(Math.ceil((MAX_IMAGE_BYTES + 10) / 3) * 4);
    const result = parseLabelRequest({ imageBase64: `data:image/jpeg;base64,${big}` });
    assert.strictEqual(statusOf(result), 413);
  });
});
```

`src/domain/label-schema.test.ts`:

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LabelAnalysisSchema } from './label-schema.js';

describe('LabelAnalysisSchema', () => {
  it('mantém campos válidos e descarta o que não conhece', () => {
    const parsed = LabelAnalysisSchema.parse({ produtor: 'Quinta', vinho: 'Reserva', extra: 'x' });
    assert.deepStrictEqual(parsed, { produtor: 'Quinta', vinho: 'Reserva' });
  });

  it('descarta só o campo inválido, não a leitura inteira', () => {
    const parsed = LabelAnalysisSchema.parse({ produtor: 'Quinta', corHexSugerida: 'vermelho' });
    assert.strictEqual(parsed.produtor, 'Quinta');
    assert.strictEqual(parsed.corHexSugerida, undefined);
  });

  it('recusa resposta que não é objeto', () => {
    assert.strictEqual(LabelAnalysisSchema.safeParse('texto').success, false);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test src/server/rate-limit.test.ts src/server/label-request.test.ts src/domain/label-schema.test.ts`
Expected: FAIL with `Cannot find module`.

- [x] **Step 3: Write minimal implementation**

`src/server/rate-limit.ts`:

```ts
export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function createRateLimiter(options: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    for (const [key, times] of hits) {
      if (times.every((t) => t <= now - options.windowMs)) hits.delete(key);
    }
  }

  return {
    hit(key: string, now: number = Date.now()): RateLimitResult {
      if (hits.size > 5_000) prune(now);
      const recent = (hits.get(key) ?? []).filter((t) => t > now - options.windowMs);
      if (recent.length >= options.max) {
        hits.set(key, recent);
        const retryAfterSeconds = Math.max(1, Math.ceil((recent[0] + options.windowMs - now) / 1000));
        return { allowed: false, retryAfterSeconds };
      }
      recent.push(now);
      hits.set(key, recent);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
```

`src/server/label-request.ts`:

```ts
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type LabelRequest =
  | { ok: true; mimeType: string; data: string }
  | { ok: false; status: 400 | 413 | 415; error: string };

export function parseLabelRequest(body: unknown): LabelRequest {
  const raw = (body as { imageBase64?: unknown } | null)?.imageBase64;
  if (typeof raw !== 'string' || !raw) {
    return { ok: false, status: 400, error: 'Nenhuma imagem foi enviada.' };
  }
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(raw);
  const mimeType = match ? match[1] : 'image/jpeg';
  const data = match ? match[2] : raw;
  if (!ALLOWED_TYPES.has(mimeType)) {
    return { ok: false, status: 415, error: 'Envie uma foto em JPG, PNG ou WEBP.' };
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    return { ok: false, status: 400, error: 'A imagem enviada está corrompida.' };
  }
  if (Math.floor((data.length * 3) / 4) > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, error: 'A foto é grande demais. Tente outra.' };
  }
  return { ok: true, mimeType, data };
}
```

`src/domain/label-schema.ts`:

```ts
import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max).optional().catch(undefined);

export const LabelAnalysisSchema = z.object({
  produtor: text(300),
  vinho: text(300),
  safra: text(50),
  uvas: text(300),
  regiaoPais: text(300),
  tipo: text(40),
  estilo: text(40),
  alcool: text(100),
  temperaturaServico: text(100),
  decantacao: text(100),
  potencialGuarda: text(100),
  aromasSugeridos: text(2000),
  harmonizacaoSugerida: text(2000),
  qualidadeEstimada: text(100),
  corHexSugerida: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().catch(undefined),
  resumo: text(2000),
});
```

Em `server.ts`:

```ts
import { createRateLimiter } from './src/server/rate-limit';
import { parseLabelRequest } from './src/server/label-request';
import { LabelAnalysisSchema } from './src/domain/label-schema';

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const perIp = createRateLimiter({ windowMs: 10 * 60_000, max: 10 });
const perDay = createRateLimiter({
  windowMs: 24 * 60 * 60_000,
  max: Number(process.env.GEMINI_DAILY_CAP) || 500,
});

app.set('trust proxy', true);
app.use(express.json({ limit: '8mb' }));
```

No handler da rota, antes de chamar o Gemini:

```ts
const request = parseLabelRequest(req.body);
if (!request.ok) {
  res.status(request.status).json({ success: false, error: request.error });
  return;
}
const ipHit = perIp.hit(req.ip || 'unknown');
if (!ipHit.allowed) {
  res.set('Retry-After', String(ipHit.retryAfterSeconds));
  res.status(429).json({ success: false, error: 'Muitas leituras seguidas. Tente de novo em alguns minutos.' });
  return;
}
if (!perDay.hit('global').allowed) {
  res.status(503).json({ success: false, error: 'A leitura de rótulos chegou ao limite de hoje. Preencha à mão ou tente amanhã.' });
  return;
}
```

Usar `request.mimeType` e `request.data` no `inlineData`. Trocar `model` por `GEMINI_MODEL`. Em `config`, adicionar `abortSignal: AbortSignal.timeout(30_000)`. Depois de `JSON.parse(textOutput)`:

```ts
const parsed = LabelAnalysisSchema.safeParse(JSON.parse(textOutput));
if (!parsed.success) throw new Error('Resposta do Gemini fora do formato esperado.');
res.json({ success: true, data: parsed.data });
```

No `catch`, logar o erro inteiro e responder sem `err.message`:

```ts
const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
res.status(timedOut ? 504 : 502).json({
  success: false,
  error: timedOut
    ? 'A leitura demorou demais. Tente de novo.'
    : 'Não foi possível ler o rótulo agora. Preencha à mão ou tente de novo.',
});
```

Depois das rotas `/api`, antes de `setupViteOrStatic()`, responder JSON quando o corpo passar do limite:

```ts
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ success: false, error: 'A foto é grande demais. Tente outra.' });
    return;
  }
  next(err);
});
```

Em `src/services/wineOcrService.ts`, não confiar que a resposta é JSON (o Cloud Run devolve HTML em 502/504 de infraestrutura):

```ts
let json: { success?: boolean; error?: string; data?: AnalyzedWineLabel } = {};
try {
  json = await response.json();
} catch {
  // corpo não-JSON: cai na mensagem padrão
}
if (!response.ok || !json.success) {
  throw new Error(json.error || 'Não foi possível ler as informações do rótulo.');
}
return json.data as AnalyzedWineLabel;
```

Em `package.json`: `"start": "NODE_ENV=production node dist/server.cjs"`.

Em `.env.example`, documentar:

```
# GEMINI_MODEL: modelo usado na leitura de rótulo. Padrão: gemini-3.8-flash.
GEMINI_MODEL=""
# GEMINI_DAILY_CAP: teto de leituras por dia por instância. Padrão: 500.
GEMINI_DAILY_CAP=""
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test src/server/*.test.ts src/domain/label-schema.test.ts && npm test && npm run lint && npm run build`
Expected: PASS, build sem erro.

Manual, com `npm run build && npm start` e sem `GEMINI_API_KEY`:

```bash
curl -s -XPOST localhost:3000/api/analyze-wine-label -H 'content-type: application/json' -d '{}'                                        # 400
curl -s -XPOST localhost:3000/api/analyze-wine-label -H 'content-type: application/json' -d '{"imageBase64":"data:image/gif;base64,QUJD"}' # 415
for i in $(seq 11); do curl -s -o /dev/null -w '%{http_code}\n' -XPOST localhost:3000/api/analyze-wine-label -H 'content-type: application/json' -d '{"imageBase64":"data:image/jpeg;base64,QUJD"}'; done  # 10x 502, depois 429
curl -sI localhost:3000/ | head -5   # servido do dist, sem cabeçalhos do Vite
```

- [x] **Step 5: Commit**

```bash
git add src/server src/domain/label-schema.ts src/domain/label-schema.test.ts server.ts src/services/wineOcrService.ts package.json .env.example
git commit -m "fix: rate-limit and validate the label reading endpoint"
```

---

### Task 3: A IA pede licença e deixa rastro

A leitura automática (`autoAnalyzeAfterCapture`, `useState(true)` em `LabelPhotoCapture.tsx:47`) manda a foto ao Google assim que ela é capturada. A nota de Ajustes promete o contrário. `applyLabelAnalysis` escreve texto do modelo em `conclusao.impressaoFinal` e `conclusao.qualidade`, que são o julgamento da pessoa, e não marca nada em `provenance`, embora `'ai-unverified'` exista no tipo.

Decisão recomendada, que o dono do produto precisa confirmar antes do Step 3: a IA deixa de preencher `impressaoFinal` e `qualidade`. Ela continua preenchendo dados de rótulo e sugestões técnicas.

**Files:**
- Modify: `src/domain/wine-entry.ts` (`Preferences.aiConsentAt`), `src/domain/preferences.ts`
- Modify: `src/domain/label-fill.ts`
- Test: `src/domain/label-fill.test.ts` (acrescentar casos)
- Modify: `src/features/entry/EntryEditorPage.tsx` (`handleAnalyzeLabel`, `handleSave`), `src/App.tsx` (props do editor)
- Modify: `src/features/entry/TastingSheetDetails.tsx` (aviso de campos sugeridos)
- Modify: `src/features/settings/SettingsPage.tsx` (texto de privacidade, revogar consentimento)

**Interfaces:**
- Consumes: `WineEntry.provenance`, `DataSource`
- Produces:
  - `Preferences.aiConsentAt: number | null` (ausente em dados antigos equivale a `null`)
  - `AI_FILLED_PATHS: readonly string[]`
  - `applyLabelAnalysis(entry, analysis)` passa a marcar `provenance[path] = 'ai-unverified'` em cada campo que ela mudou
  - `settleAiProvenance(entry: WineEntry, aiSnapshot: WineEntry): WineEntry`: campo marcado como `ai-unverified` cujo valor atual difere do snapshot vira `'user'`
  - `aiSuggestedFields(entry: WineEntry): string[]`: caminhos ainda `ai-unverified`

- [x] **Step 1: Write the failing test**

Acrescentar em `src/domain/label-fill.test.ts`:

```ts
describe('proveniência da leitura de rótulo', () => {
  it('marca como ai-unverified só o que a IA preencheu', () => {
    const entry = createEntry('x');
    entry.produtor = 'Meu produtor';
    const next = applyLabelAnalysis(entry, { produtor: 'Outro', vinho: 'Reserva', safra: '2020' });
    assert.strictEqual(next.produtor, 'Meu produtor');
    assert.strictEqual(next.provenance.produtor, undefined);
    assert.strictEqual(next.provenance.vinho, 'ai-unverified');
    assert.strictEqual(next.provenance.safra, 'ai-unverified');
  });

  it('não escreve a impressão final nem a qualidade', () => {
    const next = applyLabelAnalysis(createEntry('x'), { resumo: 'Texto do modelo', qualidadeEstimada: 'Excelente' });
    assert.strictEqual(next.conclusao.impressaoFinal, '');
    assert.strictEqual(next.conclusao.qualidade, '');
  });

  it('campo editado depois da leitura passa a ser da pessoa', () => {
    const filled = applyLabelAnalysis(createEntry('x'), { vinho: 'Reserva', safra: '2020' });
    const edited = { ...filled, vinho: 'Reserva Especial' };
    const settled = settleAiProvenance(edited, filled);
    assert.strictEqual(settled.provenance.vinho, 'user');
    assert.strictEqual(settled.provenance.safra, 'ai-unverified');
    assert.deepStrictEqual(aiSuggestedFields(settled), ['safra']);
  });
});
```

Importar `settleAiProvenance` e `aiSuggestedFields` de `./label-fill.js`. Se algum teste existente esperar `impressaoFinal` vindo de `resumo`, atualizar esse teste junto, porque a regra mudou de propósito.

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/label-fill.test.ts`
Expected: FAIL (`settleAiProvenance` não existe; `vinho` sem proveniência).

- [x] **Step 3: Write minimal implementation**

Em `src/domain/label-fill.ts`:

```ts
export const AI_FILLED_PATHS = [
  'produtor', 'vinho', 'safra', 'uvas', 'regiaoPais', 'tipo', 'estilo',
  'temperaturaServico', 'decantacao', 'visual.corHex', 'olfato.aromas',
  'paladar.alcool', 'conclusao.guarda', 'conclusao.harmonizacao',
] as const;

function readPath(entry: WineEntry, path: string): unknown {
  return path.split('.').reduce<any>((value, key) => value?.[key], entry);
}

function markChanged(before: WineEntry, after: WineEntry): WineEntry {
  const provenance = { ...after.provenance };
  for (const path of AI_FILLED_PATHS) {
    if (readPath(before, path) !== readPath(after, path)) provenance[path] = 'ai-unverified';
  }
  return { ...after, provenance };
}

export function settleAiProvenance(entry: WineEntry, aiSnapshot: WineEntry): WineEntry {
  const provenance = { ...entry.provenance };
  for (const path of AI_FILLED_PATHS) {
    if (provenance[path] === 'ai-unverified' && readPath(entry, path) !== readPath(aiSnapshot, path)) {
      provenance[path] = 'user';
    }
  }
  return { ...entry, provenance };
}

export function aiSuggestedFields(entry: WineEntry): string[] {
  return AI_FILLED_PATHS.filter((path) => entry.provenance?.[path] === 'ai-unverified');
}
```

Em `applyLabelAnalysis`, remover as linhas de `qualidade` e `impressaoFinal`, guardar o objeto montado em `const next` e devolver `markChanged(entry, next)`.

Em `Preferences`, acrescentar `aiConsentAt: number | null`. Em `createPreferences`, `aiConsentAt: null`.

Em `src/App.tsx`, passar ao editor `aiConsented={Boolean(preferences.aiConsentAt)}` e `onGrantAiConsent={() => updatePreferences({ aiConsentAt: Date.now() })}`.

Em `EntryEditorPage.tsx`:
- Guardar `const aiSnapshot = useRef<WineEntry | null>(null)`.
- `handleAnalyzeLabel(photoDataUrl)`: sem consentimento, guardar a foto pendente e abrir um `ModalDialog` de confirmação. Texto: "Para ler o rótulo, a foto é enviada ao Google Gemini. O Winefolio não guarda a foto no servidor. Você pode desligar isso em Ajustes." Botões: "Enviar e ler" (chama `onGrantAiConsent` e segue a leitura) e "Só guardar a foto".
- Depois de `applyLabelAnalysis`, guardar o resultado em `aiSnapshot.current`. O toast passa a dizer "Campos sugeridos pela IA. Revise antes de salvar."
- Em `handleSave`, antes de salvar: `const toSave = aiSnapshot.current ? settleAiProvenance(formData, aiSnapshot.current) : formData`.

Em `TastingSheetDetails.tsx`, quando `aiSuggestedFields(entry).length > 0`, mostrar uma linha discreta em `detail-footer-note`: "Sugerido pela IA e não revisado: vinho, safra." (mapear caminho para rótulo legível).

Em `SettingsPage.tsx`:
- Substituir a nota de privacidade por: "Suas notas e fotos ficam só neste navegador (IndexedDB `winefolio-local`). A foto do rótulo só sai daqui quando você usa a leitura com IA, e vai para o Google Gemini."
- Acrescentar a linha "Leitura de rótulo com IA". Com consentimento, mostrar "Permitida desde {data}" e o botão "Revogar", que grava `aiConsentAt: null`. Sem consentimento, mostrar "Pede licença no primeiro uso".

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/label-fill.test.ts && npm test && npm run lint`
Expected: PASS.

Manual: primeira captura com leitura ligada abre o diálogo. "Só guardar a foto" não chama `/api` (conferir na aba Network). Depois de aceitar, a segunda leitura não pergunta. Editar `vinho`, salvar e abrir a ficha: `vinho` sai da lista de sugeridos.

- [x] **Step 5: Commit**

```bash
git add src/domain src/features/entry src/features/settings/SettingsPage.tsx src/App.tsx
git commit -m "feat: ask before sending label photos and mark AI-filled fields"
```

---

### Task 4: O caderno pede para não ser apagado e lembra do backup

Os dados moram só no IndexedDB. O Safari apaga armazenamento de site não instalado depois de 7 dias sem uso. Chrome e Firefox apagam sob pressão de disco. `navigator.storage.persist()` reduz o risco, mas o Chrome costuma negar para site pouco usado, então o lembrete de backup é a rede de segurança de verdade.

**Files:**
- Create: `src/domain/backup-reminder.ts`, `src/app/storage-persistence.ts`
- Test: `src/domain/backup-reminder.test.ts`
- Modify: `src/repositories/wine-repository.ts` (ler e gravar `meta['backup-status']`)
- Modify: `src/app/AppProvider.tsx`, `src/app/useWinefolio.ts`
- Modify: `src/features/journal/JournalPage.tsx` (faixa de lembrete), `src/features/settings/SettingsPage.tsx` (estado da persistência e data do último backup)

**Interfaces:**
- Produces:
  - `BackupStatus = { lastBackupAt: number | null; snoozedUntil: number | null }`
  - `EMPTY_BACKUP_STATUS: BackupStatus`
  - `isBackupDue(status: BackupStatus, entries: WineEntry[], now: number): boolean`
  - `ensurePersistentStorage(): Promise<boolean | null>` (`null` quando o navegador não tem a API)
  - `WineRepository.readBackupStatus(): Promise<BackupStatus>` e `saveBackupStatus(status: BackupStatus): Promise<void>`
  - Contexto: `backupDue: boolean`, `backupStatus: BackupStatus`, `storagePersisted: boolean | null`, `snoozeBackupReminder(): Promise<void>`

Regra do lembrete:
- Sem ficha pessoal: não lembra.
- Adiado e ainda dentro do prazo: não lembra.
- Nunca fez backup: lembra a partir de 3 fichas pessoais.
- Já fez backup: conta as fichas pessoais com `atualizadoEm > lastBackupAt`. Zero: não lembra. Lembra com 10 ou mais, ou com 30 dias ou mais desde o backup.

- [x] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { isBackupDue, EMPTY_BACKUP_STATUS } from './backup-reminder.js';

const DAY = 86_400_000;

function personal(id: string, updatedAt: number) {
  const entry = createEntry(id);
  entry.kind = 'personal';
  entry.atualizadoEm = updatedAt;
  return entry;
}

describe('isBackupDue', () => {
  it('não lembra sem ficha pessoal', () => {
    const demo = createEntry('d');
    demo.kind = 'demo';
    assert.strictEqual(isBackupDue(EMPTY_BACKUP_STATUS, [demo, demo, demo], 0), false);
  });

  it('lembra a partir de 3 fichas quando nunca houve backup', () => {
    const two = [personal('a', 1), personal('b', 1)];
    assert.strictEqual(isBackupDue(EMPTY_BACKUP_STATUS, two, 10), false);
    assert.strictEqual(isBackupDue(EMPTY_BACKUP_STATUS, [...two, personal('c', 1)], 10), true);
  });

  it('lembra depois de 30 dias só se algo mudou', () => {
    const status = { lastBackupAt: 0, snoozedUntil: null };
    assert.strictEqual(isBackupDue(status, [personal('a', 0)], 31 * DAY), false);
    assert.strictEqual(isBackupDue(status, [personal('a', DAY)], 31 * DAY), true);
    assert.strictEqual(isBackupDue(status, [personal('a', DAY)], 5 * DAY), false);
  });

  it('lembra com 10 fichas mudadas mesmo antes de 30 dias', () => {
    const status = { lastBackupAt: 0, snoozedUntil: null };
    const changed = Array.from({ length: 10 }, (_, i) => personal(`e${i}`, DAY));
    assert.strictEqual(isBackupDue(status, changed, 2 * DAY), true);
  });

  it('respeita o adiamento', () => {
    const status = { lastBackupAt: null, snoozedUntil: 7 * DAY };
    const three = [personal('a', 1), personal('b', 1), personal('c', 1)];
    assert.strictEqual(isBackupDue(status, three, DAY), false);
    assert.strictEqual(isBackupDue(status, three, 8 * DAY), true);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/backup-reminder.test.ts`
Expected: FAIL with `Cannot find module './backup-reminder.js'`

- [x] **Step 3: Write minimal implementation**

`src/domain/backup-reminder.ts`:

```ts
import type { WineEntry } from './wine-entry';

export interface BackupStatus {
  lastBackupAt: number | null;
  snoozedUntil: number | null;
}

export const EMPTY_BACKUP_STATUS: BackupStatus = { lastBackupAt: null, snoozedUntil: null };

const DAY = 86_400_000;

export function isBackupDue(status: BackupStatus, entries: WineEntry[], now: number): boolean {
  const own = entries.filter((entry) => entry.kind !== 'demo');
  if (own.length === 0) return false;
  if (status.snoozedUntil !== null && now < status.snoozedUntil) return false;
  if (status.lastBackupAt === null) return own.length >= 3;
  const changed = own.filter((entry) => entry.atualizadoEm > status.lastBackupAt!).length;
  if (changed === 0) return false;
  return changed >= 10 || now - status.lastBackupAt >= 30 * DAY;
}
```

`src/app/storage-persistence.ts`:

```ts
export async function ensurePersistentStorage(): Promise<boolean | null> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persisted || !storage.persist) return null;
  try {
    if (await storage.persisted()) return true;
    return await storage.persist();
  } catch {
    return null;
  }
}
```

Repositório: `readBackupStatus` lê `db.get('meta', 'backup-status')` e cai em `EMPTY_BACKUP_STATUS`. `saveBackupStatus` grava com `db.put('meta', status, 'backup-status')`.

`AppProvider`:
- Em `initApp`, carregar `backupStatus` e ler `navigator.storage.persisted()` para o estado inicial de `storagePersisted`.
- Em `commitEntry`, na primeira ficha pessoal salva com `storagePersisted !== true`, chamar `ensurePersistentStorage()` e guardar o resultado. Não chamar no carregamento: o Firefox mostra um pedido de permissão.
- Em `exportBackup`, depois do download, gravar `{ lastBackupAt: Date.now(), snoozedUntil: null }`.
- `snoozeBackupReminder` grava `snoozedUntil = Date.now() + 7 dias`.
- `backupDue = useMemo(() => isBackupDue(backupStatus, entries, Date.now()), [backupStatus, entries])`.

`JournalPage`, acima da coleção, quando `backupDue`: faixa no estilo `draft-banner` com o texto "Suas fichas só existem neste navegador. Guarde uma cópia." e os botões "Exportar agora" e "Lembrar em 7 dias".

`SettingsPage`, na linha de exportação: "Último backup: {data}" ou "Nenhum backup ainda". Linha nova "Proteção contra limpeza do navegador" com três estados: "Ativa", "Negada pelo navegador. Instale o app na tela inicial ou faça backups." e "Não suportada".

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/backup-reminder.test.ts && npm test && npm run lint`
Expected: PASS.

Manual: com 3 fichas pessoais a faixa aparece. Exportar faz a faixa sumir. "Lembrar em 7 dias" também faz sumir e o adiamento sobrevive a recarregar a página.

- [x] **Step 5: Commit**

```bash
git add src/domain/backup-reminder.ts src/domain/backup-reminder.test.ts src/app src/repositories/wine-repository.ts src/features/journal/JournalPage.tsx src/features/settings/SettingsPage.tsx
git commit -m "feat: request persistent storage and remind to back up"
```

---

### Task 5: Portão de release com E2E e CI

Os testes atuais rodam em Node e não tocam o navegador. O bug da tarefa 1 passou por eles. Esta tarefa cria os testes que decidem se uma versão pode ir para o AI Studio.

Sobre o lockfile: o projeto tem `bun.lock` e `package-lock.json`. O CI usa `npm ci`, e o template do AI Studio é npm. Manter `package-lock.json`, remover `bun.lock` e atualizar `memory-bank/techContext.md`.

**Files:**
- Modify: `package.json` (devDependencies `@playwright/test`; script `test:e2e`)
- Create: `playwright.config.ts`
- Create: `e2e/backup.spec.ts`, `e2e/label-reading.spec.ts`, `e2e/journal.spec.ts`, `e2e/fixtures/label.jpg` (foto pequena, menos de 50 KB)
- Create: `.github/workflows/ci.yml`
- Delete: `bun.lock`
- Modify: `memory-bank/techContext.md`, `.agents/skills/testing-winefolio/SKILL.md` (como rodar o E2E)

**Interfaces:**
- Produces: `npm run test:e2e` (build de produção, sobe `npm start`, roda Chromium)

- [x] **Step 1: Configurar o Playwright**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

Script: `"test:e2e": "playwright test"`. Neste container, o Chromium fica em `/opt/pw-browsers`. Se a versão do `@playwright/test` não bater, usar `launchOptions.executablePath` via variável de ambiente, sem baixar navegador.

- [x] **Step 2: Escrever os specs**

Seletores por papel e rótulo (`getByRole`, `getByLabel`). Acrescentar `data-testid` só onde não houver rótulo acessível, no mesmo commit.

`e2e/backup.spec.ts` (regressão da tarefa 1, usando `page.route` para simular `/api/analyze-wine-label`):
1. Criar duas fichas com foto (`setInputFiles` com `e2e/fixtures/label.jpg`), recusando a leitura por IA no diálogo da tarefa 3.
2. Ajustes, Exportar, `page.waitForEvent('download')`, ler o JSON e conferir `entries.length === 2` e `photos.length === 2`.
3. Em um `browser.newContext()` limpo, importar o arquivo e conferir os dois cartões com foto.

`e2e/label-reading.spec.ts`:
1. Primeira leitura abre o diálogo de consentimento. "Só guardar a foto" não gera requisição para `/api`.
2. Com a rota respondendo `{ success: true, data: { produtor: 'Quinta Teste', vinho: 'Reserva', safra: '2020' } }`, aceitar e conferir os campos preenchidos e a impressão final vazia.
3. Com a rota respondendo 502 em HTML, conferir o toast "Não foi possível ler as informações do rótulo." e o editor ainda aberto.

`e2e/journal.spec.ts`:
1. Criar ficha à mão, favoritar, buscar pelo nome, abrir e editar.
2. Carregar exemplos, desligar "Mostrar fichas de exemplo" e conferir o caderno vazio.

- [x] **Step 3: CI**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: test-results
```

- [x] **Step 4: Verificar**

Run: `npm run test:e2e`
Expected: PASS nos dois projetos.

Prova de que o portão funciona: `git stash` da correção da tarefa 1 (ou `git revert` local) faz `backup.spec.ts` falhar com a mensagem de transação encerrada. Restaurar depois.

- [x] **Step 5: Commit**

```bash
git add playwright.config.ts e2e .github/workflows/ci.yml package.json package-lock.json memory-bank/techContext.md .agents/skills/testing-winefolio/SKILL.md
git rm bun.lock
git commit -m "test: gate releases on browser tests in CI"
```

Depois do merge, marcar `CI / check` como obrigatório na proteção da `main` (configuração do GitHub, feita pelo dono do repositório).

Limitação conhecida: o deploy sai do AI Studio, não do GitHub. O CI protege a `main`, mas não impede um deploy feito a partir de outro estado. Antes de cada deploy, confirmar que o AI Studio está no mesmo commit da `main` verde.

---

### Task 6: Adega e Estatísticas aparecem no menu

`#/adega` e `#/estatisticas` funcionam, mas o menu (`Header.tsx:10`) não aponta para elas. A barra do celular já tem 5 posições (Caderno, Passaporte, Anotar, Meu paladar, Opções). No celular, o acesso entra no diálogo de Opções.

**Files:**
- Modify: `src/components/layout/Header.tsx` (`NAV_ITEMS`)
- Modify: `src/components/proto/Sprite.tsx` (ícones `cellar` e `chart`)
- Modify: `src/features/settings/SettingsPage.tsx` (linha "Explorar o caderno"), `src/App.tsx` (passar `onNavigate`)
- Test: `e2e/journal.spec.ts` (acrescentar navegação)

- [x] **Step 1: Write the failing E2E**

Em `e2e/journal.spec.ts`: no projeto `desktop`, clicar em "Adega" no menu principal e esperar a URL `#/adega` e o título da página. Fazer o mesmo com "Estatísticas". No projeto `mobile`, abrir "Opções", tocar em "Adega" e conferir que o diálogo fecha e a URL vira `#/adega`.

Run: `npx playwright test e2e/journal.spec.ts`
Expected: FAIL (botão não existe).

- [x] **Step 2: Implementar**

```ts
const NAV_ITEMS = [
  { hash: '#/caderno', label: 'Caderno', icon: 'book', match: 'journal' },
  { hash: '#/passaporte', label: 'Passaporte', icon: 'passport', match: 'passport' },
  { hash: '#/paladar', label: 'Meu paladar', icon: 'palate', match: 'palate' },
  { hash: '#/adega', label: 'Adega', icon: 'cellar', match: 'cellar' },
  { hash: '#/estatisticas', label: 'Estatísticas', icon: 'chart', match: 'stats' },
] as const;
```

A barra móvel usa `NAV_ITEMS.slice(0, 2)` e continua igual.

No sprite, no mesmo traço dos outros símbolos:

```tsx
<symbol id="i-cellar" viewBox="0 0 24 24">
  <path d="M9 3h6M10 3v4.5c-2 1-3 2.6-3 4.5v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8c0-1.9-1-3.5-3-4.5V3" />
</symbol>
<symbol id="i-chart" viewBox="0 0 24 24">
  <path d="M4 20V11M10 20V5M16 20v-6M3 20h18" />
</symbol>
```

Em `SettingsPage`, primeira linha do diálogo: "Explorar o caderno", com os botões "Adega" e "Estatísticas", que chamam `onNavigate({ kind: 'cellar' })` e `onNavigate({ kind: 'stats' })`.

Conferir o cabeçalho em 680 px, 1024 px e 1280 px de largura. Se os cinco itens quebrarem linha, reduzir o espaçamento de `.nav-btn` só nessa faixa.

- [x] **Step 3: Verificar**

Run: `npm run lint && npx playwright test e2e/journal.spec.ts`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add src/components src/features/settings/SettingsPage.tsx src/App.tsx e2e/journal.spec.ts
git commit -m "feat: link the cellar and stats from the navigation"
```

---

### Task 7: Pacote de lançamento

O app se chama `react-example` no `package.json`. O `index.html` não tem favicon, manifest, `theme-color` nem `og:image`, e ainda assim declara `twitter:card = summary_large_image`. Não há README. O manifest permite instalar na tela inicial, e no iPhone o app instalado escapa da limpeza de 7 dias do Safari (reforça a tarefa 4). O service worker fica de fora de propósito.

**Files:**
- Create: `public/favicon.svg`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, `public/apple-touch-icon.png`, `public/og-image.png` (1200×630)
- Create: `public/manifest.webmanifest`
- Create: `scripts/render-brand-assets.mjs` (gera os PNGs com Playwright a partir do doodle `cork` do sprite)
- Create: `README.md`
- Modify: `index.html`, `package.json` (`name: "winefolio"`, `version: "1.0.0"`), `metadata.json` (`name: "Winefolio"`)

- [x] **Step 1: Gerar os assets**

`scripts/render-brand-assets.mjs` abre uma página HTML com o símbolo `doodle-cork` sobre `#FAF8F5`, na cor `#793b46`, e tira screenshots nos tamanhos acima. A versão maskable usa margem de segurança de 20%. O `og-image` leva "Winefolio" em Fraunces, o subtítulo "Um caderno de descobertas" e o doodle.

Run: `node scripts/render-brand-assets.mjs`

- [x] **Step 2: Manifest e `index.html`**

`public/manifest.webmanifest`:

```json
{
  "name": "Winefolio",
  "short_name": "Winefolio",
  "description": "Caderno pessoal de degustação de vinhos.",
  "lang": "pt-BR",
  "start_url": "/#/caderno",
  "scope": "/",
  "display": "standalone",
  "background_color": "#FAF8F5",
  "theme_color": "#793b46",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

No `<head>` do `index.html`:

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#793b46" />
<meta property="og:title" content="Winefolio" />
<meta property="og:image" content="/og-image.png" />
```

Trocar o `og:title` atual ("Ficha de Degustação de Vinhos") por "Winefolio". Algumas redes exigem `og:image` absoluta: se o domínio final já estiver definido, usar a URL completa.

- [x] **Step 3: README**

Seções:
- O que é.
- Como rodar (`npm ci`, `npm run dev`).
- Variáveis (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_DAILY_CAP`).
- Testes (`npm test`, `npm run test:e2e`).
- Deploy pelo AI Studio, com o checklist go/no-go deste plano.
- Arquitetura em 5 linhas (domain, repositories, features, server).
- Privacidade: o que fica no navegador e o que vai ao Gemini.

- [x] **Step 4: Verificar**

Run: `npm run build && npm start`, e em outro terminal `curl -sI localhost:3000/manifest.webmanifest`
Expected: `200` com `content-type` de manifest ou JSON. Se vier `application/octet-stream`, configurar o tipo em `express.static` com a opção `setHeaders`.

Manual: o Lighthouse (Chrome) mostra o app como instalável. No Android, "Instalar app" aparece. No iPhone, "Adicionar à Tela de Início" usa o ícone certo.

- [x] **Step 5: Commit**

```bash
git add public index.html README.md package.json package-lock.json metadata.json scripts/render-brand-assets.mjs
git commit -m "chore: add launch icons, manifest and README"
```

---

### Task 8: Importar mostra o que vai acontecer antes de gravar

`importBackup` (`AppProvider.tsx:246`) marca todas as fichas como `replace` e também substitui preferências e rascunho, sem mostrar a prévia que `prepareImport` já calcula. `WineEntrySchema` existe e nunca é usado, então uma ficha malformada vai direto para o banco. `commitImport` grava todas as fotos do arquivo, inclusive a de uma ficha que a pessoa escolheu manter, e assim troca a foto atual por baixo dela.

**Files:**
- Modify: `src/repositories/transfer.ts` (`prepareImport` valida, `commitImport` filtra fotos)
- Create: `src/domain/import-decisions.ts`
- Test: `src/repositories/transfer.test.ts` (acrescentar), `src/domain/import-decisions.test.ts`
- Create: `src/features/settings/ImportPreviewDialog.tsx`
- Modify: `src/app/AppProvider.tsx`, `src/app/useWinefolio.ts` (`previewImport` e `confirmImport` no lugar de `importBackup`), `src/features/settings/SettingsPage.tsx`
- Modify: `package.json` (devDependency `fake-indexeddb`, usada só no teste de `commitImport`)

**Interfaces:**
- Produces:
  - `prepareImport` rejeita cada ficha que falha em `WineEntrySchema.safeParse`, com o aviso "Ficha {id ou posição} ignorada: formato inválido."
  - `defaultImportDecisions(preview: ImportPreview, current: StoreSnapshot): ImportDecisions`. Fichas já existentes ficam como `keep-existing`. O rascunho vira `replace` só quando não há rascunho atual. As preferências ficam como `keep-existing`.
  - `commitImport` grava só as fotos cujas fichas foram importadas, mais `draft:active` quando o rascunho for substituído.
  - Contexto: `previewImport(file: File): Promise<ImportPreview>` e `confirmImport(preview: ImportPreview, decisions: ImportDecisions): Promise<{ imported: number; skipped: number }>`

- [x] **Step 1: Write the failing tests**

- `import-decisions.test.ts`: com um conflito e uma ficha nova, o conflito fica como `keep-existing`. Com rascunho atual, o rascunho fica como `keep-existing`. As preferências sempre ficam como `keep-existing`.
- `transfer.test.ts`:
  - Um backup `native-v2` com uma ficha sem `schemaVersion` gera 0 fichas e 1 aviso.
  - Com `fake-indexeddb/auto`: uma ficha existente com `photoId: 'photo-a'` e foto A; importar backup com a mesma ficha em conflito e foto B, decisão `keep-existing`; a foto guardada continua sendo A.

Run: `npx tsx --test src/domain/import-decisions.test.ts src/repositories/transfer.test.ts`
Expected: FAIL.

- [x] **Step 2: Implementar**

Em `prepareImport`, depois de montar `entries` (todas as origens), filtrar com `WineEntrySchema.safeParse`. Rodar primeiro os testes de adaptadores (`adapters.test.ts`) passando as saídas pelo schema. Se um adaptador gerar ficha inválida, corrigir o adaptador, não afrouxar o schema.

Em `commitImport`, montar `importedPhotoIds` com o `photoId` de cada ficha efetivamente gravada, mais `'draft:active'` se o rascunho for substituído, e gravar só essas fotos.

`ImportPreviewDialog`:
- Contagem: "N novas · N iguais (ignoradas) · N em conflito · N avisos".
- Uma linha por conflito com produtor, vinho, safra e data de atualização de cada lado, e a escolha "Manter a minha" (padrão) ou "Usar a do backup".
- Caixa "Substituir também as preferências" (desmarcada).
- Lista de avisos recolhível.
- Botões "Cancelar" e "Importar".

- [x] **Step 3: Verificar**

Run: `npm test && npm run lint && npx playwright test e2e/backup.spec.ts`
Expected: PASS. Atualizar `backup.spec.ts` para confirmar no diálogo.

- [x] **Step 4: Commit**

```bash
git add src/repositories/transfer.ts src/repositories/transfer.test.ts src/domain/import-decisions.ts src/domain/import-decisions.test.ts src/features/settings src/app package.json package-lock.json e2e/backup.spec.ts
git commit -m "feat: preview and validate backups before importing"
```

---

### Task 9: Excluir pode ser desfeito

Hoje "Sim, excluir" apaga a ficha e a foto na hora (`TastingSheetDetails.tsx:523`).

**Files:**
- Modify: `src/app/AppProvider.tsx` (exclusão pendente e toast com ação)
- Modify: `src/app/useWinefolio.ts` (assinatura de `showToast` aceita ação)
- Test: `e2e/journal.spec.ts` (excluir e desfazer)

**Interfaces:**
- `showToast(message, type?, options?: { action?: { label: string; run: () => void }; durationMs?: number })`
- `removeEntry(id, revision)` continua com a mesma assinatura. A gravação no IndexedDB só acontece depois de 6 s ou no flush.

- [x] **Step 1: Write the failing E2E**

Excluir uma ficha, clicar em "Desfazer" no toast e conferir que o cartão volta. Recarregar a página e conferir que a ficha continua lá. Em outro teste, excluir, esperar 7 s, recarregar e conferir que a ficha sumiu.

- [x] **Step 2: Implementar**

- `removeEntry` tira a ficha do estado, guarda `{ entry, timer }` em um `useRef` e mostra o toast "Ficha excluída." com a ação "Desfazer" por 6 s.
- No fim do timer, chama `repository.removeEntry(id, revision)`. Em caso de erro, devolve a ficha ao estado e mostra toast de erro.
- "Desfazer" limpa o timer e devolve a ficha ao estado.
- Uma segunda exclusão com outra pendente grava a pendente na hora antes de começar a nova.
- Em `visibilitychange` para `hidden`, gravar a pendente na hora.
- Manter o diálogo de confirmação atual: o desfazer é rede de segurança, não substituto.
- O toast renderiza o botão de ação antes do botão de fechar.

- [x] **Step 3: Verificar**

Run: `npm run lint && npx playwright test e2e/journal.spec.ts`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add src/app e2e/journal.spec.ts
git commit -m "feat: undo deleting a tasting sheet"
```

---

### Task 10: Bundle inicial abaixo de 300 kB

O build gera um JS único de 700 kB (210 kB compactado) e dispara o aviso do Vite. `recharts` só é usado em `SensoryRadar`, dentro de `TastingSheetDetails`.

**Files:**
- Modify: `src/App.tsx`

- [x] **Step 1: Medir**

Run: `npm run build`. Anotar o tamanho de `dist/assets/index-*.js`.

- [x] **Step 2: Implementar**

Carregar com `React.lazy` + `Suspense`: `TastingSheetDetails`, `EntryEditorPage`, `SettingsPage`, `CellarPage`, `StatsPage`, `PassportPage`, `PalatePage`. O caderno continua no chunk principal.

```tsx
const EntryEditorPage = lazy(() =>
  import('./features/entry/EntryEditorPage').then((m) => ({ default: m.EntryEditorPage }))
);
```

O fallback do `Suspense` reaproveita o texto "Abrindo o seu caderno..." em tamanho menor. Depois do primeiro render, pré-carregar o editor quando o navegador estiver ocioso, para "Registrar vinho" abrir sem espera:

```ts
useEffect(() => {
  const preload = () => import('./features/entry/EntryEditorPage');
  if ('requestIdleCallback' in window) requestIdleCallback(preload);
  else setTimeout(preload, 1500);
}, []);
```

- [x] **Step 3: Verificar**

Run: `npm run build && npm run test:e2e`
Expected: chunk principal abaixo de 300 kB minificado, sem o aviso "Some chunks are larger than 500 kB", e E2E verde.

- [x] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "perf: load dialogs and secondary pages on demand"
```

---

## Depois do lançamento

Fora deste plano de propósito, em ordem de valor:

1. **Estoque real da adega.** Entidade `Bottle` (rótulo, quantidade, preço, local, janela de consumo), store novo com `DB_VERSION` 2, backup incluindo garrafas, ação "abri uma garrafa" que cria a ficha e alerta de "beber até". Pede um plano próprio.
2. **Offline completo.** Service worker escrito à mão (app e fontes em cache, `/api` sempre na rede), com estratégia de atualização visível ("Nova versão disponível").
3. **Fontes servidas pelo próprio app.** Tira a dependência do Google Fonts: melhora o offline e evita enviar o IP do usuário ao Google a cada visita.
4. **Limitador compartilhado entre instâncias** do Cloud Run, se o uso real passar do teto por instância.
5. **Quebrar `EntryEditorPage.tsx`** (1283 linhas) por aba.
6. **Rascunho automático também ao editar ficha existente** (hoje só vale para ficha nova).
7. **Exportar a ficha como imagem** para compartilhar.
