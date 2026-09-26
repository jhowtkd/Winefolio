# Carimbos e marcos do Passaporte

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os 233 marcos da spec `docs/superpowers/specs/2026-09-25-carimbos-marcos-design.md`, calculados por função pura das fichas, com selos em SVG e uma terceira página no Passaporte.

**Architecture:** Regras e catálogos em `src/domain/stamps/` (puros, com teste `node:test`). Arte em `src/components/proto/MilestoneStamp.tsx` e `src/components/proto/stamp-art/`, a mesma usada pelo app e pelo script de exportação (`react-dom/server`). A UI só chama essas funções.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, `idb` 8, testes com `tsx --test` e Playwright. Sem dependência nova.

---

## Global Constraints

- Texto de interface em português; identificadores novos em inglês; campos existentes continuam em português.
- Sem dependência nova de runtime nem de desenvolvimento.
- Cada tarefa fecha com `bun run lint` e `bun run test` verdes e commit próprio, em inglês, no imperativo.

## Decisões desta sessão (sobre a spec)

| Tema | Decisão |
| --- | --- |
| Arte | `selos-rodada-2/gen.py` não existe. Os 8 modelos são recriados a partir da descrição da spec. |
| Leitura da IA | Novo botão "Confirmar leitura do rótulo" no aviso "Sugerido pela IA e não revisado" da ficha. |
| Revisita | `evidence.revisitedAt` passa a ser gravado quando uma ficha existente é salva com mudança de conteúdo (guarda a primeira data). |
| Secretos do mesmo dia | "Voo de degustação" e "Três continentes" cortados. Total: 72 + 93 + 64 fixos + 4 legados = **233**. |
| Revisão da spec | Beaujolais dentro de Borgonha; `WORLD_TOUR_COUNTRIES` congelado nos 13 atuais; limites 3/10/25 (uva) e 1/5/15 (região). |

## Desvios técnicos da spec (registrar em "Diferenças na implementação")

1. `Family` ganha `'legado'`. Legados ficam na página 02, não nas abas.
2. `StampDef` ganha `subject?: string` (id da uva/região, para mostrar só o próximo nível) e `face?: string` (valor facial quando difere do alvo). Regra `custom` ganha `target` estático. `GRAPES` ganha `home` (país, para escolher o modelo de arte).
3. Glifos em módulo TS próprio (`stamp-art/glyphs.ts`, path data), não no sprite: `<use href>` quebra no SVG exportado. O teste "todo glyph existe" aponta para esse módulo.
4. Diálogo usa `ModalDialog` (`src/components/proto/ModalDialog.tsx`), não `PaperDialog` (Tailwind, sem uso no app).
5. `ASI_FIELDS` usa `applies`, não `appliesTo`.
6. Regra de confiança estendida: todo caminho de `AI_FILLED_PATHS` (não só uva/região/país) só conta se não estiver `ai-unverified`. Sem isso, uma leitura de rótulo sozinha ganha "À mesa" e ajuda "Mestre de serviço", "Paciência de adega" e "Grade completa". O botão de confirmar resolve o custo.
7. Sem `opentype.js` (regra do repo: sem dependência nova). O PNG é rasterizado pelo Chromium com as fontes web carregadas; o script falha se as fontes não carregarem.
8. PNGs não são commitados nesta entrega (233 x 2 tamanhos com grão = dezenas de MB). O script gera `public/stamps/manifest.json`; "Baixar PNG" só aparece para ids do manifesto.

## Pré-requisito

`bun install` (não há `node_modules`). Cada tarefa fecha com `bun run test` e `bun run lint` verdes e um commit em inglês, imperativo, estilo conventional. Arquivo único: `npx tsx --test <arquivo>`. Convenções: imports relativos sem extensão em produção e com `.js` nos testes; `node:test` + `node:assert`; `describe` em inglês, `it` em português; UI em português, identificadores novos em inglês.

## Tarefas

### Tarefa 0: documentação
- Salvar a spec em `docs/superpowers/specs/2026-09-25-carimbos-marcos-design.md` com as decisões e desvios acima (233 marcos, 64 fixos).
- Salvar plano em `docs/superpowers/plans/2026-09-26-carimbos-marcos.md` no formato dos planos existentes.
- Commit: `docs: spec and plan for passport milestone stamps`.

