# Carimbos e marcos do Passaporte

Data: 2026-09-25. Status: aprovada na revisão de 2026-09-26, em implementação na branch `claude/clever-carson-ah3unh`.
Base: `main` em `7eb9c38`. Plano: `docs/superpowers/plans/2026-09-26-carimbos-marcos.md`.

## Objetivo

O Passaporte ganha um sistema de marcos com muitos carimbos: por uva, região, país, tipo, crítica (nota e qualidade ASI), técnica da ficha e quantidade de fichas. Cada marco vira um selo postal vintage em SVG de fundo transparente, com o estilo gráfico do país da família.

Exemplos de nome: "Explorador dos Chardonnays", "Amante de Provence", "Crítico exigente", "Cem páginas".

## Decisões tomadas

| Tema | Decisão |
| --- | --- |
| Quantidade | Livre. Marcos por número de fichas entram (1 a 1000). |
| Unidade contada | Ficha pessoal (`WineEntry`), não garrafa. |
| Tempo | Nenhum marco depende de janela de tempo ("10 em uma semana") nem de sequência diária. Só acumulado. |
| Fonte de verdade | Os marcos são calculados das fichas, função pura. Não há tabela de conquistas gravada. |
| Revogação | Apagar a ficha que sustentava um marco tira o marco. É consequência da função pura e é o comportamento honesto. |
| Demo | Fichas `kind: 'demo'` ou `_demo` nunca contam. O modo demo mostra carimbos ilustrativos, como hoje. |
| Leitura de rótulo | Campo com `provenance` `'ai-unverified'` não conta até a pessoa confirmar. Vale para uva, região e país e também para os outros campos que a IA preenche (`AI_FILLED_PATHS`). |
| Arte | Poucos modelos paramétricos, não 200 desenhos. O nome e o glifo mudam, a moldura vem do nível. |

### Respostas da revisão (2026-09-26)

| Pergunta | Resposta |
| --- | --- |
| Beaujolais | Fica dentro de Borgonha. 31 regiões. |
| Secretos do mesmo dia | Cortados: "Voo de degustação" e "Três continentes numa noite" saem. |
| `pais.todos` | Congelado em `WORLD_TOUR_COUNTRIES` (os 13 países de hoje). |
| Limites | 3/10/25 (uva) e 1/5/15 (região), como propostos. |
| Arte | O gerador `selos-rodada-2/gen.py` não está no repositório. Os 8 modelos são recriados a partir da descrição desta spec. |
| Confirmação da IA | Não havia como confirmar um campo lido pela IA sem editá-lo. A ficha ganha o botão "Confirmar leitura do rótulo". |
| Revisita | `evidence.revisitedAt` nunca era gravado, então "Memória revisitada" era impossível. Passa a ser gravado quando uma ficha existente é salva com mudança de conteúdo. |

## Conflito com o texto atual

`PassportPage.tsx` promete: "Sem metas", "Sem sequências diárias, ranking ou incentivo a beber mais" e "Marcas nascidas das suas anotações, não da quantidade de vinho". Com marcos de quantidade, essa última frase fica falsa. O texto muda na mesma entrega (tarefa 8 do plano). O cabeçalho "CONQUISTAS SEM CONTAGEM DE CONSUMO" e o rodapé "Feito para guardar, não para contar." também mudam.

Risco registrado: se o app for empacotado para App Store, a diretriz 1.4.3 da Apple veta apps que incentivem consumo excessivo de álcool. A decisão "sem janela de tempo, só acumulado" é o que mantém o sistema defensável. Não adicionar marcos do tipo "X fichas em Y dias". Pelo mesmo motivo os dois secretos do mesmo dia foram cortados.

## Fora do escopo

- Compartilhar carimbo em rede social (a exportação PNG deixa pronto, a tela não).
- Marcos por produtor específico (catálogo de produtores não existe).
- Marco por data de nascimento (o app não tem esse dado).
- Ranking entre pessoas. O app não tem conta nem servidor de dados.
- PNGs gerados no repositório. O script roda sob demanda.

## O problema técnico principal: texto livre

