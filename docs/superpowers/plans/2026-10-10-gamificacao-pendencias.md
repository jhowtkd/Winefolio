# Pendências e Roteiro dos 222 Selos Restantes do Catálogo

> **Status em 2026-10-30 — leia antes do resto.** Este documento registra o estado de 2026-10-10 e ficou para trás. O domínio dos 233 selos entrou na `main` pelo PR #7 (`src/domain/stamps/`), mas a tela do Passaporte continua mostrando só os 11 selos de `passportProgress`: **domínio integrado não é interface entregue**. O restante do trabalho está em [`2026-10-30-passaporte-conciliacao-pr5.md`](2026-10-30-passaporte-conciliacao-pr5.md).
>
> As contagens da seção 1 continuam corretas como composição do catálogo; "Implementados" e "Restantes" se referem à interface de 2026-10-10. As decisões da seção 2 marcadas como pendentes foram resolvidas no código assim:
>
> | Tema | Como está em `src/domain/stamps/` |
> |---|---|
> | Cortes | Cada uva listada na ficha conta |
> | Sinônimos | `grape-catalog.ts`, `region-catalog.ts` e `normalize.ts` |
> | Limiares | Uvas 3/10/25 fichas; regiões 1/5/15 fichas |
> | `pais.casa` | 10 fichas do Brasil |
> | Velho e Novo Mundo | Velho: FR, IT, ES, PT, DE. Novo: AR, CL, BR, UY, US, AU, NZ, ZA |
> | `pais.todos` | Os 13 países das duas listas |
> | `volume.*` | Conta fichas, não taças; "Primeira taça" e "Mil taças" mantêm o título |
> | Produtores | Nome dobrado por `fold` |
> | Grade completa | `isGridComplete` mais `tipo`, `estilo` e `skinContact` confiáveis. A `main` ainda não marca `skinContact` vindo da IA; o PR #10 corrige |
> | Botrytis e método tradicional | Campo de vinificação |
> | Harmonização | Todos os códigos de `PAIRING_COMPONENTS` (7) e `DISH_STYLE` (3) |
> | `critica.defeito` | Um defeito em `olfato.faults` ou `paladar.faults` |
> | Secretos | 5 fichas revisitadas (regra de `legado.revisited`); 20 favoritos |
>
> Campos preenchidos por IA e ainda não revisados ficam fora dessas regras. O caminho do `catalogo.json` citado abaixo aponta para uma máquina pessoal; a fonte em uso é o código.

Este documento mapeia os 222 selos restantes do catálogo oficial de 233 selos (`/Users/jhonatan/Documents/Codex/2026-10-07/pr/outputs/selos-v03/catalogo.json`), após a implementação dos 11 selos iniciais (4 legados + 7 da etapa atual).

Ele inventaria as pendências por família e especifica os critérios e decisões de modelagem necessários antes de qualquer implementação ou alteração de schema, respeitando a premissa de não inferir dados por heurísticas frouxas, não criar metas de consumo e não inventar evidências que o modelo de dados atual não possui.

---

## 1. Inventário Quantitativo por Família

| Família | Total no Catálogo | Implementados Nesta Etapa | Restantes |
|---|---|---|---|
| `uva.*` | 72 | 0 | 72 (24 uvas × 3 níveis) |
| `regiao.*` | 93 | 0 | 93 (31 regiões × 3 níveis) |
| `pais.*` | 8 | 0 | 8 |
| `volume.*` | 12 | 0 | 12 |
| `estilo.*` | 16 | 3 (`primeiro-espumante`, `laranja`, `fortificado`) | 13 |
| `harmonizacao.*` | 4 | 1 (`harmonizacao.1`) | 3 |
| `critica.*` | 12 | 3 (`primeira-nota`, `cinco`, `asi-1`) | 9 |
| `tecnica.*` | 10 | 0 | 10 |
| `secreto.*` | 2 | 0 | 2 |
| `legado.*` | 4 | 4 (`first`, `vocabulary`, `revisited`, `origin`) | 0 |
| **Total** | **233** | **11** | **222** |

---

## 2. Decisões e Critérios Pendentes por Família

### 2.1. Uvas e Regiões (165 selos: 72 `uva.*` e 93 `regiao.*`)