### Tarefa 1: normalização e catálogos (`src/domain/stamps/`)
- `grape-catalog.ts`: `GRAPES` (24: `id, label, plural, color, home, aliases`), `GrapeId`. Aliases condicionais como `{ text: 'auxerrois', when: e => e.estilo === 'tinto' }`.
- `region-catalog.ts`: `REGIONS` (31: `id, label, country, parent?, aliases`), `RegionId`. `porto` só com `tipo === 'fortificado'`. Adicionar grafias: `st emilion`, `st julien`, `st estephe`, `xerez`, `champanhe`.
- `normalize.ts`:
  - `fold(text)`: minúsculas, NFD + `/\p{M}/gu`, `/[^\p{L}\p{N}]+/gu` -> espaço, trim.
  - `splitGrapeText(uvas)`: remove `/\d+(?:[.,]\d+)?\s*%/g` ANTES de dividir ("85,5%" tem vírgula), divide por `/[,;/+&]|\s+e\s+/i`, aplica `fold`.
  - Matcher: uma alternância com todos os aliases e rótulos, do mais longo ao mais curto, com limite de palavra, varrendo da esquerda para a direita e consumindo o trecho ("cabernet sauvignon" não gera Sauvignon Blanc).
  - `grapesOf(entry)`, `grapeKeysOf(entry)` (id do catálogo ou texto dobrado, para `volume.uvas-*`), `regionsOf(entry)` (de `origin.region` e `regiaoPais`, nunca `vinho`; sub-região -> mãe), `countryOf(entry)`, `trusted(entry, path)`.
  - Provenance: `uvas` `ai-unverified` -> sem uvas; `regiaoPais` `ai-unverified` -> sem regiões; país é `null` se for `null`/`'other'`, ou se `regiaoPais` estiver `ai-unverified` e `inferCountryCode(regiaoPais) === countryCode` (derivado do texto da IA). País escolhido diferente do inferido conta.
- Testes (`normalize.test.ts`): cada alias da tabela casa; "Cabernet Sauvignon" só dá CS; "Cabernet Sauvignon e Sauvignon Blanc" dá os dois; "Chardonnay 85%, Pinot Noir 15%" dá dois; "85,5%"; auxerrois só em tinto; Porto só em fortificado; Pauillac -> bordeaux; uva repetida conta uma vez; acento e caixa; `ai-unverified`; `'other'`; `cot` não casa "Côtes"; integridade (24 uvas, 31 regiões, contagem por país, nenhum alias em dois ids).
- Commit: `feat(domain): grape and region catalogs with text normalization`.

### Tarefa 2: motor de regras
- `rules.ts`: tipos (`Family` com `'legado'`, `Tier`, `Tone`, `Ctx`, `Rule`, `StampDef`, `StampState`), `runRule(rule, ctx, memo) -> { current, target, crossing }`, `faceValue(def)`.
- `evaluate.ts`: `buildCtx(entries, source)` e `evaluate(defs, entries, { source })`.
  - `source: 'personal'` exclui `kind === 'demo' || _demo`; `source: 'demo'` inclui só esses. `kind: 'legacy'` conta.
  - Ordena uma vez por `dataDegustacao`, depois `criadoEm`, depois `id` (comparação `<`). Pré-calcula uvas, regiões e país por ficha (cache pelo texto cru).
  - `count`: lista filtrada em `WeakMap` por função `where` (compartilhada entre os 3 níveis); `crossing = list[min - 1]`.
  - `distinct`: linha do tempo de valores novos em `WeakMap` por `of`; `crossing = timeline[min - 1]`.
  - `coverAll`: uma passada; `crossing` é a ficha que completa `required`.
  - `custom`: `progress(ctx) -> { current, unlockedBy? }`, data via `ctx.byId`.
  - `earnedAt = crossing?.dataDegustacao || null` (nunca `new Date('YYYY-MM-DD')`).
- Testes (`rules.test.ts`): os 4 tipos; `earnedAt` é a ficha na posição `min`, não a última; desempate por `criadoEm`; ordem de entrada irrelevante; demo não conta e `source: 'demo'` só conta demo; remover a ficha revoga; mesmo resultado em duas chamadas (pureza).
- Commit: `feat(domain): pure rule engine for milestone stamps`.