`uvas`, `regiaoPais` e `origin.region` são texto livre. "Explorador dos Chardonnays" exige saber que "chardonnay", "Chardonnay 100%" e "Chard." são a mesma uva. "Amante de Provence" exige saber que "Bandol", "Côtes de Provence" e "Provença" são Provence.

| Abordagem | Custo | Problema |
| --- | --- | --- |
| A. Comparar texto cru em minúsculas | Baixo | "Shiraz" e "Syrah" viram dois marcos. "Bandol" não conta para Provence. |
| B. Catálogo com sinônimos, resolvido na hora do cálculo (escolhida) | Médio | O catálogo precisa de curadoria. Uva ou região fora do catálogo não gera marco próprio, só conta para "distintos". |
| C. Gravar `grapeIds` e `regionId` na ficha | Alto | Exige `schemaVersion: 4`, migração e UI de escolha. Duas fontes de verdade com o texto. |

Escolha: B. Sem mudança de schema. Se um dia a ficha ganhar seletor de uva, o catálogo da B já é a lista.

### Regra de normalização

1. Minúsculas, remover acentos (`normalize('NFD').replace(/\p{M}/gu, '')`), trocar pontuação por espaço.
2. Uvas: remover percentuais (`\d+([.,]\d+)?\s*%`) antes de tudo, porque "85,5%" tem vírgula. Depois quebrar `uvas` por `/[,;/+&]| e /` (mesmo corte de `insights.ts`, mais "&" e " e ").
3. Casar cada pedaço contra os sinônimos do catálogo com limite de palavra. Sinônimo mais longo ganha ("pinot noir" antes de "pinot") e consome o trecho ("cabernet sauvignon" não gera Sauvignon Blanc).
4. Regiões: casar `origin.region` e `regiaoPais` contra os sinônimos. Sub-região conta para a região mãe (Pauillac conta para Bordeaux). O nome do vinho (`vinho`) não entra: "Chablis" no nome de um vinho da Califórnia seria falso positivo.
5. Uma ficha conta no máximo uma vez por uva e uma vez por região, mesmo com a uva repetida no texto.
6. País: `origin.countryCode`, sem `'other'`. Não tem chave de `provenance`; a leitura de rótulo deriva o país de `regiaoPais`. Por isso o país não conta quando `regiaoPais` está `'ai-unverified'` e o código é o mesmo que `inferCountryCode(regiaoPais)` daria.

## Arquitetura

Módulos novos, todos em `src/domain/stamps/`:

| Arquivo | Conteúdo |
| --- | --- |
| `grape-catalog.ts` | `GRAPES: { id, label, plural, color: 'tinta' \| 'branca', home, aliases[] }[]` |
| `region-catalog.ts` | `REGIONS: { id, label, country, parent?, aliases[] }[]` |
| `normalize.ts` | `fold(text)`, `grapesOf(entry)`, `grapeKeysOf(entry)`, `regionsOf(entry)`, `countryOf(entry)`, `trusted(entry, path)`. Respeita `provenance`. |
| `rules.ts` | Os tipos de regra e o avaliador de uma regra. |
| `catalog.ts` | A lista de marcos. Famílias paramétricas geram os marcos de uva e região a partir dos catálogos. |
| `evaluate.ts` | `evaluateStamps(entries, { source })`. Pura, sem I/O. |
| `view.ts`, `novelty.ts` | Ordem e filtro da página; marcos recém-ganhos e texto do aviso. |

Componente novo: `src/components/proto/MilestoneStamp.tsx`, com os modelos em `src/components/proto/stamp-art/`. Script novo: `scripts/render-stamps.mjs`.

### Tipos

