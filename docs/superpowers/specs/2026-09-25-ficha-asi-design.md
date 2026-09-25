# Ficha de degustação na grade ASI

Data: 2026-09-25. Status: aprovada e implementada na branch `claude/amazing-pasteur-h7ctv0`. As diferenças entre o plano e o que foi feito estão no fim.
Referência: "Nomenclatura de Degustação e Classificação de Vinhos — Referência ASI" (Blind Tasting Grid das ASI Sommelier Guidelines 2021/2025).

## Objetivo

A ficha passa a seguir a grade ASI: cinco blocos (Visual, Nariz, Boca, Conclusões, Serviço), escala de 3 níveis e os termos oficiais. Para não assustar quem está começando, a ficha tem dois níveis, Iniciante e Avançado.

## Decisões tomadas

| Tema | Decisão |
| --- | --- |
| Escala | Só ASI, 3 níveis. A escala de 5 níveis (Média-, Média+) sai da ficha. |
| Escopo | Todos os blocos: Visual, Nariz, Boca, Conclusões, Serviço e Defeitos. |
| Níveis | O padrão fica em Ajustes. No editor, "Mostrar grade completa" abre o Avançado só naquela ficha. Campo avançado já preenchido sempre aparece. |
| Iniciante | Mínimo absoluto: cor, aromas, doçura, corpo e nota (estrelas). |
| Qualidade | Estrelas (gosto pessoal) e Qualidade ASI (julgamento técnico, 4 níveis) convivem, separadas. |
| Idioma | Português com o termo ASI em inglês discreto: "Alta · High". |
| Fichas salvas | Converte o que tem equivalente claro. O resto fica como texto original, marcado como anterior à ASI. |
| Tipos | Segue a ASI: skin contact (laranja), mistela, aromatizado e subestilos de fortificados. |

Sem pergunta pendente, mas duas decisões minhas precisam de confirmação na revisão:

1. Identificação (produtor, vinho, safra, uvas, região, data, ocasião, tags) e as notas livres (impressão final, harmonização em texto) aparecem nos dois níveis. Não fazem parte da grade, são o caderno.
2. Quem já tem fichas pessoais no momento da atualização começa no nível Avançado, para não sumir campo que a pessoa já preenchia. Quem chega do zero começa no Iniciante.

## Fora do escopo

- Ficha ABS/Bossi. O próprio documento diz que o texto oficial da ABS não foi verificado.
- Persistência em caudalies. Não é termo ASI.
- Escolher o sinônimo de cada nível (ex.: acidez Alta como "Crisp"). Os sinônimos aparecem como dica sob o campo e não são gravados. Pode entrar depois.
- Gerar a frase de "Overall Communication" automaticamente.
- Tabelas legais de açúcar em espumantes (UE, ABS-RJ, MAPA). É conteúdo de estudo, não campo de ficha.

## Arquitetura

Hoje cada campo sensorial é texto livre, e `src/domain/sensory-scale.ts` adivinha o nível procurando palavras ("médio+", "encorpado"). Com a ASI isso piora: o mesmo nível tem vários sinônimos e dois idiomas.

Abordagens consideradas:

| Abordagem | Custo | Problema |
| --- | --- | --- |
| A. Manter texto e trocar só o vocabulário | Baixo | Texto em português vira chave. Radar, estatísticas e leitura de rótulo continuam adivinhando por palavra. Não sustenta PT + EN. |
| B. Códigos estáveis + vocabulário separado (escolhida) | Médio | Exige migração para `schemaVersion: 3`. |
| C. Bloco `asi` paralelo aos campos antigos | Médio | Duas fontes de verdade para o mesmo dado. Toda tela precisa decidir qual ler. |

Escolha: B. A ficha grava códigos (`'high'`, `'ruby'`, `'soft-mousse'`). Um módulo de vocabulário resolve o rótulo em português, o termo em inglês, os sinônimos, o nível (Iniciante/Avançado) e onde o campo se aplica.

### Módulos novos

- `src/domain/asi-vocabulary.ts`: os códigos e, para cada um, `pt`, `en`, `synonymsEn` e `synonymsPt` (dicas), `tier: 'iniciante' | 'avancado'` e `appliesTo` (estilo e tipo). É a única fonte do vocabulário. Substitui as constantes `*_OPTIONS` de `src/data/sommelierData.ts`.
- `src/domain/asi-convert.ts`: converte texto livre em código. Devolve `{ code }` ou `{ legacy: texto }`. Três usos: migração das fichas salvas, importação de backup v2 e leitura de rótulo com IA. Uma regra só para os três.
- `src/domain/aroma-catalog.ts`: os 18 grupos aromáticos ASI com descritores em português. Os descritores atuais de `AROMA_CATEGORIES` mantêm a mesma grafia, assim `aromaTags` já gravadas não precisam de conversão, só ganham grupo.

