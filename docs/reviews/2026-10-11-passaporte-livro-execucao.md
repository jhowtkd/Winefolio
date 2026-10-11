# Relatório de Execução — Passaporte como Livro

**Data:** 2026-10-11  
**Executor:** Antigravity  
**Plano de Referência:** `docs/superpowers/plans/2026-10-11-passaporte-livro.md`  
**Baseline Imutável:** `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-caderno-inicial-5iarbn4b`  
**Snapshot v1:** `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-passaporte-v1-XXXXXX.66BMN7zJZZ`  
**Snapshot v2 (Capturas):** `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-passaporte-v2-XXXXXX.pR0OLZYba9`  
**Snapshot v3 para Nova Revisão (P2 + P3 Resolvidos):** `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-passaporte-v3-XXXXXX.SaGqYx93Rn`

---

## 1. Escopo Implementado

Conforme a correção de escopo autorizada pelo usuário e detalhada no plano:

1. **Aparência de Livro Aberto Folheável**:
   - Layout do passaporte restaurado para o formato de livro aberto com folhas, textura sutil de papel, sombra de vinco central e margens cuidadas.
   - Padrão responsivo: **duas folhas por abertura** em viewports $\ge 1000\text{px}$; **uma folha** abaixo de $1000\text{px}$.
   - Transição suave de virada de página $\le 220\text{ms}$ (`book-page-turn 200ms cubic-bezier(.2,0,0,1)`), respeitando `prefers-reduced-motion` e `data-motion="reduce"`.
   - Remoção de texturas respeitada com `body.flat`.

2. **Organização das Folhas**:
   - **Folhas de Origens**: vêm primeiro, contendo até 6 carimbos por folha. Sempre existe pelo menos uma folha de origens com estados vazios/espaços para descobertas futuras.
   - **Folhas de Conquistas**: vêm após as origens, com até 6 selos por folha (para os 11 selos existentes, são exatamente 2 folhas: marcos 0..5 na primeira e 6..10 na segunda).
   - **Última Abertura Ímpar no Desktop**: quando o número total de folhas de conteúdo é ímpar, a folha direita da última abertura exibe uma página decorativa (*Novos capítulos / Páginas reservadas para futuras origens...*), sem incrementar o total de páginas da numeração.

3. **Navegação e Controles**:
   - Botões acessíveis `"Página anterior"` e `"Próxima página"`, com desabilitação automática nos limites.
   - Indicador textual de posição: `"Páginas 1–2 de N"` / `"Página 1 de N"`.
   - Navegação por teclado (`ArrowLeft` e `ArrowRight`) restrita estritamente ao foco dentro do container do livro (`.passport-book`).
   - Alternância entre `"Minhas anotações"` e `"Ver exemplo"` reinicia a navegação na primeira folha (folha 0) e fecha quaisquer pop-ups abertos.
   - Redimensionamento de janela (mudança de breakpoint) preserva a primeira folha da abertura atual.

4. **Preservação de Conquistas, Pop-ups e Interações**:
   - Selos soltos mantidos em grade nas folhas, com visual bloqueado apagado/grayscale (`.journey-item.locked`).
   - Pop-ups descritivos HTML5 nativos (`popover="auto"`) com posicionamento adaptativo dentro da viewport em hover, foco e toque.
   - Fechamento imediato de pop-ups ao virar a página ou trocar de modo.
   - Links nos carimbos de países preservados para filtrar o caderno na home (`onOpenCountry`).
   - Contador de conquistas (`pad(earnedCount)`), cartões de reflexão e notas de exemplo mantidos no rodapé fora do livro.

---

## 2. Ownership e Preservação Estrita

- **Arquivos modificados sob ownership exclusiva**:
  - `src/features/passport/PassportPage.tsx`: implementação completa das folhas, controles de página e fechamento de pop-ups.
  - `src/styles/prototype.css`: estilos estritamente escopados ao passaporte (`.passport-book`, `.book-spread`, `.book-page`, `.passport-pagination`, `.journey-item`, `.journey-tooltip`, etc.).
  - `e2e/journal.spec.ts`: apenas o primeiro cenário (`test('o passaporte libera os selos das anotações e mantém os exemplos separados')`), adaptado para revelar folhas e testar navegação de livro sem enfraquecer nenhuma checagem prévia.