### Tarefa 3: catálogo completo
- `catalog.ts`: geradores paramétricos de uva (3/10/25; "Curioso de {label}", "Explorador dos {plural}", "Guardião dos {plural}"; tom `wine`/`kraft`) e região (1/5/15; "Visitante de", "Amante de", "Cidadão de"; tom `sage`), um `where` por assunto. Fixos: pais 8, estilo 16, critica 12, tecnica 10, volume 12, harmonizacao 4, secreto 2 (`revisita` >= 5 fichas com `revisitedAt`, `favoritos` >= 20), legados 4 com as regras de hoje (`legado.origin` ignora provenance, para ninguém perder marca exibida). `WORLD_TOUR_COUNTRIES`, `OLD_WORLD`, `NEW_WORLD` congelados.
  - Listas derivadas do vocabulário (`WINE_TYPES`, `SUBSTYLE_GROUPS` Jerez/Madeira, `PAIRING_COMPONENTS`, `DISH_STYLE`, `AROMA_GROUPS`) com teste que fixa os tamanhos (6, 7, 4, 7, 3, 18).
  - `tecnica.cor`: chave `${estilo}.${coreColour}` ("brown" existe em branco e tinto).
  - `estilo.arco-iris`: `of = e => [e.skinContact ? 'laranja' : e.estilo]`.
  - `pais.dois-mundos` e `tecnica.vertical` são `custom` (vertical: `fold(produtor)|fold(vinho)`, safra pelo primeiro `/\b(1[89]\d\d|20\d\d)\b/`).
  - Níveis: entrada = 1, escadas sobem, coverAll e custom = 2 ou 3.
- `evaluateStamps(entries, opts)` = `evaluate(STAMPS, ...)`; `index.ts` como barril para import dinâmico.
- `src/domain/asi-fields.ts`: `isGridComplete(entry, filled = isFilled)`. Campos exigidos: com termo `en`, sem `toggle`, sem `multi` sem regra `applies`; campos com `applies` falso ficam de fora; `legacyNotes` conta. A regra de estampa passa `(x, p) => isFilled(x, p) && trusted(x, p)`.
- Testes: `catalog.test.ts` (totais 72/93/64/4 = 233; ids e títulos únicos, inclusive legados; nada vazio; `min >= 1`; tamanhos do vocabulário; `WORLD_TOUR_COUNTRIES` com 13 e todos em `COUNTRIES`; fumaça com `getDemoWines()` convertidos para `kind: 'personal'`, `_demo: false`: `volume.1`, `legado.first`, `legado.vocabulary`, `legado.origin`, `pais.3` ganhos, nenhum de uva; desempenho: 1000 fichas sintéticas, aquecimento + melhor de 3, < 50 ms). `asi-fields.test.ts`: vazio false; tinto completo true; sem `tanninQuality` false; branco sem tanino true; espumante sem `sparkle` false; fortificado sem `subestilo` false; `faulty` sem defeitos false; nota legada conta.
- Commit: `feat(domain): full milestone stamp catalog`.

### Tarefa 4: gravar revisita
- `src/domain/revisit.ts`: `contentChanged(prev, next)` (JSON canônico sem `revision`, `atualizadoEm`, `criadoEm`, `favorite`, `provenance`, `evidence`, `photoId`, `importMetadata`, `kind`, `sourceFormat`, `_demo`) e `withRevisit(prev, next, now)` (mantém a primeira data; ignora demo e ficha nova).
- Chamar em `commitEntry` de `src/repositories/wine-repository.ts` (~linha 97), sobre o registro atual lido na transação. Importação não passa por ali, de propósito.
- Testes: `revisit.test.ts` (ficha nova null; edição -> now; segunda edição mantém data; só provenance/favorite/revision -> null; ordem de chaves -> null; demo intocada) e teste de repositório com `fake-indexeddb`.
- Commit: `feat(domain): record when a saved sheet is revisited`.

### Tarefa 5: confirmar leitura do rótulo
- `label-fill.ts`: `confirmAiFields(entry)` troca todo `'ai-unverified'` por `'user'` (teste em `label-fill.test.ts`; confirmação não grava revisita).
- `AppProvider.tsx`: extrair `saveEntry(input, message)` de `commitEntry`; novo `confirmAiReading(entry)` (`expectedRevision: entry.revision`, `photo: { kind: 'keep' }`, `clearDraft: false`, toast "Leitura do rótulo confirmada."). Expor em `src/app/useWinefolio.ts`; ligar em `App.tsx`.
- `TastingSheetDetails.tsx` (~linha 501): prop opcional `onConfirmAiReading`, botão secundário "Confirmar leitura do rótulo", oculto na impressão.
- e2e: estender `e2e/label-reading.spec.ts`: clicar no botão e o aviso some.
- Commit: `feat(entry): confirm the label reading from the sheet`.