## Modelo de dados (schemaVersion 3)

`Level3 = 'low' | 'medium' | 'high'`. Todo campo de escolha aceita `null` (não preenchido). `I` é Iniciante e `A` é Avançado.

### Classificação (aba Geral)

| Campo | Valores | Nível | Observação |
| --- | --- | --- | --- |
| `tipo` | `tranquilo`, `espumante`, `sobremesa`, `fortificado`, `mistela`, `aromatizado` | I | `mistela` e `aromatizado` são novos. |
| `estilo` (Main Colour) | `branco`, `rose`, `tinto` | I | Passa a valer também para espumante. Hoje o editor desativa o campo. |
| `skinContact` | boolean | A | Só com `estilo = branco`. Na tela aparece como "Laranja / contato com cascas". Substitui a opção "Laranja", que o editor oferece e o schema recusa. |
| `subestilo` | `sherry-fino`, `port-tawny`, `madeira-malmsey` etc. | A | Só com `tipo = fortificado`. Agrupado por Jerez, Porto, Madeira, Marsala e Banyuls, na lista do documento. |

### Visual (Appearance)

| Campo | Valores | Nível |
| --- | --- | --- |
| `visual.coreColour` | Branco: `lemon-green`, `lemon`, `straw`, `hay`, `golden`, `amber`, `brown`. Rosé: `gris`, `pink`, `salmon`, `orange`, `onionskin`. Tinto: `purple`, `ruby`, `garnet`, `tawny`, `brown` | I |
| `visual.corHex` | string | I (vem da cor escolhida) |
| `visual.intensity` | Level3 | A |
| `visual.clarity` | `clear`, `cloudy` | A |
| `visual.brightness` | `bright`, `dull` | A |
| `visual.rimVariation` | boolean | A |
| `visual.viscosity` | Level3 | A |
| `visual.observations` | lista: `co2`, `deposit`, `sediment`, `turbidity`, `haze`, `tearing` | A |

A cor mostrada é filtrada pelo `estilo`: 7 opções para branco, 5 para rosé, 5 para tinto, sempre do mais jovem ao mais evoluído. Cada cor ganha um hex para a taça ilustrada.

### Nariz (Nose)

| Campo | Valores | Nível |
| --- | --- | --- |
| `aromaTags` (já existe) | descritores do catálogo, ou texto livre | I |
| `olfato.clean` | boolean | A |
| `olfato.faults` | lista: `tca`, `oxidation`, `brett`, `volatile-acidity`, `reduction`, `smoke-taint`, `geosmin` | A (só quando `clean = false`) |
| `olfato.intensity` | Level3 | A |
| `olfato.oak` | boolean (perceptível ou imperceptível) | A |
| `olfato.maturity` | `unripe`, `youthful`, `maturing`, `mature`, `past-peak` | A |
| `olfato.aromas` (já existe) | texto livre | A |

O grupo aromático não é gravado: sai do catálogo a partir do descritor. Assim a ficha mostra "Frutado · Fruity: maçã verde, pêssego". Descritor fora do catálogo fica sem grupo, porque a ASI aceita descritores fora da lista.

### Boca (Taste)

| Campo | Valores | Nível |
| --- | --- | --- |
| `paladar.sweetness` | `dry`, `off-dry`, `medium-dry`, `medium-sweet`, `sweet`, `luscious` | I |
| `paladar.body` | `light`, `medium`, `full` | I |
| `paladar.clean` / `paladar.faults` | os 7 do nariz + `mousiness`, `refermentation` | A |
| `paladar.sparkle` | `still`, `prickly`, `soft-mousse`, `pronounced-mousse`, `aggressive-mousse` | A |
| `paladar.texture` | lista: `waxy`, `oily`, `creamy`, `mouthcoating`, `watery` | A |
| `paladar.acidity` | Level3 | A |
| `paladar.flavourIntensity` | Level3 | A |
| `paladar.oak` | boolean | A |
| `paladar.maturity` | `youthful`, `developing`, `developed`, `past-peak` | A |
| `paladar.tanninLevel` | Level3 | A (oculto em branco sem skin contact) |
| `paladar.tanninQuality` | lista: `gentle`, `silky`, `fine-grained`, `soft`, `smooth`, `grippy`, `coarse`, `unripe`, `green`, `aggressive`, `dominating`, `integrated` | A |
| `paladar.alcohol` | `low`, `medium`, `high`, `fortified` | A |
| `paladar.abv` | texto (ex.: "13%") | A. É o teor do rótulo. Hoje ele fica misturado em "Equilibrado (13%)". |
| `paladar.finish` | `short`, `medium`, `long` | A |
| `paladar.aromasBoca`, `paladar.retrogosto` (já existem) | texto livre | A |

