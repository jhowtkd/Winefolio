# Passaporte: conciliação do PR #5 com o domínio dos 233 selos

Estado em 2026-10-30, com `main` em `7fb200c`. O domínio dos 233 selos está integrado (PR #7); a interface continua com 11 selos. O PR #5 (`26ad789`) parte de `7eb9c38`, está em conflito e não deve ser mesclado inteiro: pela issue #6 ele entra em fatias, cada uma com OK próprio.

## O que não entra

| Item do #5 | Motivo |
|---|---|
| `src/domain/revisit.ts`, `withRevisit` no repositório | Issue #6: vale a regra da `main`, marcada em `wine-repository.ts` quando a impressão final muda |
| `catalog.ts`, `normalize.ts` e seus testes | A versão da `main` é mais rígida; reaplicar seria regressão |
| Mudança de export em `asi-fields.ts` | A `main` já resolve com `isGridComplete` |
| `PassportPage.tsx` inteira | Reescreve o livro de 3 folhas com arte webp, que mudou na `main` depois da base do #5 |

Revisitas não têm fatia própria: a regra já está na `main`. Confirmar leitura de IA não altera a impressão final, portanto não concede revisita; a fatia 2 cobre isso com teste.

## Sequência

### 0. Estabilizar o E2E

Mergear o PR #8.

**Aceite:** CI verde na `main`.

### 1. Corrigir regras do domínio

Vem antes da interface porque o ganho de um selo não é gravado: endurecer uma regra depois de exibir os selos faria selos visíveis sumirem.

| Item | Correção | Aceite |
|---|---|---|
| Método tradicional conta vinho não espumante | `isSparkling(e) && hasVinification('traditional')(e)` em `estilo.tradicional` | Ficha tranquila ou sem tipo com vinificação tradicional não conta |
| Grupos de aromas dependem de acento | Índice dobrado com `fold` em `aromaGroupOf` | Lista sem acento dá 18/18, como a acentuada |
| `skinContact` fora de `AI_FILLED_PATHS` | Incluir o caminho e conferir o rótulo em `TastingSheetDetails` | Estilo 'laranja' vindo da IA não ganha selo antes da revisão |
| Safra extrai ano de texto livre | Aceitar só texto que seja a safra inteira, com "Safra" opcional | 'Fundada em 1855' e 'Lote 2006' não contam; '1990' e 'Safra 1990' contam; caso ambíguo decidido em teste |

### 2. Confirmar leitura de IA

Traz `confirmAiFields`, `confirmAiReading`, o botão em `TastingSheetDetails` e `e2e/label-reading.spec.ts`. É independente das outras fatias.

**Aceite:** a confirmação troca `ai-unverified` por `user` só nos campos lidos; selos passam a contar esses campos; `legado.revisited` não muda; fichas de exemplo não são afetadas.

### 3. Infraestrutura de novidade

Traz `seenStampIds`, `preferences-writer.ts` e teste, `novelty.ts` e teste, `detail` no toast e `announceStamps`.

**Aceite:**

- `seenStampIds` sobrevive a exportar e importar backup;
- quem já tem selos não recebe todos como NOVO no primeiro acesso (semear na migração, decisão de produto abaixo);
- gravações simultâneas não se perdem;
- modo de exemplos nunca grava `seenStampIds`;
- selo ganho e não visto continua NOVO depois de recarregar a página antes de abrir o Passaporte. O #5 deixa isso em aberto.

### 4. Interface dos 233

Traz `view.ts`, `MilestonesSection.tsx` e as props de `App.tsx`. A integração em `PassportPage.tsx` é nova, sem copiar a versão do #5. Usa `evaluateStamps` com `source` e arte provisória.

**Aceite:**

- o livro de 3 folhas e os 11 selos com webp ficam iguais;
- os 11 ids legados continuam com o mesmo estado de ganho;
- pessoal e exemplos seguem separados, nos dois sentidos;
- selos `hidden` ficam mascarados até serem ganhos;
- abas e resumo cobrem os 233;
- E2E em desktop e celular, com modo escuro;
- avaliação em menos de 50 ms com 1000 fichas, com listas memoizadas.

### 5. Arte vetorial

Traz `MilestoneStamp.tsx`, `stamp-art/` e `styles/stamps.css`. Os 11 selos mantêm o webp.

**Aceite:** OK visual próprio, nos temas claro e escuro, com a convivência entre webp e SVG aprovada.

### 6. Exportação em PNG

Traz `scripts/render-stamps.mjs` e o manifest. Vem por último.

**Aceite:** sem manifest, a tela não mostra o botão de baixar e nada quebra; os PNGs (cerca de 230 MB no #5) ficam fora do repositório, com hospedagem definida antes do merge.

## Decisões de produto pendentes

1. Primeiro acesso depois da fatia 3: semear os selos já ganhos como vistos (recomendado) ou mostrar todos como NOVO.
2. Textos que o #5 muda: em `App.tsx`, "Feito para guardar, não para contar." vira "competir"; no Passaporte, saem "Sem metas, sem pressa, sem precisar ir a lugar nenhum.", "CONQUISTAS SEM CONTAGEM DE CONSUMO" e "Sem sequências diárias, ranking ou incentivo a beber mais". Recomendado manter os textos atuais até o OK.
3. "Primeira taça", "Mil taças" e os marcos de 250 a 1000 fichas contam fichas, mas os títulos falam em taças. O plano de 2026-10-10 pedia avaliar se fazem sentido.
4. "Meu vocabulário" e "Origem registrada" contam campos de IA por exceção deliberada; confirmar que continua valendo depois da fatia 2.

## Riscos

- Os selos não têm estado de ganho gravado: toda mudança de regra altera o que o usuário já viu.
- A evidência de E2E do #5 foi gerada fora do CI e sobre outra base; não vale para as fatias.
- A arte do #5 é provisória.
- `output/` não está no `.gitignore` e o teste do Passaporte grava capturas ali.
- A anotação do CI indica que `ubuntu-latest` migra para o Ubuntu 26 a partir de 2026-10-19. O Playwright 1.56.1 recusou o Chromium em Ubuntu 26.04 numa máquina local; o job atual usou a imagem 24.04.