```ts
type Family = 'uva' | 'regiao' | 'pais' | 'estilo' | 'critica' | 'tecnica' | 'volume' | 'harmonizacao' | 'secreto' | 'legado';
type Tier = 1 | 2 | 3;            // bronze, prata, ouro -> moldura
type Tone = 'wine' | 'sage' | 'terracotta' | 'kraft';

interface Ctx {                   // pré-calculado uma vez por avaliação
  entries: WineEntry[];           // já sem demo, em ordem cronológica
  grapes: Map<WineEntry['id'], GrapeId[]>;
  regions: Map<WineEntry['id'], RegionId[]>;
}

type Rule =
  | { kind: 'count'; where: (e: WineEntry, ctx: Ctx) => boolean; min: number }
  | { kind: 'distinct'; of: (e: WineEntry, ctx: Ctx) => string[]; min: number }
  | { kind: 'coverAll'; of: (e: WineEntry, ctx: Ctx) => string[]; required: readonly string[] }
  | { kind: 'custom'; target: number; progress: (ctx: Ctx) => { current: number; unlockedBy?: string } };

interface StampDef {
  id: string;                     // estável: 'uva.chardonnay.2', 'volume.100'
  family: Family;
  tier: Tier;
  title: string;                  // "Explorador dos Chardonnays"
  motto: string;                  // texto curto do arco: "10 FICHAS DE CHARDONNAY"
  description: string;            // frase da lista
  glyph: string;                  // nome em stamp-art/glyphs.ts
  tone: Tone;
  subject?: string;               // uva ou região dos marcos paramétricos
  face?: string;                  // valor facial quando difere do alvo
  hidden?: boolean;               // secreto: aparece como "?" até ganhar
  rule: Rule;
}

interface StampState {
  def: StampDef;
  earned: boolean;
  current: number;
  target: number;
  earnedAt: string | null;        // dataDegustacao da ficha que cruzou o limite
  earnedByEntryId: string | null;
}
```

### Data de conquista sem gravar nada

Ordenar as fichas por `dataDegustacao` (desempate `criadoEm`, depois `id`). A ficha que satisfaz a regra na posição `min` é a que cruzou o limite. `earnedAt` é a data dela. Para `distinct` e `coverAll`, a ficha que trouxe o valor novo que completou o alvo.

### Estado "novo"

Único estado persistido: `seenStampIds: string[]` nas preferências. Carimbo ganho e fora dessa lista mostra um selo "NOVO". O aviso discreto sai uma vez, junto da mensagem de ficha salva, e o id entra em `seenStampIds` nesse momento. Se o carimbo for revogado e ganho de novo, não repete o aviso.

## Catálogo de marcos

Total: 72 de uva + 93 de região + 64 fixos + 4 legados = 233 marcos.

### 1. Uvas (paramétrico, 24 uvas × 3 níveis = 72)

| Nível | Regra | Título | Moto |
| --- | --- | --- | --- |
| 1 | `count` ≥ 3 fichas com a uva | Curioso de {label} | 3 FICHAS DE {LABEL} |
| 2 | ≥ 10 | Explorador dos {plural} | 10 FICHAS DE {LABEL} |
| 3 | ≥ 25 | Guardião dos {plural} | 25 FICHAS DE {LABEL} |

Tom: `wine` para tinta, `kraft` para branca. Glifo: cacho de uva.

| id | label / plural | Sinônimos além do nome |
| --- | --- | --- |
| cabernet-sauvignon | Cabernet Sauvignon / Cabernets | cab sauv, cabernet s |
| merlot | Merlot / Merlots | |
| pinot-noir | Pinot Noir / Pinots Noirs | pinot nero, spatburgunder, blauburgunder |
| syrah | Syrah / Syrahs | shiraz |
| malbec | Malbec / Malbecs | cot, auxerrois (tinto) |
| tempranillo | Tempranillo / Tempranillos | tinta roriz, aragonez, tinto fino, tinta de toro |
| grenache | Grenache / Grenaches | garnacha, garnatxa, cannonau |
| sangiovese | Sangiovese / Sangioveses | brunello, prugnolo gentile, morellino |
| nebbiolo | Nebbiolo / Nebbiolos | spanna, chiavennasca |
| carmenere | Carménère / Carménères | carmenere |
| tannat | Tannat / Tannats | |
| touriga-nacional | Touriga Nacional / Tourigas | |
| cabernet-franc | Cabernet Franc / Cabernets Francs | bouchet |
| zinfandel | Zinfandel / Zinfandels | primitivo |
| mourvedre | Mourvèdre / Mourvèdres | monastrell, mataro |
| chardonnay | Chardonnay / Chardonnays | chard |
| sauvignon-blanc | Sauvignon Blanc / Sauvignons | fume blanc, sauvignon |
| riesling | Riesling / Rieslings | |
| chenin-blanc | Chenin Blanc / Chenins | steen |
| alvarinho | Alvarinho / Alvarinhos | albarino |
| pinot-grigio | Pinot Grigio / Pinots Gris | pinot gris, grauburgunder |
| gewurztraminer | Gewürztraminer / Gewürz | gewurz, traminer |
| viognier | Viognier / Viogniers | |
| moscato | Moscato / Moscatos | muscat, moscatel, moscato giallo |

