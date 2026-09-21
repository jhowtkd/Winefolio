# Funções do protótipo que faltam no Winefolio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trazer de volta as sete funções do protótipo que o app anuncia ou já anunciou e hoje não executa.

**Architecture:** Cada regra mora numa função pura em `src/domain`, com teste de `node:test`. A UI só chama essa função. Nada disso muda `schemaVersion`. As tarefas são independentes e podem ir para a main uma a uma.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind 4, `recharts` 3 (já em `package.json`), Web Speech API do navegador, testes com `tsx --test`.

## Global Constraints

- Textos de interface em português.
- Identificadores novos em inglês. Campos já existentes continuam em português (`produtor`, `vinho`, `conclusao.impressaoFinal`, `origin.countryCode`).
- Não adicionar dependência.
- Não subir `schemaVersion` de 2.
- A leitura de rótulo só preenche campo vazio, exceto `tipo` e `estilo`, que a tela já substitui quando a API devolve valor.
- `licoroso` vindo da API vira `fortificado`. `laranja` não entra neste plano.
- Ditado e OCR não criam servidor novo. OCR continua em `POST /api/analyze-wine-label`.
- Comando de um arquivo: `npx tsx --test <arquivo>`. Suíte inteira: `npm test`. Tipos: `npm run lint`.
- Commit em inglês, no imperativo, uma tarefa por commit.

---

### Task 1: Movimento reduzido passa a valer

O interruptor em Ajustes grava `preferences.reduceMotion`. `AppProvider` lê `preferences.motion`, campo que não existe, então `data-motion` nunca entra no `<html>`. O CSS em `src/styles/motion.css` já escuta `[data-motion='reduce']`.

**Files:**
- Create: `src/domain/motion.ts`
- Test: `src/domain/motion.test.ts`
- Modify: `src/app/AppProvider.tsx` (efeito das preferências, por volta das linhas 132-136)

**Interfaces:**
- Consumes: `Preferences.reduceMotion` de `src/domain/wine-entry.ts`
- Produces: `motionDataset(reduceMotion: boolean): 'reduce' | null`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { motionDataset } from './motion.js';