- **Arquivos intocados e preservados idênticos ao baseline**:
  - `src/App.tsx`: 0 diff contra baseline `winefolio-caderno-inicial-5iarbn4b`.
  - `src/features/journal/JournalPage.tsx`: 0 diff contra baseline.
  - `src/features/entry/EntryEditorPage.tsx`: 0 diff contra baseline.
  - `src/repositories/wine-repository.ts`: 0 diff contra baseline.
  - `e2e/helpers.ts` e `e2e/backup.spec.ts`: 0 diff contra baseline.
  - Cenários de home em `e2e/journal.spec.ts` (linhas 278+): 0 diff contra baseline.
  - Nenhum modelo de banco, rota, dependência externa ou infraestrutura adicionada.

---

## 3. Resolução dos Findings da Revisão Independente v1 (Codex 2)

Na auditoria formal documentada em `docs/reviews/2026-10-11-passaporte-livro.md`, dois apontamentos foram feitos:

### P2 — Perda de foco interrompe navegação por setas (Resolvido)
- **Causa raiz:** Ao focar um selo ou carimbo de país dentro de uma folha e pressionar `ArrowRight`, a virada de página desmontava a folha anterior com o elemento focado, fazendo o foco do navegador recair sobre o `BODY` e interrompendo o ciclo para o próximo `ArrowLeft`.
- **Correção em `src/features/passport/PassportPage.tsx`:** No manipulador `handleKeyDown`, caso `document.activeElement !== bookRef.current`, o foco é transferido de forma síncrona e estável para `bookRef.current?.focus()` antes de executar a virada de página (`goToNext()` / `goToPrev()`).
- **Validação de Regressão em `e2e/journal.spec.ts`:**
  1. Foco em selo de conquista $\rightarrow$ `ArrowRight` $\rightarrow$ `ArrowLeft` consecutivo sem intervenção manual de foco.
  2. Foco em carimbo de país (`.country-stamp`) $\rightarrow$ `ArrowRight` $\rightarrow$ `ArrowLeft` consecutivo sem intervenção manual de foco.
  3. Setas pressionadas com foco fora do livro (ex.: no `#passport-title`) comprovadamente não folheiam a página.

### P3 — Captura de Livro Vazio e Popups Fixed (Resolvido)
- **Causa raiz:** A captura inicial do estado vazio era efetuada antes da estabilização assíncrona do componente e sem alternar explicitamente para o modo pessoal `"Minhas anotações"`, exibindo a tela de carregamento ou o modo demo. Além disso, `fullPage: true` para popovers com `position: fixed` no celular poderia deslocá-los artificialmente.
- **Correção em `e2e/journal.spec.ts`:**
  1. Aguarda explicitamente o livro pronto (`expect('.passport-book').toBeVisible()`).
  2. Clica em `"Minhas anotações"`.
  3. Assegura contador `00`, indicador de páginas e a confirmação textual `"0 origens registradas nas suas próprias anotações."` antes da captura.
  4. Captura do livro vazio pessoal realizada com visão completa (`fullPage: true, animations: 'disabled'`).
  5. Popovers fixos capturados via viewport (`fullPage: false`), registrando exatamente a posição visual calculada e testada pelo `boundingBox`.

---

## 4. Resultados das Validações Técnicas

1. **Testes Unitários (`npm test`)**:
   - `146 passed`, 0 failed em 43 suítes de teste.
2. **Tipagem e Lint (`npm run lint`)**:
   - `tsc --noEmit`: apenas os 2 erros pré-existentes do baseline (`AppProvider.tsx:388` e `PaperDialog.tsx:50`). Zero erros nos arquivos de passaporte.
3. **Build de Produção (`npm run build`)**:
   - Vite + esbuild concluídos com sucesso, gerando `dist/` e `dist/server.cjs`.
4. **Testes E2E (Playwright - Desktop Chrome e Mobile Pixel 7 na porta 3000 isolada)**:
   - `e2e/journal.spec.ts` e `e2e/backup.spec.ts`: **19 passed**, 1 skipped (skip condicional do projeto desktop), 0 failed.

---

## 5. Rastreabilidade e Hashes do Snapshot v3

Snapshot v3: `/var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-passaporte-v3-XXXXXX.SaGqYx93Rn`

| Arquivo | SHA-256 v3 |
| --- | --- |
| `src/features/passport/PassportPage.tsx` | `3645b6933ad7d1cdbec1c59ea07f42cc0729d58f10b7cdb3706f5f7282123e42` |
| `src/styles/prototype.css` | `8d58be8605e0263e526972290cce7057c7eaf75e12c3fe78ef98c58a7696ac72` |
| `e2e/journal.spec.ts` | `1d846b0762aaee5e0b7eb1679e4f02b511446969ea809b3c131f3cf2bf4320d3` |
| `docs/superpowers/plans/2026-10-11-passaporte-livro.md` | `3f1da0c3f8402fd6c3970b060beb5797d26e522c166ce1a39e182285c0cac226` |