Cuidados: "sauvignon" sozinho casa Sauvignon Blanc só se não fizer parte de "cabernet sauvignon". "auxerrois" é ambíguo (também é uva branca na Alsácia); casa Malbec só se `estilo === 'tinto'`. Esses casos têm teste.

### 2. Regiões (paramétrico, 31 regiões × 3 níveis = 93)

| Nível | Regra | Título | Moto |
| --- | --- | --- | --- |
| 1 | ≥ 1 ficha da região | Visitante de {label} | PRIMEIRA PÁGINA DE {LABEL} |
| 2 | ≥ 5 | Amante de {label} | 5 FICHAS DE {LABEL} |
| 3 | ≥ 15 | Cidadão de {label} | 15 FICHAS DE {LABEL} |

Tom: `sage`. Glifo: marco de estrada ou colina. Nível 1 com 1 ficha é proposital: é o carimbo de "passei por aqui".

| País | Regiões (id: sinônimos principais) |
| --- | --- |
| FR | provence: provença, cotes de provence, bandol, cassis, palette · bordeaux: bordeus, medoc, pauillac, margaux, saint julien, saint estephe, saint emilion, pomerol, graves, pessac, sauternes · borgonha: bourgogne, burgundy, chablis, cote de nuits, cote de beaune, maconnais, beaujolais · champagne · rhone: vale do rodano, cotes du rhone, chateauneuf du pape, hermitage, cote rotie, gigondas · loire: vale do loire, sancerre, vouvray, muscadet, pouilly fume · alsacia: alsace |
| IT | toscana: tuscany, chianti, montalcino, brunello di montalcino, bolgheri, montepulciano · piemonte: piedmont, barolo, barbaresco, langhe, asti · veneto: valpolicella, amarone, soave, prosecco, conegliano · sicilia: sicily, etna |
| ES | rioja · ribera-del-duero: ribera del duero · priorat: priorato · jerez: sherry, xeres, sanlucar · rias-baixas: rias baixas |
| PT | douro: porto (só com `tipo === 'fortificado'`), vale do douro · alentejo · vinho-verde: minho, moncao, melgaco · dao · madeira |
| AR | mendoza: lujan de cuyo, valle de uco, maipu, tupungato · salta: cafayate, calchaqui |
| CL | colchagua: vale de colchagua · maipo: vale do maipo · casablanca: vale de casablanca |
| BR | serra-gaucha: vale dos vinhedos, bento goncalves, pinto bandeira · campanha-gaucha: campanha |
| US | napa: napa valley |
| NZ | marlborough |
| ZA | stellenbosch |

Total por país: FR 7, IT 4, ES 5, PT 5, AR 2, CL 3, BR 2, US 1, NZ 1, ZA 1 = 31.

### 3. Países (fixos, 8 marcos)

O `CountryStamp` atual continua sendo o carimbo por país. Os marcos abaixo se somam a ele.

| id | Título | Regra |
| --- | --- | --- |
| pais.3 | Mochileiro | `distinct` países ≥ 3 |
| pais.6 | Passaporte carimbado | ≥ 6 |
| pais.10 | Cosmopolita | ≥ 10 |
| pais.todos | Volta ao mundo | `coverAll` de `WORLD_TOUR_COUNTRIES` (13) |
| pais.velho | Velho Mundo | `distinct` ≥ 4 entre FR, IT, ES, PT, DE |
| pais.novo | Novo Mundo | `distinct` ≥ 4 entre AR, CL, BR, UY, US, AU, NZ, ZA |
| pais.dois-mundos | Entre dois mundos | ≥ 10 fichas do Velho e ≥ 10 do Novo |
| pais.casa | Orgulho nacional | ≥ 10 fichas do Brasil |

