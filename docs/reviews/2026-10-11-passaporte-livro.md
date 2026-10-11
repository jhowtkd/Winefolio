# Revisão independente — Passaporte como livro, v3

Data: 2026-10-11. Revisor: Codex 2. Executor: Antigravity.

**Veredito vigente: v3 aprovado tecnicamente para revisão humana local.** P2 e P3 da v1 resolvidos e reproduzidos independentemente. Nenhum finding pendente identificado no escopo. Esta aprovação não representa aceitação visual humana, publicação ou uso de produção/provedores pagos. A revisão v1 abaixo permanece apenas como histórico; não houve veredito independente sobre v2.

## Rastreabilidade v3

- Snapshot aprovado: `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-passaporte-v3-XXXXXX.SaGqYx93Rn`.
- SHA-256 completo: `b9c9cc597126725a570f75413ee1cda08c4c3ff5b250c41fd9ae00b40dc0ebbe`, recalculado antes e depois da validação. Mesmo método da v1: todos os arquivos regulares ordenados pelo caminho relativo, concatenando caminho UTF-8 + NUL + conteúdo + NUL. Inclui as capturas congeladas e `.DS_Store`.
- Baseline: `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-caderno-inicial-5iarbn4b`; seus 165 arquivos conferem com o manifesto inicial. SHA-256 do manifesto: `9f62e33b7b3d5f30cf31cf8531c295a52398fdf3b921ad438c469475ff847337`.
- Cópia isolada executada: `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-passaporte-review-v3-jay00i9x`.
- Plano e relatório de execução lidos diretamente do v3; plano de home/caderno cancelado continua fora do escopo.

Os quatro hashes informados pelo executor foram conferidos:

| Arquivo | SHA-256 v3 |
| --- | --- |
| `src/features/passport/PassportPage.tsx` | `3645b6933ad7d1cdbec1c59ea07f42cc0729d58f10b7cdb3706f5f7282123e42` |
| `src/styles/prototype.css` | `8d58be8605e0263e526972290cce7057c7eaf75e12c3fe78ef98c58a7696ac72` |
| `e2e/journal.spec.ts` | `1d846b0762aaee5e0b7eb1679e4f02b511446969ea809b3c131f3cf2bf4320d3` |
| `docs/superpowers/plans/2026-10-11-passaporte-livro.md` | `3f1da0c3f8402fd6c3970b060beb5797d26e522c166ce1a39e182285c0cac226` |

## Resolução dos findings

| Finding histórico | Correção conferida no v3 | Check independente | Estado |
| --- | --- | --- | --- |
| P2 — foco perdido ao virar por seta | `src/features/passport/PassportPage.tsx:198` e `:206`: foco síncrono no contêiner estável antes de trocar a folha | A reprodução que falhava na v1 passou nos dois projetos; após ArrowRight a partir do selo, `.passport-book` permanece focado (`DIV`, dentro do livro) e ArrowLeft retorna sem refocar. E2E entregue também cobre carimbo de país e foco externo em `e2e/journal.spec.ts:126`/`:138`/`:148` | Resolvido |
| P3 — screenshot vazio antes de carregar | `e2e/journal.spec.ts:9`/`:12`/`:15`: espera do livro, seleção pessoal, zero origens/contador/indicador antes da captura; `:289`/`:292`: popup com `fullPage: false` | Cenário passou nos dois projetos; imagens congeladas pessoais vazias e popup mobile inspecionadas; capturas foram regeneradas novamente na cópia | Resolvido |

Nenhum novo finding P0/P1/P2/P3 identificado. Mantida a navegação por setas dentro do livro; nenhum listener global de teclado foi introduzido. A correção de foco só atua quando existe destino para a seta.

## Preservação e cobertura