### Tarefa 6: arte
- `src/components/proto/MilestoneStamp.tsx` + `src/components/proto/stamp-art/`: `palette.ts`, `glyphs.ts` (cacho, marco de estrada/colina, globo, bolhas, garrafa, pena, lupa, paleta, termômetro, ampulheta, livro, garfo, coração, retorno, passaporte, folha, lápis), `perforation.ts` (furos r 4.2, passo ~11, simétricos), `text.ts` (`postmarkDate('2026-03-12') -> '12·03·26'` a partir da string; `splitTitle`), `models.tsx` (8 modelos), `model-for.ts`.
- Props: `{ def, status: 'earned' | 'locked', earnedAt?, postmark?, compact?, width?, height? }`. Ids por instância com `useId().replace(/[^a-zA-Z0-9]/g, '')` (padrão de `CountryStamp`). `viewBox="0 0 240 240"`, `xmlns`, fontes explícitas (`Fraunces, Georgia, serif` etc.), nada de `<use>`. `textLength` + `lengthAdjust` em texto de arco; `toLocaleUpperCase('pt-BR')`.
- Texturas: grão e desgaste em `g.stamp-grain`/`g.stamp-wear`, deslocamento em `g.stamp-ink`; CSS `[data-textures='off'] .milestone-stamp ...` desliga. `compact` omite filtros e microtexto. Bloqueado: vaga de álbum tracejada com cantoneiras e "?"; secreto bloqueado: só "?" (sem título em DOM nem `aria-label`, que vira "Marco secreto"). Carimbo postal recortado pela máscara da serrilha.
- `modelFor(def)`: uva branca -> Gravura azul; uva tinta -> modelo do país `home`; região `borgonha` -> Gravura azul, demais -> modelo do país; `pais.casa` -> Modernismo, outros de país -> Selo redondo; estilo -> Art déco; crítica, técnica, secreto -> Camafeu; volume, legado -> Selo redondo; harmonização -> Art déco. País: FR, IT, ES, DE -> Traço e chapado; PT -> Azulejo; AR, CL, US, AU, NZ, ZA -> Paisagem retrô; BR, UY -> Modernismo. Nível -> moldura (1 terracota, 2 azul, 3 ouro).
- `src/styles/stamps.css` (importado em `src/index.css`): regras de textura e sombra CSS.
- Testes (`MilestoneStamp.test.ts`, via `createElement` + `renderToStaticMarkup`): os 8 modelos têm `viewBox` 240, valor facial e `WINEFOLIO`, sem `<use`; duas instâncias com ids diferentes; `compact` sem `feTurbulence` e sem `WINEFOLIO`; secreto bloqueado sem título; todo `def.glyph` existe em `GLYPHS`; `modelFor` (Malbec -> Paisagem, Tannat -> Modernismo, Touriga -> Azulejo, Chardonnay -> Gravura).
- Commit: `feat(passport): vintage postage stamp art for milestones`.

### Tarefa 7: página e estado "novo"
- `src/domain/stamps/view.ts`: `FAMILY_TABS` (Uvas, Regiões, Países, Estilos, Crítica, Técnica, Volume, Mesa, Secretos), `visibleStamps(states, family)` (esconde assunto com 0 fichas; mostra níveis ganhos + próximo bloqueado; ganhos por `earnedAt` desc, bloqueados por `current/target` desc), `stampSummary`. `novelty.ts`: `newlyEarned(prev, next, seen)`, `stampNotice(defs)`. Testes para todos.
- Preferências: `seenStampIds: string[]` em `Preferences` (`src/domain/wine-entry.ts`) e `[]` em `createPreferences` (o merge de `load()` dispensa migração).
- `AppProvider.tsx`:
  - `preferencesRef` + `persistPreferences(partial, { silent })` (evita a corrida de closure e o toast "Preferências salvas."); `markStampsSeen(ids)` idempotente e silencioso.
  - Toast ganha `detail` (renderizado em `<small>`, CSS `.toast small` já existe).
  - `announceStamps(prev, next)` após `saveEntry` e `setFavorite`: `import('../domain/stamps')` dinâmico, `newlyEarned` menos `seenStampIds`, mescla na mensagem de salvar ("Novo carimbo: Curioso de Chardonnay", ação "Ver" -> passaporte, 8 s), grava os ids em `seenStampIds` e num `stampHighlights` em memória. Tudo em try/catch: falha de carimbo nunca quebra o salvamento. Importação e carga de demo não anunciam.
- `PassportPage.tsx`:
  - Página 02 passa a usar os estados `legado.*`.
  - Novo `.book-spread` com "03 / MARCOS": abas no padrão `div.filters role="group"` + `button.filter` com `aria-pressed` (de `JournalPage.tsx:324-336`), grade de cartões-botão com selo, título, "NOVO" em HTML e barra de progresso.
  - NOVO = ganho e (fora de `seenStampIds` no snapshot do `useState` inicial, ou em `stampHighlights`); depois um efeito chama `markStampsSeen`. Só no modo "mine".
  - Diálogo `ModalDialog`: selo grande com carimbo postal, data, link "Ver a ficha" (oculto no demo), "Baixar PNG" só se o id estiver no manifesto.
  - `journey-stat`: "X de Y marcos".
  - Demo: `evaluateStamps(demoEntries, { source: 'demo' })`, rótulos de exemplo, sem NOVO.
  - Novas props: `seenStampIds`, `highlights`, `onStampsSeen`, `onOpenEntry`.