### 4. Estilos e tipos (fixos, 16 marcos)

| id | Título | Regra |
| --- | --- | --- |
| estilo.primeiro-espumante | Primeiras bolhas | `tipo === 'espumante'` ≥ 1 |
| estilo.espumante | Vida efervescente | espumante ≥ 15 |
| estilo.tradicional | Método clássico | `vinification` inclui `traditional` ≥ 5 |
| estilo.rose | Amante de rosé | `estilo === 'rose'` ≥ 10 |
| estilo.laranja | Pele e alma | `skinContact` ≥ 1 |
| estilo.laranja-5 | Laranja convicto | `skinContact` ≥ 5 |
| estilo.doce | Final doce | `tipo === 'sobremesa'` ≥ 1 |
| estilo.botrytis | Podridão nobre | `vinification` inclui `botrytis` ≥ 1 |
| estilo.fortificado | Espírito fortificado | `tipo === 'fortificado'` ≥ 1 |
| estilo.jerez-todos | Bodega completa | `coverAll` dos 7 subestilos de Jerez |
| estilo.porto-trio | Cais da Ribeira | `coverAll` port-ruby, port-tawny, port-vintage |
| estilo.madeira-todos | Quatro castas da ilha | `coverAll` dos 4 subestilos de Madeira |
| estilo.raros | Fora do mapa | `coverAll` mistela e aromatizado |
| estilo.arco-iris | Arco-íris na taça | `coverAll` branco, rosé, tinto e 1 skinContact |
| estilo.todos-tipos | Seis caminhos | `coverAll` dos 6 `WINE_TYPES` |
| estilo.guarda | Paciência de adega | `ageing` em `12-15` ou `15+` ≥ 3 |

### 5. Crítica (fixos, 12 marcos)

"Crítica" aqui tem duas fontes: estrelas (gosto pessoal) e Qualidade ASI (julgamento técnico).

| id | Título | Regra |
| --- | --- | --- |
| critica.primeira-nota | Primeira opinião | `avaliacaoEstrelas !== null` ≥ 1 |
| critica.cinco | Amor à primeira taça | 5 estrelas ≥ 1 |
| critica.cinco-10 | Coração generoso | 5 estrelas ≥ 10 |
| critica.exigente | Crítico exigente | 1 ou 2 estrelas ≥ 10 |
| critica.escala | Escala inteira | `coverAll` estrelas 1, 2, 3, 4 e 5 |
| critica.asi-1 | Olhar técnico | `asiQuality` preenchida ≥ 1 |
| critica.asi-25 | Júri de bolso | `asiQuality` preenchida ≥ 25 |
| critica.muito-bom | Muito bom, oficialmente | `asiQuality === 'very-good'` ≥ 5 |
| critica.gosto-e-gosto | Gosto é gosto | ≥ 1 ficha com 5 estrelas e ASI `simple`, ou 1 estrela e ASI `very-good` |
| critica.calibrado | Palato calibrado | ≥ 10 fichas onde estrelas e ASI concordam (1-2 = simple, 3 = acceptable, 4 = good, 5 = very-good) |
| critica.cronista | Cronista | `impressaoFinal` com ≥ 280 caracteres ≥ 10 |
| critica.defeito | Nariz de detetive | `olfato.faults` ou `paladar.faults` não vazio ≥ 1 |

### 6. Técnica da ficha (fixos, 10 marcos)

| id | Título | Regra |
| --- | --- | --- |
| tecnica.grade-1 | Grade completa | ≥ 1 ficha com a grade ASI completa (`isGridComplete`) |
| tecnica.grade-10 | Sommelier de bolso | ≥ 10 |
| tecnica.grade-50 | Banca examinadora | ≥ 50 |
| tecnica.aromas-10 | Nariz curioso | `distinct` `aromaTags` ≥ 10 |
| tecnica.aromas-50 | Biblioteca de aromas | ≥ 50 |
| tecnica.grupos | Nariz enciclopédico | `coverAll` dos 18 grupos de `aroma-catalog.ts` |
| tecnica.cor | Paleta de cores | `distinct` `estilo` + `visual.coreColour` ≥ 10 |
| tecnica.servico | Mestre de serviço | temperatura, taça e decantação preenchidas ≥ 10 |
| tecnica.vertical | Degustação vertical | mesmo produtor + vinho em ≥ 3 safras diferentes |
| tecnica.arqueologo | Arqueólogo | safra ≤ ano da degustação − 20, ≥ 1 |