### Conclusões (Conclusions)

| Campo | Valores | Nível |
| --- | --- | --- |
| `conclusao.avaliacaoEstrelas` (já existe) | 1 a 5 | I |
| `conclusao.impressaoFinal` (já existe) | texto | I |
| `conclusao.asiQuality` | `simple`, `acceptable`, `good`, `very-good` | A |
| `conclusao.ageing` | `now`, `0-3`, `3-6`, `6-9`, `9-12`, `12-15`, `15+` | A |
| `conclusao.vinification` | lista filtrada pelo tipo. Tranquilo: `fortification`, `oxidative`, `reductive`, `modern`, `classic`, `cold-ferment`, `lees-contact`, `skin-contact`. Espumante: `traditional`, `tank`, `transfer`, `ancestral`, `carbonation`. Doce: `botrytis`, `appassimento` | A |
| `conclusao.climate` | `cool`, `moderate`, `warm` | A |
| `conclusao.climateType` | `maritime`, `continental`, `desert`, `mediterranean` | A |
| `conclusao.preco`, `conclusao.harmonizacao` (já existem) | texto | I para harmonização em texto, A para preço |

O campo `conclusao.qualidade` (escala de 5 níveis) sai. Os valores antigos vão para as notas anteriores à ASI.

### Serviço (Service & Food), aba nova, toda Avançado

| Campo | Valores |
| --- | --- |
| `servico.temperature` | `{ min: number, max: number }` em °C. Aviso (sem bloquear) quando `max - min > 3`, porque a ASI pede faixa de 3 °C. |
| `servico.glass` | `sleek-white`, `couped-white`, `sleek-red`, `couped-red`, `small-sleek` |
| `servico.decant` | `no`, `sediment`, `aerate` |
| `servico.dishStyle` | `elegant`, `rustic`, `rich` |
| `servico.pairingComponents` | lista: `sweetness`, `saltiness`, `umami`, `acidity`, `bitterness`, `heat`, `fat` |

`temperaturaServico` e `decantacao` (texto, na raiz) passam para `servico`.

### Notas anteriores à ASI

`legacyNotes: Record<string, string>`, com a mesma chave por caminho que `provenance` já usa (ex.: `'paladar.acidez': 'Média+'`). A ficha mostra "Anotação anterior à grade ASI: Média+" ao lado do campo. No editor, o texto aparece como dica até a pessoa escolher um valor ASI. Aí a nota sai.

## Conversão das fichas salvas

Regra: só converte o que bate exatamente com as opções antigas de `sommelierData.ts`, ou tem equivalente inequívoco. Texto livre ou nível intermediário vai para `legacyNotes`. A conversão não inventa dado.

| Campo antigo | Converte | Vai para `legacyNotes` |
| --- | --- | --- |
| Corpo | Leve → light, Médio → medium, Encorpado → full | Médio-, Médio+ |
| Acidez | Baixa → low, Média → medium, Alta e Muito Alta → high | Média-, Média+ |
| Intensidade (visual e nariz) | Baixa → low, Média → medium, Alta, Profunda e Pronunciada → high | Média-, Média+ |
| Tanino | Baixo, Médio, Alto → Level3. Nulo → sem nível. Sedoso → qualidade `silky`. "Alto e sedoso" → high + silky | Médio-, Médio+, Adstringente, texto livre |
| Doçura | Seco → dry, Meio-seco → medium-dry, Doce → sweet | Suave (no Brasil é faixa legal, não termo sensorial ASI) |
| Limpidez | Límpido → clear, Brilhante → clear + bright, Turvo → cloudy | Velado, Opalescente |
| Transparência | nada, não existe na ASI | sempre |
| Cor | Amarelo-esverdeado → lemon-green, Palha → straw, Amarelo Dourado → golden, Âmbar → amber, Casca de cebola → onionskin, Rosa Salmão → salmon, Púrpura / Violáceo → purple, Rubi → ruby, Granada → garnet, Alaranjado / Tijolo → tawny | Rosa Cereja, texto livre |
| Condição | Limpo / Correto → clean, Defeituoso → faulty sem defeito nomeado | |
| Desenvolvimento | Primário → youthful, Em evolução → maturing, Maduro / Terciário → mature, Em declínio → past-peak | |
| Persistência | Curta → short, Média → medium, Longa → long (com ou sem os segundos) | |
| Álcool | Baixo → low, Equilibrado e Médio → medium, Alto e Quente → high. "(13%)" → `abv` | texto que sobrar |
| Qualidade (5 níveis) | nada, as escalas não se correspondem | sempre |
| Guarda | Pronto → now | o resto |
| Temperatura | "16°C - 18°C" → `{16, 18}`, "12°C" → `{12, 12}` | texto sem número |
| Decantação | "Não necessita…" → no | o resto |
| Perlage | nada, é termo ABS | sempre |
| Estilo "laranja" | branco + skinContact | |

