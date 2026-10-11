# Gamificação do Winefolio — plano de execução

## Objetivo e estado inicial

Ampliar o Passaporte com os selos já produzidos, derivados das fichas locais. Preservar a proposta do app: observar, registrar e revisitar, sem metas de consumo, sequências diárias ou ranking.

O primeiro pacote está no checkout local, ainda sem commit: quatro selos `legado.*`, regras em `src/domain/passport.ts`, integração no Passaporte, separação de exemplos e gravação de `evidence.revisitedAt` ao alterar uma impressão final existente. Esse trabalho pertence ao usuário: preservar e incorporar, nunca resetar ou substituir pelo HEAD.

Evidência inicial: 142 testes passaram; build e cenário de Passaporte em desktop/celular passaram com Chromium local. `npm run lint` já falha em `AppProvider.tsx:388` (falta `clearDraft`) e `PaperDialog.tsx:50` (`ref` em `PaperSurface`). São falhas anteriores, não autorização para refatorar esses componentes.

Fontes disponíveis:

- Catálogo de 233 selos: `/Users/jhonatan/Documents/Codex/2026-10-07/pr/outputs/selos-v03/catalogo.json`.
- Imagens WebP de 320 px: `/Users/jhonatan/selos-tool/saida/<id>-320.webp`.
- Código e documentação: `/Users/jhonatan/Repos/Winefolio`.

## Papéis e propriedade

- **Antigravity — implementação:** dono das mudanças de domínio, Passaporte, imagens e testes desta etapa; também das correções pedidas pela revisão dentro desse escopo.
- **Codex 2 — revisão independente:** ler plano, snapshots e evidências; não editar código, testes, imagens ou configurações. Pode escrever somente o relatório da revisão em `docs/reviews/2026-10-10-gamificacao.md`.
- **Codex/Maestro — coordenação:** plano, contexto inicial e acompanhamento. Não implementar em paralelo nos arquivos do Antigravity.

Não estão sozinhos no checkout. Preservar trabalho preexistente e mudanças de terceiros. Sem commit, push, PR, deploy, mensagens externas, chamadas pagas, novas dependências, migração ou novo formato de armazenamento. A comunicação entre estes terminais está autorizada pelo usuário.

## Etapa executável agora — sete novos selos

Estas são as regras deste primeiro incremento; não representam regras anteriores recuperadas da thread de geração.

| ID | Título do catálogo | Critério em uma ficha elegível |
| --- | --- | --- |
| `estilo.primeiro-espumante` | Primeiras bolhas | `tipo === 'espumante'` |
| `estilo.laranja` | Pele e alma | `estilo === 'branco'` e `skinContact === true` |
| `estilo.fortificado` | Espírito fortificado | `tipo === 'fortificado'` |
| `harmonizacao.1` | À mesa | `conclusao.harmonizacao.trim()` não vazio |
| `critica.primeira-nota` | Primeira opinião | `conclusao.avaliacaoEstrelas` válida entre 1 e 5 |
| `critica.cinco` | Amor à primeira taça | `conclusao.avaliacaoEstrelas === 5` |
| `critica.asi-1` | Olhar técnico | `conclusao.asiQuality` é uma opção existente de `ASI_QUALITY` |

Ficha elegível: excluir `kind === 'demo'` e `_demo === true` da coleção pessoal. Para os novos selos, campos necessários marcados como `ai-unverified` não contam até a pessoa realmente alterá-los; usar a proveniência existente. Em "Ver exemplo", apenas fichas demo podem ilustrar os selos; nunca misturar fichas pessoais. Preservar os critérios dos quatro selos existentes.

1. Ler os arquivos e todos os callers antes de editar. Reusar `passportProgress`, vocabulário ASI, componentes e testes existentes; manter uma única implementação de cada regra.
2. Incorporar os sete IDs e títulos sem gerar imagens. Copiar somente os sete WebP de 320 px para `public/assets/winefolio/stamps/<id>.webp`; preservar os quatro já integrados.
3. Mostrar os onze selos no Passaporte com título, critério legível e estado conquistado/pendente. Reusar o layout atual; pequenos agrupamentos só se necessários para legibilidade. Manter imagens decorativas com texto acessível equivalente, carregamento sob demanda e boa leitura no celular.
4. Calcular conquistas a partir das fichas atuais: editar/remover uma ficha atualiza a coleção; recarregar restaura o resultado. Não criar XP, persistência paralela de conquistas ou datas inventadas. A revisita mantém sua evidência já armazenada.
5. Testar critérios isolados e combinados, campos vazios/inválidos, proveniência não confirmada, demos pelos dois marcadores, remoção/edição e existência das onze imagens. Atualizar o cenário E2E existente e acrescentar somente o necessário para cobrir os novos selos.
6. Executar `npm test`, `npm run lint`, build e E2E focado em Passaporte, desktop e celular, sem Gemini. Reportar falhas de baseline separadamente; corrigir todas as regressões deste incremento.