"Grade completa" (`isGridComplete` em `asi-fields.ts`) usa `ASI_FIELDS` e a regra `applies` que decide quais campos a ficha mostra, sem duplicar a lista. Entram os campos com termo ASI (`en`); ficam de fora o toggle de contato com as cascas (`false` é resposta válida) e as listas sem regra de aplicação (observações, textura, vinificação e componentes de harmonização podem ficar vazias). Nota anterior à ASI (`legacyNotes`) conta como preenchida.

### 7. Volume (fixos, 12 marcos)

| id | Título | Regra |
| --- | --- | --- |
| volume.1 | Primeira taça | fichas ≥ 1 |
| volume.10 | Dezena | ≥ 10 |
| volume.25 | Caderno aberto | ≥ 25 |
| volume.50 | Meio século | ≥ 50 |
| volume.100 | Cem páginas | ≥ 100 |
| volume.250 | Adega de papel | ≥ 250 |
| volume.500 | Enciclopédia | ≥ 500 |
| volume.1000 | Mil taças | ≥ 1000 |
| volume.produtores-10 | Dez casas | `distinct` produtor (normalizado com `fold`) ≥ 10 |
| volume.produtores-50 | Rota das vinícolas | ≥ 50 |
| volume.uvas-10 | Ampelógrafo | `distinct` uvas (texto normalizado, não só catálogo) ≥ 10 |
| volume.uvas-50 | Enciclopédia de castas | ≥ 50 |

### 8. Harmonização (fixos, 4 marcos)

| id | Título | Regra |
| --- | --- | --- |
| harmonizacao.1 | À mesa | `harmonizacao` ou `servico.dishStyle` preenchido ≥ 1 |
| harmonizacao.25 | Cozinha do caderno | ≥ 25 |
| harmonizacao.componentes | Sete sabores | `coverAll` dos 7 `PAIRING_COMPONENTS` |
| harmonizacao.estilos | Do rústico ao elegante | `coverAll` dos 3 `DISH_STYLE` |

### 9. Secretos (fixos, 2 marcos, `hidden: true`)

| id | Título | Regra |
| --- | --- | --- |
| secreto.revisita | De volta à página | `evidence.revisitedAt` ≥ 5 |
| secreto.favoritos | Coleção do coração | `favorite` ≥ 20 |

### 10. Legados (4 marcos)

Os 4 marcos de hoje (`first`, `vocabulary`, `revisited`, `origin`) entram no catálogo com ids `legado.*` e as mesmas regras, para ninguém perder marca já exibida. Ficam na página 02 do Passaporte, não nas abas.

## Arte do carimbo

Cada marco é um selo postal vintage. As famílias de região e país usam o estilo gráfico do país; a coleção fica coesa pelo sistema abaixo.

### Sistema comum (não muda entre selos)

- Caixa `viewBox="0 0 240 240"` para todos. Fora do selo, transparente.
- Papel único `#fcf8ef`. Mais claro que o `--paper` do app de propósito, senão o selo some no fundo.
- Serrilha por máscara: furos de raio 4.2 a cada ~11 px nas bordas do papel.
- Três filtros iguais em todos: grão do papel (opacidade .28), desgaste cor de papel sobre a tinta (intensidade .3 a .95 por estilo) e leve irregularidade no traço (`feDisplacementMap`, escala .9).
- Paleta fechada, no máximo 4 tintas por selo: tinta `#2b2722`, azul `#27456b`, vinho `#7a2f3b`, sálvia `#5f7150` e `#9aa886`, terracota `#c0654a`, ouro `#c49a54`, lavanda `#8a78ad`, céu `#a9c7c2`, rosado `#f2d6c8`.
- Tipografia do app: Fraunces (título), DM Mono (valor, microtexto), Caveat (manuscrito, só no selo redondo).
- Todo selo tem o valor facial = limite do marco (10 Chardonnays → "10") e o microtexto WINEFOLIO.
- O selo não inclui sombra. A sombra é CSS no app.