#### IDs Ancorados:
- **Uvas:** `uva.<casta>.[1|2|3]` (ex.: `uva.cabernet-sauvignon.1..3`, `uva.merlot.1..3`, `uva.pinot-noir.1..3`, `uva.chardonnay.1..3`, `uva.touriga-nacional.1..3`, etc.).
- **Regiões:** `regiao.<regiao>.[1|2|3]` (ex.: `regiao.bordeaux.1..3`, `regiao.douro.1..3`, `regiao.mendoza.1..3`, `regiao.serra-gaucha.1..3`, `regiao.toscana.1..3`, etc.).

#### Pendências e Critérios Necessários:
1. **Tratamento de Cortes / Blends vs. Varietais:** O campo `uvas` na ficha é textual livre (ex.: `"Cabernet Sauvignon, Merlot"` ou `"70% Touriga Nacional, 30% Touriga Franca"`).
   - *Decisão pendente:* Uma ficha de corte pontua para todas as uvas listadas ou apenas para a predominante/varietal monovarietal?
2. **Normalização e Sinônimos (Aliases):** Variações ortográficas e sinônimos internacionais (ex.: Syrah vs. Shiraz, Pinot Grigio vs. Pinot Gris, Tempranillo vs. Aragonez/Tinta Roriz).
   - *Decisão pendente:* Necessária uma tabela formal de vocabulário controlado / dicionário canônico de uvas com aliases antes da ativação.
3. **Limiares de Níveis (1, 2 e 3):**
   - *Decisão pendente:* Definir a escala de contagem: nível 1 = 1 ficha? nível 2 = 3 fichas? nível 3 = 5 ou 10 fichas? A contagem deve ser de fichas com safras/rótulos distintos ou qualquer registro?
4. **Ambiguidade de Região Textual Livre:** O campo `regiaoPais` / `origin.region` hoje aceita texto arbitrário (ex.: `"Vale dos Vinhedos"`, `"Bento Gonçalves"`, `"RS"`, `"Serra Gaúcha"`).
   - *Decisão pendente:* Região textual livre não basta para inferir sem ambiguidade. Requer catálogo canônico de denominações de origem/regiões antes de vincular aos IDs de `regiao.*`.

---

### 2.2. Países e Diversidade (8 selos: `pais.*`)

#### IDs Ancorados:
- `pais.casa` (Orgulho nacional)
- `pais.3` (Mochileiro)
- `pais.6` (Passaporte carimbado)
- `pais.10` (Cosmopolita)
- `pais.todos` (Volta ao mundo)
- `pais.velho` (Velho Mundo)
- `pais.novo` (Novo Mundo)
- `pais.dois-mundos` (Entre dois mundos)

#### Pendências e Critérios Necessários:
1. **Semântica de "Orgulho nacional" (`pais.casa`):**
   - *Decisão pendente:* O Winefolio não possui cadastro de perfil, geolocalização ou nacionalidade do usuário (arquitetura 100% local e sem login). Definir se `pais.casa` referencia o país da localidade do sistema (ex.: Brasil se `navigator.language` for `pt-BR`) ou se deve ser redefinido para uma escolha explícita do usuário em Ajustes, evitando presunção arbitrária.
2. **Classificação Velho Mundo vs. Novo Mundo (`pais.velho`, `pais.novo`, `pais.dois-mundos`):**
   - *Decisão pendente:* Formalizar a lista fechada de códigos ISO de países pertencentes ao Velho Mundo (Europa, Cáucaso, Norte da África tradicional) vs. Novo Mundo (Américas, África do Sul, Oceania, Ásia moderna).
3. **Universo de Países para `pais.todos`:**
   - *Decisão pendente:* `pais.todos` exige todos os países produtores catalogados no Winefolio (quantos?) ou um limiar amplo de diversidade geográfica?

---

### 2.3. Volume e Recorrência (12 selos: `volume.*`)

#### IDs Ancorados:
- `volume.1` (Primeira taça), `volume.10` (Dezena), `volume.25` (Caderno aberto), `volume.50` (Meio século)
- `volume.100` (Cem páginas), `volume.250` (Adega de papel), `volume.500` (Enciclopédia), `volume.1000` (Mil taças)
- `volume.produtores-10` (Dez casas), `volume.produtores-50` (Rota das vinícolas)
- `volume.uvas-10` (Ampelógrafo), `volume.uvas-50` (Enciclopédia de castas)