describe('motionDataset', () => {
  it('pede data-motion=reduce quando o ajuste está ligado', () => {
    assert.strictEqual(motionDataset(true), 'reduce');
  });

  it('remove o atributo quando o ajuste está desligado', () => {
    assert.strictEqual(motionDataset(false), null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/motion.test.ts`
Expected: FAIL with `Cannot find module './motion.js'`

- [ ] **Step 3: Write minimal implementation**

`src/domain/motion.ts`:

```ts
export function motionDataset(reduceMotion: boolean): 'reduce' | null {
  return reduceMotion ? 'reduce' : null;
}
```

Em `src/app/AppProvider.tsx`, importar `motionDataset` e trocar o bloco que lê `preferences.motion`:

```ts
const motion = motionDataset(preferences.reduceMotion);
if (motion) {
  root.setAttribute('data-motion', motion);
} else {
  root.removeAttribute('data-motion');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/motion.test.ts && npm run lint`
Expected: PASS, `tsc` sem erro.

- [ ] **Step 5: Commit**

```bash
git add src/domain/motion.ts src/domain/motion.test.ts src/app/AppProvider.tsx
git commit -m "fix: apply the reduce-motion preference"
```

---

### Task 2: Fichas de exemplo podem sumir, e o favorito delas fica na preferência

`showDemo` e `demoFavorites` existem em `Preferences` e nenhuma tela lê. Com `showDemo === false`, caderno, adega e estatísticas escondem `kind === 'demo'`. A ficha aberta pelo hash continua acessível. Favoritar um demo grava `demoFavorites[id]` e, ao reabrir o app, essa marca volta para a ficha.

**Files:**
- Create: `src/domain/demo-visibility.ts`
- Test: `src/domain/demo-visibility.test.ts`
- Modify: `src/app/AppProvider.tsx` (`initApp`, `setFavorite`, `loadDemoWines`)
- Modify: `src/App.tsx` (passar a lista visível para caderno, adega e estatísticas)
- Modify: `src/features/settings/SettingsPage.tsx` (interruptor depois de "Fichas de Demonstração")

**Interfaces:**
- Consumes: `WineEntry.kind`, `WineEntry.favorite`, `Preferences.showDemo`, `Preferences.demoFavorites`
- Produces:
  - `applyDemoFavorites(entries: WineEntry[], favorites: Record<string, boolean>): WineEntry[]`
  - `visibleEntries(entries: WineEntry[], showDemo: boolean): WineEntry[]`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { applyDemoFavorites, visibleEntries } from './demo-visibility.js';

describe('demo visibility', () => {
  it('esconde só as fichas de demonstração', () => {
    const demo = createEntry('demo-1');
    demo.kind = 'demo';
    const personal = createEntry('mine');
    personal.kind = 'personal';
    const hidden = visibleEntries([demo, personal], false);
    assert.deepStrictEqual(hidden.map((entry) => entry.id), ['mine']);
    assert.strictEqual(visibleEntries([demo, personal], true).length, 2);
  });

  it('aplica o favorito guardado só em ficha demo', () => {
    const demo = createEntry('demo-1');
    demo.kind = 'demo';
    demo.favorite = false;
    const personal = createEntry('mine');
    personal.kind = 'personal';
    personal.favorite = false;
    const next = applyDemoFavorites([demo, personal], { 'demo-1': true, mine: true });
    assert.strictEqual(next[0].favorite, true);
    assert.strictEqual(next[1].favorite, false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/demo-visibility.test.ts`
Expected: FAIL with `Cannot find module './demo-visibility.js'`

- [ ] **Step 3: Write minimal implementation**

`src/domain/demo-visibility.ts`:

```ts
import type { WineEntry } from './wine-entry';

export function visibleEntries(entries: WineEntry[], showDemo: boolean): WineEntry[] {
  if (showDemo) return entries;
  return entries.filter((entry) => entry.kind !== 'demo');
}

export function applyDemoFavorites(
  entries: WineEntry[],
  favorites: Record<string, boolean>
): WineEntry[] {
  return entries.map((entry) => {
    if (entry.kind !== 'demo') return entry;
    if (!Object.prototype.hasOwnProperty.call(favorites, entry.id)) return entry;
    const favorite = Boolean(favorites[entry.id]);
    if (entry.favorite === favorite) return entry;
    return { ...entry, favorite };
  });
}
```

Em `initApp`, depois de `repo.load()`:

```ts
setEntries(applyDemoFavorites(snapshot.entries, snapshot.preferences.demoFavorites));
```

Em `loadDemoWines`, ao recarregar:

```ts
const reloaded = await repository.load();
setEntries(applyDemoFavorites(reloaded.entries, preferences.demoFavorites));
```

Incluir `preferences.demoFavorites` nas dependências do `useCallback`.

Em `setFavorite`, depois de atualizar `entries`, se `updated.kind === 'demo'`:

```ts
await updatePreferences({
  demoFavorites: { ...preferences.demoFavorites, [id]: favorite },
});
```

`updatePreferences` já mostra o toast "Preferências salvas.". Manter o toast de favorito que já existe. Incluir `preferences.demoFavorites` e `updatePreferences` nas dependências.

Em `src/App.tsx`, dentro de `AppContent`:

```ts
const shown = visibleEntries(entries, preferences.showDemo !== false);
```

Passar `shown` para `JournalPage`, `CellarPage` e `StatsPage` no lugar de `entries`. `activeEntry`, exclusão e o template de duplicar continuam usando `entries`.

Em `SettingsPage`, dentro da superfície "Fichas de Demonstração", antes do botão de carregar exemplos:

```tsx
<label className="flex items-center justify-between gap-4 text-xs">
  <span>
    <span className="block font-semibold text-[#312d26] dark:text-[#eee7db]">
      Mostrar fichas de exemplo no caderno
    </span>
    <span className="text-[#6b6458] dark:text-[#9e9687]">
      Desligar esconde os exemplos na adega, no caderno e nas estatísticas. Eles continuam salvos.
    </span>
  </span>
  <input
    type="checkbox"
    checked={preferences.showDemo !== false}
    onChange={(e) => onUpdatePreferences({ showDemo: e.target.checked })}
    className="w-4 h-4 accent-[#793b46]"
  />
</label>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/demo-visibility.test.ts && npm run lint`
Expected: PASS.

Manual: carregar exemplos, desligar o interruptor, confirmar que caderno, adega e estatísticas ficam vazios se só havia exemplos, e que ligar de novo traz as três fichas.

- [ ] **Step 5: Commit**

```bash
git add src/domain/demo-visibility.ts src/domain/demo-visibility.test.ts src/app/AppProvider.tsx src/App.tsx src/features/settings/SettingsPage.tsx
git commit -m "feat: hide demo sheets and remember their favorites"
```

---

### Task 3: País vira código, não só texto

O filtro de país, o carimbo e as estatísticas leem `origin.countryCode`. O editor só grava `regiaoPais`. Uma ficha digitada à mão nunca ganha código.

**Files:**
- Create: `src/domain/countries.ts`
- Test: `src/domain/countries.test.ts`
- Modify: `src/features/entry/EntryEditorPage.tsx` (bloco "Região / País", por volta da linha 506)
- Modify: `src/features/cellar/CellarPage.tsx` e `src/features/stats/StatsPage.tsx` para usar `countryName` em vez dos mapas locais duplicados

**Interfaces:**
- Consumes: `WineEntry.origin`, `WineEntry.regiaoPais`
- Produces:
  - `COUNTRIES: ReadonlyArray<{ code: string; name: string }>`
  - `countryName(code: string | null | undefined): string`
  - `inferCountryCode(text: string): string | null`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { countryName, inferCountryCode } from './countries.js';

describe('countries', () => {
  it('reconhece nome e código no texto da região', () => {
    assert.strictEqual(inferCountryCode('Vale dos Vinhedos, Brasil'), 'BR');
    assert.strictEqual(inferCountryCode('Bourgogne - FR'), 'FR');
    assert.strictEqual(inferCountryCode('Mendoza'), null);
  });

  it('traduz o código para o nome usado na tela', () => {
    assert.strictEqual(countryName('PT'), 'Portugal');
    assert.strictEqual(countryName(null), '');
    assert.strictEqual(countryName('ZZ'), 'ZZ');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/countries.test.ts`
Expected: FAIL with `Cannot find module './countries.js'`

- [ ] **Step 3: Write minimal implementation**

`src/domain/countries.ts`:

```ts
export const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Austrália' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'França' },
  { code: 'IT', name: 'Itália' },
  { code: 'NZ', name: 'Nova Zelândia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'ZA', name: 'África do Sul' },
] as const;

const ALIASES: Record<string, string> = {
  brazil: 'BR',
  france: 'FR',
  italy: 'IT',
  spain: 'ES',
  portugal: 'PT',
  argentina: 'AR',
  chile: 'CL',
  germany: 'DE',
  australia: 'AU',
  uruguay: 'UY',
  'united states': 'US',
  usa: 'US',
  'south africa': 'ZA',
  'new zealand': 'NZ',
};

export function countryName(code: string | null | undefined): string {
  if (!code) return '';
  return COUNTRIES.find((country) => country.code === code)?.name ?? code;
}

export function inferCountryCode(text: string): string | null {
  const hay = text.toLowerCase();
  const byName = [...COUNTRIES].sort((a, b) => b.name.length - a.name.length);
  for (const country of byName) {
    if (hay.includes(country.name.toLowerCase())) return country.code;
  }
  for (const [alias, code] of Object.entries(ALIASES)) {
    if (hay.includes(alias)) return code;
  }
  const token = text.toUpperCase().match(/\b(AR|AU|BR|CL|DE|ES|FR|IT|NZ|PT|US|UY|ZA)\b/);
  return token ? token[1] : null;
}
```

No editor, ao lado do input "Região / País", acrescentar:

```tsx
<label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
  País
</label>
<select
  value={formData.origin?.countryCode || ''}
  onChange={(e) =>
    setFormData({
      ...formData,
      origin: {
        countryCode: e.target.value || null,
        region: formData.origin?.region || formData.regiaoPais || '',
      },
    })
  }
  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
>
  <option value="">Sem país</option>
  {COUNTRIES.map((country) => (
    <option key={country.code} value={country.code}>
      {country.name}
    </option>
  ))}
</select>
```

No `onChange` de `regiaoPais`, depois de gravar o texto:

```ts
const countryCode = inferCountryCode(e.target.value) ?? formData.origin?.countryCode ?? null;
setFormData({
  ...formData,
  regiaoPais: e.target.value,
  origin: { countryCode, region: e.target.value },
});
```

Se o texto contém um país reconhecido, ele substitui o código. Se não contém, o código escolhido no select permanece.

Em `CellarPage` e `StatsPage`, apagar o `COUNTRY_NAMES` local e usar `countryName`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/countries.test.ts && npm run lint`
Expected: PASS.

Manual: criar uma ficha com região "Douro, Portugal", salvar, voltar ao caderno e filtrar por `PT`.

- [ ] **Step 5: Commit**

```bash
git add src/domain/countries.ts src/domain/countries.test.ts src/features/entry/EntryEditorPage.tsx src/features/cellar/CellarPage.tsx src/features/stats/StatsPage.tsx
git commit -m "feat: store a country code from the tasting form"
```

---

### Task 4: Caderno filtra por nota e por tag

O app original tinha filtro de estrelas e de tag. Hoje a tag só entra na busca livre, e a nota só ordena.

**Files:**
- Modify: `src/domain/collection.ts` (`FilterOptions` e `filterAndSortEntries`)
- Modify: `src/domain/collection.test.ts`
- Modify: `src/features/journal/JournalPage.tsx`
- Modify: `src/features/journal/CollectionToolbar.tsx`

**Interfaces:**
- Consumes: `WineEntry.conclusao.avaliacaoEstrelas`, `WineEntry.tags`
- Produces: `FilterOptions.rating?: 'all' | 1 | 2 | 3 | 4 | 5` e `FilterOptions.tag?: string`. Ausência ou `'all'` / `''` não filtram.

- [ ] **Step 1: Write the failing test**

Acrescentar em `src/domain/collection.test.ts`:

```ts
it('filtra por nota exata e por tag', () => {
  const five = filterAndSortEntries(demos, { rating: 5 });
  assert.strictEqual(five.length, 1);
  assert.strictEqual(five[0].vinho, 'Malbec Argentino');

  const tagged = demos.map((entry, index) =>
    index === 0 ? { ...entry, tags: ['Presente'] } : entry
  );
  const byTag = filterAndSortEntries(tagged, { tag: 'presente' });
  assert.strictEqual(byTag.length, 1);
  assert.strictEqual(byTag[0].id, tagged[0].id);
  assert.strictEqual(filterAndSortEntries(tagged, { tag: '' }).length, 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/collection.test.ts`
Expected: FAIL porque `rating` é ignorado e os dois resultados de nota não se separam. O teste de tag também falha até o filtro existir.

- [ ] **Step 3: Write minimal implementation**

Em `FilterOptions`:

```ts
rating?: 'all' | 1 | 2 | 3 | 4 | 5;
tag?: string;
```

Dentro do filtro, depois do bloco de safra:

```ts
if (options.rating && options.rating !== 'all') {
  if (entry.conclusao?.avaliacaoEstrelas !== options.rating) return false;
}
if (options.tag && options.tag.trim()) {
  const wanted = options.tag.trim().toLowerCase();
  const tags = (entry.tags || []).map((tag) => tag.toLowerCase());
  if (!tags.includes(wanted)) return false;
}
```

Desestruturar `rating = 'all'` e `tag = ''` junto com os outros campos.

Em `JournalPage`, estado:

```ts
const [selectedRating, setSelectedRating] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
const [selectedTag, setSelectedTag] = useState('');
```

`availableTags`: união de `entry.tags`, ordenada, sem duplicar ignorando caixa.

Passar `rating: selectedRating` e `tag: selectedTag` para `filterAndSortEntries`. Incluir os dois no array de dependências do `useMemo`. O botão "Limpar todos os filtros" também zera os dois.

`CollectionToolbar` ganha as props `selectedRating`, `onRatingChange`, `availableTags`, `selectedTag`, `onTagChange`. No painel de filtros, dois selects: "Nota" com "Todas as notas" e 1 a 5 estrelas; "Tag" com "Todas as tags" e `availableTags`. O botão "Limpar filtros" também zera nota e tag. O destaque do botão Filtros acende quando nota ou tag estão ativas.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/collection.test.ts && npm run lint`
Expected: PASS, inclusive os testes antigos de favoritos e espumantes.

- [ ] **Step 5: Commit**

```bash
git add src/domain/collection.ts src/domain/collection.test.ts src/features/journal/JournalPage.tsx src/features/journal/CollectionToolbar.tsx
git commit -m "feat: filter the journal by rating and tag"
```

---

### Task 5: A leitura do rótulo preenche o que a API já devolve

`analyzeWineLabelPhoto` devolve temperatura, decantação, guarda, aromas, harmonização, qualidade, cor e resumo. `handleAnalyzeLabel` joga isso fora e só copia identidade, tipo, estilo e álcool.

**Files:**
- Create: `src/domain/label-fill.ts`
- Test: `src/domain/label-fill.test.ts`
- Modify: `src/services/wineOcrService.ts` (o tipo `AnalyzedWineLabel` passa a ser o alias de `LabelAnalysis`, para não haver dois formatos)
- Modify: `src/features/entry/EntryEditorPage.tsx` (`handleAnalyzeLabel`)

**Interfaces:**
- Consumes: `WineEntry`, `inferCountryCode` da Task 3. Se a Task 3 ainda não entrou, copiar a chamada: quando `regiaoPais` for preenchido, `origin.countryCode = inferCountryCode(regiaoPais)`.
- Produces: `applyLabelAnalysis(entry: WineEntry, analysis: LabelAnalysis): WineEntry`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { applyLabelAnalysis } from './label-fill.js';

describe('applyLabelAnalysis', () => {
  it('preenche campos vazios e não apaga o que a pessoa já escreveu', () => {
    const entry = createEntry('w1');
    entry.produtor = 'Já escrito';
    const next = applyLabelAnalysis(entry, {
      produtor: 'Outro',
      vinho: 'Don Melchor',
      safra: '2019',
      uvas: 'Cabernet Sauvignon',
      regiaoPais: 'Puente Alto, Chile',
      tipo: 'licoroso',
      estilo: 'tinto',
      alcool: '14%',
      temperaturaServico: '16°C - 18°C',
      decantacao: '45 min',
      potencialGuarda: 'Beber ou guardar 3-5 anos',
      aromasSugeridos: 'Cassis, Cedro',
      harmonizacaoSugerida: 'Cordeiro',
      qualidadeEstimada: 'Excelente',
      corHexSugerida: '#581825',
      resumo: 'Tinto de guarda.',
    });
    assert.strictEqual(next.produtor, 'Já escrito');
    assert.strictEqual(next.vinho, 'Don Melchor');
    assert.strictEqual(next.tipo, 'fortificado');
    assert.strictEqual(next.estilo, 'tinto');
    assert.strictEqual(next.paladar.alcool, '14%');
    assert.strictEqual(next.temperaturaServico, '16°C - 18°C');
    assert.strictEqual(next.decantacao, '45 min');
    assert.strictEqual(next.conclusao.guarda, 'Beber ou guardar 3-5 anos');
    assert.strictEqual(next.conclusao.harmonizacao, 'Cordeiro');
    assert.strictEqual(next.conclusao.qualidade, 'Excelente');
    assert.strictEqual(next.conclusao.impressaoFinal, 'Tinto de guarda.');
    assert.strictEqual(next.olfato.aromas, 'Cassis, Cedro');
    assert.deepStrictEqual(next.aromaTags, ['Cassis', 'Cedro']);
    assert.strictEqual(next.visual.corHex, '#581825');
    assert.strictEqual(next.origin.countryCode, 'CL');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/label-fill.test.ts`
Expected: FAIL with `Cannot find module './label-fill.js'`

- [ ] **Step 3: Write minimal implementation**

`src/domain/label-fill.ts`:

```ts
import type { WineEntry, WineStyle, WineType } from './wine-entry';
import { inferCountryCode } from './countries.js';

export interface LabelAnalysis {
  produtor?: string;
  vinho?: string;
  safra?: string;
  uvas?: string;
  regiaoPais?: string;
  tipo?: string;
  estilo?: string;
  alcool?: string;
  temperaturaServico?: string;
  decantacao?: string;
  potencialGuarda?: string;
  aromasSugeridos?: string;
  harmonizacaoSugerida?: string;
  qualidadeEstimada?: string;
  corHexSugerida?: string;
  resumo?: string;
}

function keep(current: string | undefined, incoming: string | undefined): string {
  if ((current || '').trim()) return current || '';
  return (incoming || '').trim();
}

function asType(value: string | undefined): WineType | null {
  if (value === 'licoroso') return 'fortificado';
  if (value === 'tranquilo' || value === 'espumante' || value === 'sobremesa' || value === 'fortificado') {
    return value;
  }
  return null;
}

function asStyle(value: string | undefined): WineStyle | null {
  if (value === 'branco' || value === 'tinto' || value === 'rose') return value;
  return null;
}

export function applyLabelAnalysis(entry: WineEntry, analysis: LabelAnalysis): WineEntry {
  const regiaoPais = keep(entry.regiaoPais, analysis.regiaoPais);
  const aromas = keep(entry.olfato.aromas, analysis.aromasSugeridos);
  const aromaTags =
    entry.aromaTags.length > 0
      ? entry.aromaTags
      : aromas
          .split(/[,;]/)
          .map((tag) => tag.trim())
          .filter(Boolean);
  const tipo = asType(analysis.tipo) ?? entry.tipo;
  const estilo = asStyle(analysis.estilo) ?? entry.estilo;
  return {
    ...entry,
    produtor: keep(entry.produtor, analysis.produtor),
    vinho: keep(entry.vinho, analysis.vinho),
    safra: keep(entry.safra, analysis.safra),
    uvas: keep(entry.uvas, analysis.uvas),
    regiaoPais,
    tipo,
    estilo: tipo === 'espumante' ? null : estilo,
    temperaturaServico: keep(entry.temperaturaServico, analysis.temperaturaServico),
    decantacao: keep(entry.decantacao, analysis.decantacao),
    origin: {
      region: regiaoPais,
      countryCode: inferCountryCode(regiaoPais) ?? entry.origin?.countryCode ?? null,
    },
    aromaTags,
    visual: { ...entry.visual, corHex: keep(entry.visual.corHex, analysis.corHexSugerida) || undefined },
    olfato: { ...entry.olfato, aromas },
    paladar: { ...entry.paladar, alcool: keep(entry.paladar.alcool, analysis.alcool) },
    conclusao: {
      ...entry.conclusao,
      guarda: keep(entry.conclusao.guarda, analysis.potencialGuarda),
      harmonizacao: keep(entry.conclusao.harmonizacao, analysis.harmonizacaoSugerida),
      qualidade: keep(entry.conclusao.qualidade, analysis.qualidadeEstimada),
      impressaoFinal: keep(entry.conclusao.impressaoFinal, analysis.resumo),
    },
  };
}
```

Em `wineOcrService.ts`, importar `LabelAnalysis` e trocar o corpo de `AnalyzedWineLabel` por `export type AnalyzedWineLabel = LabelAnalysis`.

Em `handleAnalyzeLabel`:

```ts
const result = await analyzeWineLabelPhoto(photoDataUrl);
setFormData((prev) => applyLabelAnalysis(prev, result));
```

Apagar o objeto manual que copia oito campos.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/label-fill.test.ts && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/label-fill.ts src/domain/label-fill.test.ts src/services/wineOcrService.ts src/features/entry/EntryEditorPage.tsx
git commit -m "feat: fill the tasting sheet from the label reading"
```

---

### Task 6: Radar de paladar na ficha

O gráfico antigo convertia texto do paladar numa escala de 1 a 5 e inventava 3 quando o campo estava vazio. A escala volta. Campo vazio fica sem ponto inventado. O radar só aparece quando há pelo menos um eixo preenchido.

**Files:**
- Create: `src/domain/sensory-scale.ts`
- Test: `src/domain/sensory-scale.test.ts`
- Create: `src/features/entry/SensoryRadar.tsx`
- Modify: `src/features/entry/TastingSheetDetails.tsx` (depois da grade do exame gustativo, por volta da linha 432)

**Interfaces:**
- Consumes: `WineEntry.paladar`, `WineEntry.estilo`, `WineEntry.visual.corHex`
- Produces:
  - `type PalateAxis = 'corpo' | 'acidez' | 'tanino' | 'alcool' | 'docura'`
  - `scorePalate(value: string | undefined, axis: PalateAxis): number | null`
  - `SensoryRadar` com props `{ paladar: PaladarAnalysis; estilo: WineStyle | null; corHex?: string }`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scorePalate } from './sensory-scale.js';

describe('scorePalate', () => {
  it('não inventa nota para campo vazio', () => {
    assert.strictEqual(scorePalate('', 'corpo'), null);
    assert.strictEqual(scorePalate(undefined, 'acidez'), null);
  });

  it('usa a escala do protótipo', () => {
    assert.strictEqual(scorePalate('Encorpado', 'corpo'), 5);
    assert.strictEqual(scorePalate('Leve', 'corpo'), 1.5);
    assert.strictEqual(scorePalate('Muito alta', 'acidez'), 5);
    assert.strictEqual(scorePalate('Seco', 'docura'), 1.2);
    assert.strictEqual(scorePalate('Alto (14.5%)', 'alcool'), 4.5);
    assert.strictEqual(scorePalate('Nulo / Não tem', 'tanino'), 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/sensory-scale.test.ts`
Expected: FAIL with `Cannot find module './sensory-scale.js'`

- [ ] **Step 3: Write minimal implementation**

`src/domain/sensory-scale.ts`:

```ts
export type PalateAxis = 'corpo' | 'acidez' | 'tanino' | 'alcool' | 'docura';

export function scorePalate(value: string | undefined, axis: PalateAxis): number | null {
  const lower = (value || '').trim().toLowerCase();
  if (!lower) return null;

  if (axis === 'corpo') {
    if (lower.includes('encorpado')) return 5;
    if (lower.includes('médio+') || lower.includes('medio+')) return 4;
    if (lower.includes('médio-') || lower.includes('medio-')) return 2;
    if (lower.includes('médio') || lower.includes('medio')) return 3;
    if (lower.includes('leve')) return 1.5;
    return null;
  }
  if (axis === 'acidez') {
    if (lower.includes('muito alta')) return 5;
    if (lower.includes('alta')) return 4.5;
    if (lower.includes('média+') || lower.includes('media+')) return 4;
    if (lower.includes('média-') || lower.includes('media-')) return 2;
    if (lower.includes('média') || lower.includes('media')) return 3;
    if (lower.includes('baixa')) return 1.5;
    return null;
  }
  if (axis === 'tanino') {
    if (lower.includes('nulo') || lower.includes('não tem') || lower.includes('nao tem')) return 1;
    if (lower.includes('baixo')) return 2;
    if (lower.includes('médio-') || lower.includes('medio-')) return 2.5;
    if (lower.includes('médio+') || lower.includes('medio+')) return 4;
    if (lower.includes('sedoso')) return 3.5;
    if (lower.includes('médio') || lower.includes('medio')) return 3;
    if (lower.includes('adstringente') || lower.includes('alto')) return 5;
    return null;
  }
  if (axis === 'alcool') {
    if (lower.includes('quente')) return 5;
    if (lower.includes('alto')) return 4.5;
    if (lower.includes('equilibrado') || lower.includes('médio') || lower.includes('medio')) return 3.5;
    if (lower.includes('baixo')) return 2;
    return null;
  }
  if (lower.includes('doce')) return 5;
  if (lower.includes('suave')) return 3.8;
  if (lower.includes('meio-seco')) return 2.5;
  if (lower.includes('seco')) return 1.2;
  return null;
}
```

`src/features/entry/SensoryRadar.tsx` usa esse retorno. Eixo `null` entra no gráfico como `0` e na lista como "—". Se os cinco forem `null`, o componente retorna `null`. Cores: `corHex` se existir; senão branco `#B48210`, rosé `#DB2777`, tinto e estilo vazio `#881337`. Título: "Perfil de paladar". `ResponsiveContainer` com altura 230. `PolarRadiusAxis` com `domain={[0, 5]}`.

Em `TastingSheetDetails.tsx`, importar `SensoryRadar` e colocar logo depois da grade de álcool/persistência:

```tsx
<SensoryRadar
  paladar={entry.paladar}
  estilo={entry.estilo}
  corHex={entry.visual?.corHex}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/sensory-scale.test.ts && npm run lint`
Expected: PASS.

Manual: abrir a ficha do Malbec de exemplo e ver o pentágono. Uma ficha nova, sem paladar, não mostra o gráfico.

- [ ] **Step 5: Commit**

```bash
git add src/domain/sensory-scale.ts src/domain/sensory-scale.test.ts src/features/entry/SensoryRadar.tsx src/features/entry/TastingSheetDetails.tsx
git commit -m "feat: show the palate radar on the tasting sheet"
```

---

### Task 7: Ditado na impressão final

O modal antigo gravava a impressão final pelo microfone. O editor importa `Mic` e `MicOff` e não chama a Web Speech API.

**Files:**
- Create: `src/domain/dictation.ts`
- Test: `src/domain/dictation.test.ts`
- Create: `src/features/entry/useSpeechDictation.ts`
- Modify: `src/features/entry/EntryEditorPage.tsx` (textarea da impressão final, linhas 1115-1131)

**Interfaces:**
- Consumes: o valor atual de `conclusao.impressaoFinal`
- Produces:
  - `appendDictation(current: string, chunk: string): string`
  - `useSpeechDictation(onChunk: (text: string) => void): { supported: boolean; listening: boolean; interim: string; error: string | null; toggle: () => void }`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { appendDictation } from './dictation.js';

describe('appendDictation', () => {
  it('junta o trecho ao texto com um espaço', () => {
    assert.strictEqual(appendDictation('Fruta madura', 'e tanino fino'), 'Fruta madura e tanino fino');
  });

  it('ignora trecho vazio e não duplica espaço', () => {
    assert.strictEqual(appendDictation('Fruta madura ', ' '), 'Fruta madura');
    assert.strictEqual(appendDictation('', 'Começo'), 'Começo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/domain/dictation.test.ts`
Expected: FAIL with `Cannot find module './dictation.js'`

- [ ] **Step 3: Write minimal implementation**

`src/domain/dictation.ts`:

```ts
export function appendDictation(current: string, chunk: string): string {
  const next = chunk.trim();
  const base = current.trim();
  if (!next) return base;
  if (!base) return next;
  return `${base} ${next}`;
}
```

`src/features/entry/useSpeechDictation.ts`:

```ts
import { useEffect, useRef, useState } from 'react';

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function createRecognition(): Recognition | null {
  const host = window as Window & {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Ctor = host.SpeechRecognition || host.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = true;
  return recognition;
}

export function useSpeechDictation(onChunk: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;
  const recognitionRef = useRef<Recognition | null>(null);
  const supported = typeof window !== 'undefined' && createRecognition() !== null;

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setInterim('');
      return;
    }
    const recognition = createRecognition();
    if (!recognition) {
      setError('Este navegador não oferece ditado por voz.');
      return;
    }
    recognition.onresult = (event) => {
      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) onChunkRef.current(piece);
        else pending += piece;
      }
      setInterim(pending);
    };
    recognition.onerror = (event) => {
      setError(
        event.error === 'not-allowed'
          ? 'Permita o microfone neste site para ditar a impressão final.'
          : 'Não foi possível usar o microfone.'
      );
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };
    recognitionRef.current = recognition;
    setError(null);
    recognition.start();
    setListening(true);
  };

  return { supported, listening, interim, error, toggle };
}
```

No editor, no rótulo da impressão final, um botão com `Mic` / `MicOff`, `aria-label` "Ditar impressão final", só se `supported`. `onChunk` faz:

```ts
setFormData((prev) => ({
  ...prev,
  conclusao: {
    ...prev.conclusao!,
    impressaoFinal: appendDictation(prev.conclusao?.impressaoFinal || '', chunk),
  },
}));
```

Abaixo do textarea, se `interim` não for vazio, mostrar o texto em itálico. Se `error` não for nulo, mostrar a frase em `text-xs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/domain/dictation.test.ts && npm run lint`
Expected: PASS.

Manual, em Chrome: abrir uma ficha, ir até a impressão final, ditar uma frase, confirmar que ela entra no campo e que o botão para ao clicar de novo.

- [ ] **Step 5: Commit**

```bash
git add src/domain/dictation.ts src/domain/dictation.test.ts src/features/entry/useSpeechDictation.ts src/features/entry/EntryEditorPage.tsx
git commit -m "feat: dictate the final tasting note"
```

---

## Self-review

- Movimento reduzido: Task 1.
- `showDemo` e `demoFavorites`: Task 2.
- País estruturado: Task 3.
- Filtro de nota e de tag: Task 4.
- Leitura de rótulo completa: Task 5. Depende de `inferCountryCode` da Task 3.
- Radar de paladar: Task 6.
- Ditado: Task 7.
- A Task 5 deve ser implementada depois da Task 3. As outras não dependem entre si.