### Modelo por país ou família

| Modelo | Uso | Traços |
| --- | --- | --- |
| Gravura azul | Uvas brancas, Borgonha | Painel azul, cartucho em ogiva, estrelas, ilustração com hachura |
| Traço e chapado | França, Itália, Espanha, Alemanha | Título espaçado no topo, janela com linha fina e cores chapadas, rodapé WINEFOLIO / país / valor |
| Azulejo | Portugal | Moldura de azulejo azul e branco, cena azul monocromática |
| Paisagem retrô | Argentina, Chile, uvas tintas do Novo Mundo | Horizontal, paisagem plana com desgaste forte, caixa de texto no canto |
| Selo redondo de tinta | Países (marcos de coleção), volume, legados | Disco de papel, anel duplo, texto em arco, manuscrito embaixo |
| Art déco | Estilos, harmonização | Painel escuro com cantos chanfrados, raios e ouro |
| Modernismo | Brasil, Uruguai | Formas chapadas sem contorno, faixa vertical com o país |
| Camafeu vitoriano | Crítica, técnica, secretos | Fundo de linhas onduladas, oval com pérolas, faixa com o título |

Uva herda o modelo do país mais associado a ela (Malbec → paisagem retrô argentina). Os marcos paramétricos trocam só título, valor e ilustração dentro do modelo.

### Estados

| Estado | Visual |
| --- | --- |
| Ganho | Selo completo |
| Ganho com carimbo | Carimbo postal por cima (círculo duplo, local e data `DD·MM·AA`, ondas), com a data de `earnedAt` |
| Novo | Etiqueta "NOVO" fora do SVG |
| Bloqueado | Espaço vazio de álbum: contorno tracejado, cantoneiras, "?", título e barra de progresso |
| Secreto bloqueado | Espaço vazio sem título, só "?" |

### Tamanho pequeno

Abaixo de ~96 px o desgaste e o microtexto viram sujeira. Variante `compact`: sem grão, sem desgaste, sem microtexto, título e valor apenas. Usar em listas e avisos.

### Exportação

- No app, o SVG usa as fontes já carregadas.
- `scripts/render-stamps.mjs`: Chromium do Playwright, `page.screenshot({ omitBackground: true })` em 512 e 1024 px, saída em `public/stamps/{id}.png` e `public/stamps/manifest.json`. Rodar sob demanda. O Chromium rasteriza depois de carregar as fontes web, então o PNG não depende de fonte instalada e não precisa de `opentype.js`.

### Ilustrações

As ilustrações são provisórias. A arte final vem de ilustrador ou de imagem gerada e vetorizada à mão; o código fica com moldura, serrilha, filtros, texto e valor.

## Interface

No `PassportPage`, uma terceira página do livro: "03 / MARCOS".

- Filtro por família em abas (Uvas, Regiões, Países, Estilos, Crítica, Técnica, Volume, Mesa, Secretos).
- Dentro da família, ganhos primeiro (por `earnedAt` desc), depois bloqueados por proximidade (`current / target` desc).
- Famílias paramétricas mostram os níveis ganhos e o próximo nível de cada uva ou região, não os três.
- Uva ou região com 0 fichas não aparece bloqueada. Aparece só depois da primeira ficha.
- Tocar no carimbo abre um diálogo (`ModalDialog`) com o carimbo grande, a data, a ficha que desbloqueou (link) e o botão "Baixar PNG" quando existir.
- `journey-stat` passa a mostrar "X de Y marcos".

## Critérios de aceite

- Nenhum marco muda de estado sem mudança nas fichas (função pura, testada).
- Nenhum carimbo tem pixel de fundo: PNG exportado com canal alfa 0 fora do desenho (o script confere os cantos).
- `evaluateStamps` com 1000 fichas roda em menos de 50 ms no Node (teste de desempenho simples).
- O modo demo nunca mostra marco pessoal, e as fichas pessoais nunca mostram marco ilustrativo.
