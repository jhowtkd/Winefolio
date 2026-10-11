# Passaporte como livro — escopo corrigido pelo usuário

O usuário esclareceu em 2026-10-11: o livro/páginas são principalmente o PASSAPORTE; a home deve permanecer como antes. Este plano substitui o caderno paginado, que foi cancelado. Alterações locais autorizadas; sem commit/push/PR/deploy/produção/provedores pagos.

## Resultado

- Restaurar a aparência de livro aberto do passaporte (papel, folhas, dobra central, margens, leve sombra), mantendo os selos soltos, os bloqueados apagados e os descritivos em pop-up por hover/foco/toque.
- Páginas folheáveis é o padrão recomendado informado ao usuário; eventual resposta à pergunta de preferência prevalece. Sem capa, 3D, arrastar folhas ou novas dependências.
- Duas folhas por abertura a partir de 1000 px; uma folha abaixo disso. Botões “Página anterior” e “Próxima página”, posição “Páginas 1–2 de N”/“Página 1 de N”, e transição leve de até 220 ms respeitando redução de movimento e texturas existentes.
- Origens vêm primeiro, em folhas com até 6 carimbos. Sempre existe ao menos uma folha de origens, incluindo seu estado vazio. Conquistas vêm depois, em folhas com até 6 selos (11 selos existentes, portanto 2 folhas). Ordem dos países e dos selos permanece atual; numeração é somente da apresentação.
- Na última abertura ímpar, a folha direita é decorativa e não aumenta o total. Não esconder/truncar textos ou carimbos; altura pode crescer se necessário.
- Minhas anotações/Ver exemplo preservam regras existentes e voltam à primeira abertura ao alternar. Mudar breakpoint mantém visível a primeira folha da abertura atual. Setas do teclado apenas com foco dentro do livro, sem interferir em outras áreas. Limites desabilitam botões.
- Fechar qualquer pop-up ao virar página ou alternar modo. Pop-ups continuam legíveis e dentro da viewport, inclusive no celular. Manter links de país para filtrar a home, estatística de conquistas e mensagens que distinguem dados fictícios.

## Ownership e preservação

- Antigravity: somente src/features/passport/PassportPage.tsx, estilos exclusivos de passaporte em src/styles/prototype.css e adaptações/testes pertinentes do cenário inicial de passaporte em e2e/journal.spec.ts. Relatório próprio docs/reviews/2026-10-11-passaporte-livro-execucao.md.
- Codex 2: revisão independente em snapshot/cópia isolada com porta exclusiva. Nenhuma edição de código/testes/assets; único relatório autorizado docs/reviews/2026-10-11-passaporte-livro.md.
- Codex: coordenação, baseline e capturas finais. Não estão sozinhos no checkout, não revertam WIP alheio.
- A home, App, JournalPage, WineMemoryCard, JournalSidebar, helpers e backup já foram restaurados EXATAMENTE a /var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-caderno-inicial-5iarbn4b. Devem continuar idênticos a esse snapshot. Apenas o cenário de passaporte de journal.spec.ts poderá diferir; os cenários de home devem permanecer intactos.
- Não alterar banco/modelos/repositórios, regras de conquistas, catálogo, assets, editor/ficha, header ou navegação. Usar CSS com escopo de passaporte; não alterar seletor global compartilhado para atingir o livro.
- Aparência de livro anterior pode ser consultada (read-only) no snapshot aprovado antigo /var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-gamificacao-v2-XXXXXX.LvgPkvXY0t; não restaurar esse arquivo inteiro sobre os ajustes de pop-up mais recentes.

## Verificação e ciclo

- Preservar baseline atual dos selos soltos/pop-ups, restaurar a home, implementar apenas o passaporte e validar: livro vazio, exemplos, anotações pessoais, mais de 6 países/selos, última abertura ímpar, limites, modo, breakpoint, teclado, hover/foco/Escape/toque/toque fora, popup durante virada, links de países e movimento/texturas.
- Adaptar o E2E de passaporte para revelar a folha antes de conferir os selos; manter a regressão de proveniência IA/duplicação e isolamento dos exemplos. Não enfraquecer verificações anteriores.
- npm test, npm run build, npm run lint e E2E relevantes de passaporte/home/backup desktop+Pixel7 em porta exclusiva. Baseline lint AppProvider.tsx:388 clearDraft e PaperDialog.tsx:50 ref; não corrigir fora do escopo nem apresentar como regressão.
- Não instalar browsers/dependências. Chromium existente: /Users/jhonatan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell. Config temporária fora do repo deve definir webServer.cwd corretamente para a cópia validada. Chaves Gemini/Google vazias; APIs mockadas/bloqueadas. Não interromper nosso servidor visual64827 nem servidores de terceiros.
- Após checks, Antigravity cria snapshot v1 imutável relevante sem .git/node_modules/dist/output/test-results e pede review a Codex 2 via maestri ask. Corrigir e reenviar v2 quando necessário até aprovação técnica. Não terminar ao apenas lançar uma tarefa de fundo: recolher resultados, executar revisão/correções e relatar a versão final aprovada ao Codex.
- Revisor comprova home idêntica à baseline, regras/assets/WIP preservados, checks reproduzidos e versão/hash aprovada. Nenhuma autorização de publicação ou aprovação visual humana é inferida.
- Capturas desktop/celular, folha de conquistas com pop-up e livro vazio em output/playwright/passaporte-livro/. Apresentar ao usuário no fim para aprovação visual.