Onde a conversão roda:

- **IndexedDB:** na abertura do app, uma vez, com a chave `meta` `migration:asi-v3`. Segue o padrão de `migration:app-v1` em `src/repositories/migration.ts`. É idempotente e roda em transação: se falhar, nada muda e o app segue com a v2 na memória até a próxima tentativa.
- **Importação:** backup v2 converte na hora. Backup v3 entra direto. A exportação grava v3. Uma versão antiga do app não importa backup v3; isso vai na nota da versão.
- **Rascunho aberto (`drafts`):** mesma conversão.
- **Fichas demo (`src/data/demo-wines.ts`):** reescritas já em v3.

## Telas

### Editor (`src/features/entry/EntryEditorPage.tsx`, 1345 linhas)

O arquivo está grande demais para receber o dobro de campos. Cada aba vira um componente em `src/features/entry/sections/` (`GeneralSection`, `AppearanceSection`, `NoseSection`, `TasteSection`, `ConclusionSection`, `ServiceSection`). O editor fica só com estado, abas e gravação.

Componentes de campo novos, dirigidos pelo vocabulário:

- `AsiChoice`: escolha única em chips, com rótulo "Alta · High" e os sinônimos como dica. Para listas curtas (Level3, corpo).
- `AsiMultiChoice`: escolha múltipla (observações, textura, qualidade do tanino, defeitos, componentes).
- `ColourPicker`: amostras de cor filtradas pelo estilo.
- `AromaPicker`: o seletor atual, agrupado pelos 18 grupos ASI. No Iniciante mostra os 6 grupos mais comuns (frutado, floral, herbáceo/vegetal, especiarias, madeira, terroso) e esconde o resto atrás de "mais grupos".

Regra de visibilidade, uma função pura e testada em `src/domain/asi-visibility.ts`:

```
visível = campo.tier === 'iniciante'
       || nívelEfetivo === 'avancado'
       || campoPreenchido(entry, campo)
       || existeLegacyNote(entry, campo)
```

A mesma regra esconde o que não se aplica: tanino em branco sem skin contact, mousse em vinho tranquilo, subestilo fora de fortificado, a lista de vinificação conforme o tipo.

No Iniciante a aba Serviço não aparece. As outras abas mostram só os campos do nível. O botão "Mostrar grade completa" fica no topo do editor.

### Ficha (`TastingSheetDetails.tsx`)

Mostra só o que foi preenchido, pelos cinco blocos ASI, com o termo em inglês discreto. As notas anteriores à ASI aparecem em cinza, com rótulo.

### Radar e estatísticas

`scorePalate` passa a ler códigos: Level3 vira 1,5 / 3 / 4,5. Doçura vai de dry = 1 a luscious = 5. Álcool fortificado = 5. Se o campo só tem nota anterior, entra a leitura por palavra de hoje, para o radar das fichas antigas não ficar vazio. Estatísticas de estilo e tipo ganham as categorias novas (laranja, mistela, aromatizado).

### Ajustes

Uma preferência nova, `sheetLevel: 'iniciante' | 'avancado'`, escolhida em "Nível da ficha". O valor inicial segue a decisão 2 acima.

### Leitura de rótulo com IA

`label-schema.ts` continua recebendo texto do Gemini. `label-fill.ts` passa o texto por `asi-convert.ts`: potencial de guarda vira faixa, temperatura vira intervalo, álcool vira `abv`, aromas sugeridos viram descritores do catálogo. O que não converter fica em `legacyNotes` com `provenance: 'ai-unverified'`. O prompt do servidor não muda nesta entrega.