#### Pendências e Critérios Necessários:
1. **Alinhamento Ético contra Incentivo ao Consumo:**
   - O princípio basilar do app é "observar, registrar e revisitar, sem metas de consumo ou contagem de taças".
   - *Decisão pendente:* Títulos como "Primeira taça" ou "Mil taças" não devem contar taças físicas nem incentivar consumo rápido. Devem ser mapeados estritamente como *fichas registradas no caderno* (`entries.length`).
   - Avaliar se marcos de volume extremo (250, 500, 1000 fichas) fazem sentido para a proposta de um caderno íntimo ou se devem ser adaptados.
2. **Diversidade de Produtores e Uvas (`volume.produtores-*`, `volume.uvas-*`):**
   - *Decisão pendente:* Normalização do nome de produtores (strings com pequenas variações de maiúsculas/espaços contam como o mesmo produtor via `.trim().toLowerCase()`?).

---

### 2.4. Estilos Avançados, Técnica, Crítica, Harmonização e Secretos (37 selos)

#### IDs Ancorados:
- **Estilos (13):** `estilo.espumante`, `estilo.tradicional`, `estilo.rose`, `estilo.laranja-5`, `estilo.doce`, `estilo.botrytis`, `estilo.jerez-todos`, `estilo.porto-trio`, `estilo.madeira-todos`, `estilo.raros`, `estilo.arco-iris`, `estilo.todos-tipos`, `estilo.guarda`.
- **Harmonização (3):** `harmonizacao.25`, `harmonizacao.componentes`, `harmonizacao.estilos`.
- **Crítica (9):** `critica.cinco-10`, `critica.exigente`, `critica.escala`, `critica.asi-25`, `critica.muito-bom`, `critica.gosto-e-gosto`, `critica.calibrado`, `critica.cronista`, `critica.defeito`.
- **Técnica (10):** `tecnica.grade-1`, `tecnica.grade-10`, `tecnica.grade-50`, `tecnica.aromas-10`, `tecnica.aromas-50`, `tecnica.grupos`, `tecnica.cor`, `tecnica.servico`, `tecnica.vertical`, `tecnica.arqueologo`.
- **Secretos (2):** `secreto.revisita`, `secreto.favoritos`.

#### Pendências e Critérios Necessários:
1. **Completude da Grade Técnica ASI (`tecnica.grade-*`):**
   - *Decisão pendente:* O que define uma "grade completa" (`tecnica.grade-1`)? Todos os campos do nível avançado preenchidos ou um subconjunto de seções obrigatórias (Visual, Olfato, Paladar, Conclusão)?
2. **Estilos Específicos e Subestilos (`estilo.botrytis`, `estilo.jerez-todos`, etc.):**
   - *Decisão pendente:* O modelo atual possui `tipo` e `subestilo` (`subestilo` é enum opcional para fortificados). Vinhos com Botrytis ou métodos tradicionais de espumante necessitam de validação se o campo `subestilo` ou notas legadas cobrem esses casos sem exigir novos campos de schema.
3. **Harmonização Estruturada (`harmonizacao.componentes`, `harmonizacao.estilos`):**
   - *Decisão pendente:* O modelo atual tem `conclusao.harmonizacao` (texto livre), `servico.dishStyle` (enum da ASI) e `servico.pairingComponents` (lista de componentes). Definir se esses selos dependem de `servico.dishStyle` e `servico.pairingComponents` preenchidos na grade técnica.
4. **Crítica e Defeitos (`critica.defeito`, `critica.calibrado`):**
   - *Decisão pendente:* `critica.defeito` requer seleção em `olfato.faults` ou `paladar.faults` (defeitos identificados no exame olfativo ou gustativo). Definir quais defeitos contam e se registros antigos sem grade técnica devem ser considerados.
5. **Secretos (`secreto.revisita`, `secreto.favoritos`):**
   - *Decisão pendente:* `secreto.revisita` (limiar de revisitas de uma mesma ficha após X meses ou quantidade?) e `secreto.favoritos` (quantidade de fichas pessoais com `favorite === true`?).