- Comparação com a baseline: diferem somente PassportPage, CSS e o cenário inicial de journal.spec, além da linha autorizada no documento do plano de caderno cancelado. Novos documentos e capturas congeladas são artefatos da entrega, sem código adicional fora do escopo.
- App, Home/JournalPage, WineMemoryCard, JournalSidebar, helpers, backup, editor, header/rotas, modelos/repositórios, domínio/regras do passaporte e assets conferem com os hashes da baseline. Todos os cenários de home após o primeiro teste de passaporte em journal.spec permanecem idênticos à baseline.
- Comparação v1 → v3: CSS e plano do passaporte idênticos; no componente, somente as duas transferências de foco. Os demais deltas são regressões/capturas no teste inicial e documentos/evidências. Nenhuma implementação foi modificada pelo revisor.
- E2E entregue: vazio pessoal pronto, demo, segregação dos exemplos, contador pessoal, tipo IA não confirmado e duplicação, desbloqueio de seis selos pessoais, origens/conquistas, folha decorativa, limites, modo, hover/foco/Escape/toque/toque fora, fechamento do popup na virada e coordenadas do popup.
- Checks independentes repetidos no v3: 13 países pessoais em três folhas de origens, duas folhas de conquistas, até seis itens reais por folha, total cinco e última folha decorativa sem contagem; link de país retorna à home filtrada com uma ficha.
- Breakpoint 999 → 1000 → 999 px: folha móvel de índice ímpar permanece visível na abertura desktop; ao reduzir, preservada a primeira folha dessa abertura. Última folha também preservada. Limites e setas com foco no botão de modo externo conferidos.
- Movimento/texturas: animation-name `none` com `data-motion="reduce"` e com mídia reduced-motion; background-image `none` no livro/abertura com `body.flat`. Transição de 200 ms, abaixo de 220 ms, permanece igual à v1; não foi introduzido recorte de conteúdo.
- Guard temporal: a reprodução de resize 412 → 320 px, evento aos 50 ms com relógio simulado e espera explícita do evento de resize, passou em ambos os projetos; popup fechou. Não foi reproduzido overflow nesse caso. O guard não mudou desde v1 e não se afirma cobertura de todos os timings de scroll/resize.

## Execução independente v3

Porta exclusiva **56237**; servidor da cópia com `reuseExistingServer=false`. Contextos novos e IndexedDB de teste; chaves Gemini/Google vazias; API de análise bloqueada. Dependências e Chromium existentes reutilizados, sem instalação. Nenhum teste/build no checkout compartilhado, servidor 64827, produção ou banco do usuário.

Harness temporário: `/tmp/winefolio-passaporte-review-v3.playwright.config.mjs`, com cwd/testDir/outputDir na cópia, workers=1 e projetos Desktop Chrome/Pixel 7. Somente na cópia, ajustado BASE_URL de helpers à porta exclusiva e incluídos hooks de bloqueio da API. Os tipos React ancestrais foram preservados por referência aos tipos existentes em `/Users/jhonatan/node_modules/@types/react`, reproduzindo o lint real. Reprodução adicional reutilizada da revisão v1, com verificação explícita de foco no livro; preservada após execução em `/tmp/winefolio-passaporte-review-v3-focused.spec.ts`, fora da árvore do lint.

| Check | Resultado recolhido | Log |
| --- | --- | --- |
| `npm test` | exit 0; 146 passed, 43 suítes, 0 failed | `/tmp/winefolio-passaporte-review-v3-unit.log` |
| `npm run build` | exit 0; Vite e esbuild concluídos | `/tmp/winefolio-passaporte-review-v3-build.log` |
| `npm run lint` | exit 2; somente AppProvider.tsx:388 clearDraft e PaperDialog.tsx:50 ref, sem regressões | `/tmp/winefolio-passaporte-review-v3-lint.log` |
| Playwright entregue: journal + backup | 19 passed, 1 skipped, 0 failed nos dois projetos | `/tmp/winefolio-passaporte-review-v3-e2e.log` |
| Playwright independente: origens/breakpoint/preferências, foco e resize | 6 passed, 0 failed nos dois projetos | Mesmo log |
| Execução combinada dos E2E | exit 0; 25 passed, 1 skipped, 0 failed (1,6 min) | Mesmo log |

Comando E2E executado na cópia: `node_modules/.bin/playwright test --config /tmp/winefolio-passaporte-review-v3.playwright.config.mjs e2e/journal.spec.ts e2e/backup.spec.ts e2e/review-passaporte.spec.ts`. O único skip é o cenário de cabeçalho/fontes estreitas, condicionalmente ignorado no desktop; executado no celular.

## Evidência visual e limites da aprovação

Imagens congeladas estão em `<snapshot-v3>/output/playwright/passaporte-livro/`; as novas capturas da reprodução estão no mesmo caminho relativo da cópia isolada. Livro vazio desktop/celular conferido pronto e pessoal; popup mobile conferido na viewport. As imagens fullPage do livro servem para conteúdo, não para aferir posição de elementos fixed; para popup, usar a captura dedicada da viewport.