- `App.tsx`: memoizar `ownEntries` e `getDemoWines()` (hoje recriados a cada render) acima do `if (loading)`; passar as props; incluir `import('./domain/stamps')` no preload ocioso.
- CSS: fixar `--ink`/`--muted` claros dentro de `.passport-book` no modo escuro (corrige também as páginas 01 e 02, hoje texto claro sobre papel claro).
- e2e `e2e/passport-stamps.spec.ts`: helper `createEntry` com `{ grapes }` (placeholder `Ex: Cabernet Sauvignon (70%), Malbec (30%)`); 3 fichas de Chardonnay; toast contém "Curioso de Chardonnay"; em `#/passaporte`, aba Uvas, cartão com "NOVO"; após `reload()` sem "NOVO"; modo demo sem marco pessoal. Asserções por nome acessível, não por texto do SVG.
- Commit: `feat(passport): milestones page with new-stamp notice`.

### Tarefa 8: textos, exportação e memória
- Reescrever: introdução "Sem metas, sem pressa..."; `.note-horizontal` (manter "sem sequências diárias ou ranking" e dizer que marcos contam fichas, nunca dias nem taças); `journey-stat`; cabeçalho da página 02 "CONQUISTAS SEM CONTAGEM DE CONSUMO"; rodapé `App.tsx:314` "Feito para guardar, não para contar." -> "Feito para guardar, não para competir.".
- `scripts/render-stamps.mjs` (rodar com `npx tsx`, script `render:stamps` no `package.json`): opções `--ids`, `--family`, `--sizes`, `--out`, `--sheet`; Chromium do Playwright com proxy de `HTTPS_PROXY` se existir; fontes pelo mesmo `<link>` do `index.html` e `document.fonts.load(...)` para Fraunces, DM Mono e Caveat, saindo com erro se não carregarem (sem o `.catch(() => undefined)` de `render-brand-assets.mjs`); `renderToStaticMarkup` no `#stage`; `screenshot({ omitBackground: true })` em 512 e 1024; checagem de alfa 0 no pixel (0,0) e no último pixel decodificando o PNG com `node:zlib`; `manifest.json`. `--sheet` gera folha de contato dos 8 modelos em todos os estados em `test-results/` para revisão visual.
- `memory-bank/progress.md` e `activeContext.md`: seção `## Carimbos e marcos (2026-09-26)`. "Diferenças na implementação" na spec e no plano.
- Commit: `feat(passport): honest milestone copy and stamp export script`, depois `docs: record how milestone stamps were implemented`.

## Riscos

| Risco | Mitigação |
| --- | --- |
| Arte recriada sem o gerador aprovado diverge da rodada 2 | Folha de contato (`--sheet`) para revisão antes de fechar; ilustrações seguem provisórias. |
| Falso positivo de alias (`porto`, `cot`, `madeira`, `campanha`) | Só campos de região para regiões; condicionais em teste; `madeira` não é alias de uva. |
| Toast de carimbo apaga o de salvar | Mensagem única com `detail`. |
| Re-render recalcula 233 marcos | Memoização em `App.tsx` e `useMemo` na página. |
| Fontes do Google inacessíveis no script | Falha explícita; `STAMP_FONTS_DIR` opcional com `.woff2` locais. |
| Diretriz 1.4.3 da Apple | Nada por janela de tempo; secretos do mesmo dia cortados; textos dizem "fichas", não "taças". |

## Verificação

1. `bun install`, depois `bun run lint` e `bun run test` (inclui desempenho < 50 ms com 1000 fichas e pureza).
2. `bun run test:e2e -- e2e/passport-stamps.spec.ts e2e/label-reading.spec.ts e2e/journal.spec.ts`.
3. `bun run dev` e conferir no navegador (Playwright/Chromium): `#/passaporte` nos modos claro, escuro e `data-textures='off'`, desktop e 390 px; modo demo.
4. `bun run render:stamps -- --ids volume.1,uva.malbec.1 --sizes 512` e `--sheet`; conferir alfa 0 nos cantos e a folha de contato.
5. `git push -u origin claude/clever-carson-ah3unh` ao fim de cada tarefa (sem PR).