### Ambiente de validação local

Node/npm estão atualmente no PATH; dependências instaladas com `npx --yes bun install --frozen-lockfile`. Não alterar `package.json` nem `bun.lock`. Ler `.agents/skills/testing-winefolio/SKILL.md`, mas verificar suas suposições de ambiente antes de usar.

A instalação do Chromium esperado pelo Playwright ficou incompleta. O Chromium já disponível é `/Users/jhonatan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`. O comando local já validado é `node_modules/.bin/playwright test --config /tmp/winefolio-playwright.config.mjs --grep 'passaporte libera'`. A configuração temporária aponta ao projeto e substitui apenas o executável; inspecioná-la antes de usar. Esse resultado é local, não CI. Não interromper nem reutilizar um servidor alheio na porta 3000.

### Aceite da etapa

- Onze selos com IDs únicos, títulos do catálogo e imagens existentes.
- Os quatro comportamentos anteriores preservados, incluindo revisão de impressão final.
- Sete regras novas funcionando sem recompensar demos ou sugestões de IA não confirmadas na coleção pessoal.
- Nenhuma ficha, foto, preferência ou backup perdido; nenhum schema novo.
- Testes relevantes passam; lint não ganha erros além dos dois já conhecidos.
- Capturas finais desktop/celular e relatório com comandos, resultados e limitações.
- Codex 2 revisa a entrega congelada; Antigravity corrige findings dentro do escopo e envia nova versão para revisão.

## Roteiro do restante do catálogo

Após esta etapa restam 222 selos. Inventariar por família e registrar critérios necessários, sem ativá-los por heurística:

1. **Uvas e regiões:** definir o que conta como registro distinto, normalização/aliases, tratamento de cortes e os limiares dos níveis 1/2/3. Região textual livre não basta para inferir uma origem sem ambiguidade.
2. **Países e diversidade:** definir o universo de países, Velho/Novo Mundo e a semântica de "Orgulho nacional". Priorizar diversidade documentada sem inferir nacionalidade ou viagem.
3. **Volume e recorrência:** decidir se devem existir e como evitar incentivo a consumir mais; contar taças ou presumir consumo a partir de fichas não está autorizado.
4. **Estilos avançados, técnica, crítica, harmonização e secretos:** definir completude da grade, combinações, histórico necessário e tratamento de dados legados. Não inventar evidência que o modelo de dados não tem.

Antigravity deve entregar uma lista curta dessas decisões em `docs/superpowers/plans/2026-10-10-gamificacao-pendencias.md`, ancorada nos IDs do catálogo. Esta etapa não autoriza implementação dos 222 selos nem alteração de schema. O próximo incremento depende dessas decisões.

## Entrega e revisão

Capturar o estado inicial em um snapshot externo ao checkout antes de delegar. Ao concluir cada versão, Antigravity deve congelar os arquivos rastreados e não ignorados, incluindo os novos, em uma pasta temporária diferente; excluir `.git`, `node_modules`, builds e caches. Não editar o snapshot após o envio. Incluir evidências dos checks e paths das capturas.

O Codex 2 compara o snapshot final com o inicial, lê também o primeiro pacote preservado e emite findings por severidade com arquivo:linha, cenário, correção sugerida e verificação. Não revisar um diff que continua mudando. Sem bloqueadores, emitir "aprovado para revisão humana local"; isso não autoriza publicação.

Ambos devem rodar `maestri list` para usar os nomes reais. Antigravity avisa Codex 2 quando a versão está congelada; Codex 2 devolve os findings; Antigravity corrige e envia novo snapshot. Reportar ao Maestro quando o trabalho e a revisão terminarem, sem esperar autorização para corrigir regressões dentro do plano.