| Captura congelada | Dimensões em pixels | SHA-256 |
| --- | --- | --- |
| `passaporte-vazio-desktop.png` | 1376 × 1301 | `d16468a2c10c100a0e0afab8f9ddb6efc5d08ff7a602e136aca25157a60517ba` |
| `passaporte-vazio-mobile.png` | 1082 × 4001 | `64e9b7091b14d73d9dfbecf37b56bb216d1147cc92bade8b805b278aac05d410` |
| `passaporte-conquistas-popup.png` | 1280 × 720 | `83782561a6fe5b892ef843b51f986dcd2ddaac71a9444b440ccae2086d8d53a2` |
| `passaporte-conquistas-popup-mobile.png` | 1082 × 2202 | `f8d4457fd30da96ec73f9a997dd4fd851bab559b9d70192ddbfee2fcea9938fc` |

Manifesto das sete capturas de passaporte com dimensões/hashes: `/tmp/winefolio-passaporte-review-v3-captures.json`. Capturas não substituem a aprovação visual do usuário. Validação limitada a Chromium headless e Pixel 7 emulado; não executados Safari/Firefox, hardware físico ou provedor real. O lint continua com os dois erros conhecidos de baseline.

O único arquivo escrito pelo revisor no checkout compartilhado é este relatório. Nenhum commit/push/PR/deploy realizado. Resultado técnico v3 enviado ao executor e ao coordenador por `maestri ask --batch`, após `maestri list`. O coordenador confirmou recebimento; no executor a mensagem aparece enfileirada enquanto aguarda o término da revisão. A versão aprovada é estritamente o snapshot/hash acima.

---

# Histórico — revisão v1, substituída pelo veredito v3 acima

Data: 2026-10-11. Revisor: Codex 2. Executor: Antigravity.

**Veredito: solicitar correções e snapshot v2.** Há um P2 funcional de teclado e um P3 na evidência visual. Não há aprovação técnica da v1 nem aceitação visual humana/publicação. O plano de paginação da home foi cancelado e não integra esta revisão.

## Versão e rastreabilidade

- Plano: `docs/superpowers/plans/2026-10-11-passaporte-livro.md` do snapshot submetido.
- Baseline: `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-caderno-inicial-5iarbn4b`.
- Snapshot v1: `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-passaporte-v1-XXXXXX.66BMN7zJZZ`.
- Cópia de validação: `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-passaporte-review-v1-hp3rpnw0`.
- SHA-256 do snapshot v1: `34e7a7ba0138d11f6c0897e0d6f992a30514e53b0038727f7f89c6ffac279aeb`. Método: todos os arquivos regulares, ordenados pelo caminho relativo; concatenar caminho UTF-8, NUL, bytes do arquivo e NUL; inclui metadados como `.DS_Store`. Recalculado ao concluir os checks, sem alteração.
- SHA-256 do manifesto inicial: `9f62e33b7b3d5f30cf31cf8531c295a52398fdf3b921ad438c469475ff847337`.

Hashes dos arquivos do incremento:

| Arquivo | SHA-256 v1 |
| --- | --- |
| `src/features/passport/PassportPage.tsx` | `2ddb95d3cc8addd99fc54bf463a9cbcf1edc09f22ec8f311079f10568d9fc320` |
| `src/styles/prototype.css` | `8d58be8605e0263e526972290cce7057c7eaf75e12c3fe78ef98c58a7696ac72` |
| `e2e/journal.spec.ts` | `9369c54fa15019b9850e65dc83fa3d461b8eb0997b303c0ce1f26dcdacd627a0` |
| Plano do passaporte | `3f1da0c3f8402fd6c3970b060beb5797d26e522c166ce1a39e182285c0cac226` |

## Findings por severidade

### P2 — Perda de foco interrompe a navegação por setas

**Arquivo:linha:** `src/features/passport/PassportPage.tsx:202` (também retorno em `:197`; folhas substituídas por chave em `:229`/`:275`).

**Cenário:** focar um selo da primeira folha de conquistas e pressionar ArrowRight. A virada remove a folha que contém o botão focado. O foco cai no `BODY`, fora do livro. ArrowLeft em seguida não retorna: o indicador permanece `Página 3 de 3`. O handler está no livro e exige foco interno, portanto não recebe a próxima tecla.