## Testes

- `asi-vocabulary.test.ts`: todo código tem `pt` e `en`. As cores estão na ordem do jovem ao evoluído (7, 5 e 5). Não há código repetido dentro de um campo.
- `asi-convert.test.ts`: a tabela de conversão acima, linha a linha, incluindo os casos que vão para `legacyNotes`.
- Migração: uma ficha v2 de cada tipo vira v3 válida no schema zod. Rodar duas vezes não altera nada. Falha no meio desfaz tudo.
- Importação: backup v2 importa como v3. Backup v3 faz ida e volta sem perda.
- `asi-visibility.test.ts`: a matriz nível × estilo × tipo × campo preenchido.
- `sensory-scale.test.ts`: códigos e o recurso às notas anteriores.
- `label-fill.test.ts`: conversão da resposta da IA.
- E2E (Playwright): criar uma ficha no Iniciante só com os 5 campos. Abrir a grade completa e preencher Serviço. Abrir uma ficha migrada e ver a nota anterior à ASI. Rodar em desktop e Pixel 7, como o CI já faz.

## Ordem de execução

Cada passo fecha com `npm run lint`, `npm test` e commit próprio.

1. Vocabulário ASI e catálogo de aromas, com testes. Nenhuma tela muda.
2. Tipos e schema v3, fábrica de ficha, `legacyNotes`.
3. `asi-convert.ts` com a tabela de conversão e testes.
4. Migração no IndexedDB, rascunho, importação v2/v3 e exportação v3.
5. `scorePalate`, radar e estatísticas lendo códigos.
6. Preferência `sheetLevel` e tela de Ajustes.
7. Quebra do editor em seções, sem mudar comportamento. Rodar o E2E atual antes de seguir.
8. Campos ASI nas seções, regra de visibilidade, aba Serviço, correção de "laranja" e da cor no espumante.
9. Ficha de leitura (`TastingSheetDetails`).
10. Leitura de rótulo pelo conversor.
11. Fichas demo em v3 e E2E novos.
12. README e `memory-bank/`.

Os passos 1 a 5 não mudam nada visível e podem ir num PR só. Os passos 6 a 12 formam o segundo.

## Riscos

| Risco | Mitigação |
| --- | --- |
| Migração corromper fichas locais, sem servidor para recuperar | Transação única, teste de idempotência. Antes de migrar, o app oferece exportar backup se o último tiver mais de 7 dias (já existe `backup-reminder`). |
| Fichas antigas perderem nuance (Média+) | A nuance fica em `legacyNotes` e continua visível. Nada é apagado. |
| Editor ficar mais pesado no celular | Iniciante com 5 campos. A página do editor já carrega sob demanda (`lazy` em `App.tsx`). |
| Backup v3 aberto em versão antiga do app | Nota da versão. O schema v2 rejeita cada ficha na validação (`safeParse` em `import-decisions.ts`). Conferir no passo 4 se a prévia de importação mostra isso com clareza. |

## Diferenças na implementação

- **Um PR, não dois.** Trocar o formato da ficha quebra o editor na hora, então os passos 1 a 5 não podiam sair sem as telas. Ficou um PR com um commit por camada.
- **Limpo ou defeituoso, madeira e halo gravam código, não boolean.** `condition: 'clean' | 'faulty'`, `oak: 'perceptible' | 'imperceptible'` e `rimVariation: 'yes' | 'no'`. Assim todo campo de escolha usa o mesmo componente e o "não preenchido" continua sendo `null`.
- **Decantação com tempo vira aerar.** "1 hora em decanter" e "45 min" viram `aerate`, e o texto fica em `legacyNotes`, porque o tempo se perde. O mesmo vale para a guarda: "5-10 anos" vira `9-12` com o texto guardado.
- **Editor.** Os campos da grade saem de um registro único (`src/domain/asi-fields.ts`) desenhado por `src/features/entry/AsiFields.tsx`, em vez de um arquivo por seção. A aba Geral continua no editor. O arquivo caiu de 1345 para cerca de 1060 linhas.
- **Leitura em memória.** Além da migração, `load()` converte em memória qualquer ficha v2 que tenha sobrado, para a tela nunca ler o formato antigo.
- **Verificação.** O projeto não tem `@types/react` e o `tsconfig` não é `strict`, então `npm run lint` não checa os componentes. As telas foram verificadas pelo build e pelos testes E2E (`e2e/asi-sheet.spec.ts`).