**Impacto:** a navegação por teclado funciona somente até a primeira virada quando iniciada em um controle da folha. A pessoa precisa reencontrar o livro por Tab. Reproduzido em Desktop Chrome e Pixel 7; `document.activeElement.tagName === 'BODY'` e `book.contains(document.activeElement) === false` após a virada.

**Correção:** preservar foco no contêiner estável do livro ao executar uma virada pelo teclado que removerá o controle focado, antes/depois da atualização conforme necessário. Manter a restrição de setas ao livro e não capturar teclas globalmente nem deslocar foco em cliques externos.

**Check:** com foco em selo e em carimbo de país, executar sequências ArrowRight/ArrowLeft em desktop e celular sem refocar manualmente; cada tecla deve alterar a página quando houver destino, e o foco deve permanecer dentro do livro. Setas com foco no seletor de modo/header/body devem continuar sem folhear.

**Evidência:** `/tmp/winefolio-passaporte-review-v1-focused.log`; reprodução preservada em `/tmp/winefolio-passaporte-review-v1-focused.spec.ts`. Duas falhas comportamentais, uma por projeto. O cenário entregue foca diretamente `.passport-book`, que não é removido, e por isso não cobre este caso.

### P3 — Captura intitulada “livro vazio” registra carregamento

**Arquivo:linha:** `e2e/journal.spec.ts:12` e `:14`.

**Cenário:** o screenshot é tirado imediatamente após `goto`, antes de aguardar o Passport e selecionar explicitamente Minhas anotações. Na reprodução desktop, `passaporte-vazio-desktop.png` contém apenas o shell e `ABRINDO A PÁGINA...`, sem o livro. Mesmo quando o componente já carregou, o modo inicial pode ser demo; o nome do arquivo não comprova estado pessoal vazio.

**Impacto:** a evidência descrita no relatório de execução não demonstra o aceite de livro vazio e não serve como captura final para avaliação humana.

**Correção:** aguardar o indicador/livro pronto, selecionar Minhas anotações, verificar contador `00` e texto de zero origens, então capturar desktop/celular. Para popup fixed no celular, usar screenshot da viewport; fullPage pode representar sua posição de forma enganosa.

**Check:** conferir que as imagens regeneradas mostram a folha pessoal vazia pronta; a imagem do popup deve corresponder à viewport e às mesmas coordenadas verificadas por boundingBox. O revisor gerou capturas pessoais vazias adicionais após estas esperas, mas isso não corrige o cenário entregue.

**Evidência:** imagem reproduzida em `<cópia>/output/playwright/passaporte-livro/passaporte-vazio-desktop.png`; capturas adicionais válidas em `<cópia>/review-evidence/empty-desktop.png` e `empty-mobile.png`.

Nenhum finding P0/P1 identificado. Os dois erros conhecidos de lint não são findings deste incremento.

## Preservação e aceites conferidos

Comparados os 165 arquivos do `initial-manifest.json`. Apenas três arquivos de implementação/teste diferem: PassportPage, CSS e journal.spec. Há também o delta autorizado do documento do plano de caderno cancelado; o novo plano e relatório de execução são documentos adicionais. Nenhuma dessas exceções reativa o escopo cancelado.

- Home, App, JournalPage, WineMemoryCard, JournalSidebar, helpers e backup idênticos à baseline. O trecho de journal.spec a partir de `test('registra, favorita, busca e edita uma ficha'` é idêntico; SHA-256 desse trecho: `ac6095d2047e53ab3967506a91180ded40b3f826c25735285d7e65da87cb5001`.
- Domínio/regras do passaporte, modelos, repositórios, editor, assets, header e rotas preservados pelos hashes. O delta de CSS está no bloco de passaporte; os seletores adicionados têm uso somente no Passport na árvore atual.
- Estado vazio, modos mine/demo, retorno à primeira folha, segregação de exemplos, IA não verificada/duplicação, estatística e desbloqueio pessoal exercitados pelos E2E entregues.
- Reprodução adicional com 13 países pessoais: todas as origens aparecem uma vez em 3 folhas; conquistas em 2 folhas; até 6 itens reais por folha; total 5; última abertura desktop decorativa sem aumentar a numeração; limites desabilitados; link de país retorna à home com uma ficha filtrada.
- Breakpoint: última folha continua visível ao reduzir; folha móvel 2 fica visível na abertura desktop 1–2 e, ao voltar, permanece visível a primeira folha dessa abertura. Setas fora do livro não folheiam; com foco no contêiner folheiam.
- CSS: transição 200 ms; `data-motion="reduce"` e `prefers-reduced-motion: reduce` resultam em `animation-name: none`; `body.flat` remove background-image do livro e abertura. Altura flexível e selos sem recorte por paginação conferidos na implementação.
- Hover/foco/Escape/toque/toque fora, limites do popup e fechamento na virada exercitados nos E2E desktop/Pixel 7.
- Guard temporal global de 150 ms examinado. Reprodução específica: abrir popup com largura 412, redimensionar para 320 ainda no mesmo breakpoint, relógio simulado para evento 50 ms após abertura, esperar o evento real de resize e restaurar o relógio. O popup fechou nos dois projetos. Não houve overflow reproduzido nesse cenário; isto não prova todos os timings/combinações de scroll e resize.

## Checks independentes e isolamento

Somente a cópia indicada foi executada. Porta exclusiva `56227`, Chromium headless já instalado, contextos novos de IndexedDB, Gemini/Google vazios e API de análise de rótulo bloqueada. Nenhum teste/build no checkout compartilhado nem no servidor visual `64827`. Nenhum navegador/dependência instalado, provider pago, banco do usuário, commit/push/PR/deploy.

Config temporária: `/tmp/winefolio-passaporte-review-v1.playwright.config.mjs`. Ela mantém projetos Desktop Chrome/Pixel 7, usa workers=1, `webServer.cwd` da cópia e `reuseExistingServer=false`. Harness somente da cópia: BASE_URL do helper aponta para a porta exclusiva; hooks bloqueiam a API; reprodução adicional foi escrita na cópia e depois preservada fora da árvore para não contaminar o lint. Nenhuma implementação foi corrigida pelo revisor.

| Comando/check | Resultado | Evidência |
| --- | --- | --- |
| `npm test` | exit 0; 146 passed, 43 suítes, 0 failed | `/tmp/winefolio-passaporte-review-v1-unit.log` |
| `npm run build` | exit 0; Vite e esbuild concluídos | `/tmp/winefolio-passaporte-review-v1-build.log` |
| `npm run lint` com React types existentes da hierarquia ancestral | exit 2; somente AppProvider.tsx:388 clearDraft e PaperDialog.tsx:50 ref | `/tmp/winefolio-passaporte-review-v1-lint-ancestral.log` |
| `playwright test --config /tmp/winefolio-passaporte-review-v1.playwright.config.mjs e2e/journal.spec.ts e2e/backup.spec.ts` | exit 0; 19 passed, 1 skipped, 0 failed | `/tmp/winefolio-passaporte-review-v1-e2e.log` |
| Reprodução adicional de aceites e foco, 6 casos | 4 passed, 2 failed; ambas as falhas são P2 acima | `/tmp/winefolio-passaporte-review-v1-focused.log` |
| Resize temporal, após aguardar explicitamente o evento | exit 0; 2 passed | `/tmp/winefolio-passaporte-review-v1-resize.log` |

React types: a cópia em `/var/folders` não herda `/Users/jhonatan/node_modules/@types/react`; sem essa resolução surge diagnóstico artificial no Passport. Para reproduzir o ambiente real, apontado somente o `node_modules/@types/react` da cópia aos tipos existentes e executado novamente `npm run lint`, sem instalar pacotes. Os resultados finais são os dois erros de baseline, não lint limpo.

## Encaminhamento e limites

Solicitar ao Antigravity correção do P2 e regeneração das evidências P3, mantendo ownership e preservação da home. Entregar novo snapshot imutável v2 para review/fix/review. A v1 permanece pendente de correções.

Validação local Chromium headless em Desktop Chrome/Pixel 7 emulado; não houve hardware Pixel físico, Safari/Firefox, provedor real ou aprovação visual humana. A única escrita do revisor no checkout compartilhado é este relatório. O transporte da conversa falhou anteriormente; os processos isolados concluídos foram recolhidos, sem reiniciar unit/build/E2E concluídos.

Comunicação: findings enviados ao Antigravity por `maestri ask`; `maestri check` confirmou a mensagem no terminal dele e a leitura deste relatório. O envio ao Codex coordenador retornou erro WebSocket 400 (`Responses WebSocket messages must have type response.create`), impedindo confirmar sua resposta. O relatório e a revisão v1 estão concluídos; a nova revisão depende da entrega congelada v2.
