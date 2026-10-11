# Winefolio — caderno paginado

**CANCELADO/SUBSTITUÍDO por correção explícita do usuário em 2026-10-11:** o livro deve ser principalmente o passaporte; a home deve permanecer como antes. Não executar este plano. As alterações de home foram copiadas para /var/folders/95/s9tsrvnx7x7dp9t149ty6y980000gn/T/winefolio-home-descartada-0e_9tnon e os arquivos restaurados a winefolio-caderno-inicial-5iarbn4b, preservando o WIP anterior. Este documento permanece somente como histórico.

Plano aprovado pelo usuário em 2026-10-11; implementação local autorizada. Sem commit, push, PR, deploy, produção ou chamadas a provedores de IA.

## Experiência

- Somente o caderno principal. Abre nas anotações, sem capa: um vinho por página, duas páginas lado a lado a partir de 1000 px, uma abaixo disso.
- Substituir cartões por páginas (opção padrão “Ver páginas”), preservar a tabela existente. Não manter a grade antiga em paralelo.
- Papel, margem, numeração, dobra central e sombras discretas; cabeçalho compacto, link para o passaporte e notas laterais abaixo do caderno para liberar largura.
- Cada página mostra foto/ilustração existente, vinho, produtor, safra, origem, data, estrelas, favorito e impressão pessoal. Notas longas ampliam a altura sem truncamento. “Abrir ficha” continua abrindo o detalhe atual.
- Última abertura ímpar: folha complementar “Anotar outra descoberta”, sem contá-la como registro. Zero registros: estado vazio atual dentro do caderno, sem paginação fictícia.
- “Página anterior”, “Próxima página”, posição e índice recolhível. Índice lista todos os resultados filtrados com nome e número; selecionar fecha o índice, abre a página e foca nela. A numeração corresponde à ordenação atual, sem persistência.
- Transição leve de até 220 ms, sem simulação 3D nem gesto de arrastar; respeitar preferências existentes de movimento reduzido e texturas. Conteúdo visível permanece acessível durante a transição.

## Comportamento

- Reutilizar filtragem/ordenação, fotos (incluindo limpeza de object URLs), ilustrações e callbacks atuais. Refatorar a apresentação dos cartões e remover estilos/código que ficarem sem consumidores, sem tocar em estilos usados por outras telas.
- Paginação apenas em estado da interface. Sem mudança de banco, backup, rotas, modelos de dados, dependências ou infraestrutura de testes.
- Busca, filtros, ordenação e alternância dos exemplos voltam à primeira página. Atualização de um registro mantém a posição quando possível; exclusão ajusta a posição para uma abertura válida.
- Mudança de breakpoint mantém visível o primeiro vinho da abertura atual; alternar entre páginas e tabela preserva a posição. Abrir/fechar a ficha preserva a posição e o acesso às anotações.
- Setas do teclado somente dentro do caderno, sem interceptar digitação/edição/diálogos. Botões acessíveis continuam disponíveis em todas as telas; limites não permitem avançar/retroceder.
- Preservar rascunho, aviso de backup, busca, filtros, ordenação, favoritos, isolamento dos exemplos e todos os estados vazios. Passaporte (inclusive selos soltos/pop-ups), ficha e editor não serão redesenhados.

## Ownership e orquestração

- Antigravity: implementar componentes do caderno, estilos estritamente necessários, testes existentes afetados em e2e/helpers.ts, journal.spec.ts e backup.spec.ts; criar componente de páginas apenas se necessário. Pode refatorar WineMemoryCard para uma página sem preservar implementação obsoleta. Dono de docs/reviews/2026-10-11-caderno-execucao.md.
- Se necessário para cumprir o retorno à mesma página filtrada, pode fazer um ajuste mínimo em src/App.tsx: preservar o contexto de caderno enquanto a ficha está sobreposta e restaurá-lo ao fechar/excluir a ficha, sem novas rotas ou alterações no editor. O baseline atual passa uma rota de caderno vazia durante overlays e retorna para tab all, o que precisa ser considerado no teste.
- Codex 2: revisão independente, sem alterar implementação/testes/plano/assets/WIP; único arquivo compartilhado autorizado para escrita é docs/reviews/2026-10-11-caderno.md. Validar em cópia isolada e porta exclusiva, nunca modificar dados do navegador real.
- Codex: coordenar, conferir evidências e apresentar capturas finais. Antigravity e Codex 2 não estão sozinhos no checkout: preservar todas as mudanças anteriores e não reverter trabalho alheio.
- Antes de implementar, registrar inventário e comparar com snapshot inicial fornecido por Codex. Após implementar e validar, criar snapshot v1 imutável de arquivos tracked e untracked não ignorados relevantes (sem .git/node_modules/dist/output/test-results).
- Antigravity entrega snapshot ao Codex 2 por maestri ask, aguarda revisão, corrige findings dentro do escopo e entrega v2 quando necessário. Revisão final deve corresponder aos arquivos atuais. Não criar novos terminais para papéis existentes.

## Verificação

- Coleções 0, 1, 2, 3 e vários registros; limites, folha complementar, índice e foco.
- Busca/filtros/favoritos/ordenação/exemplos/exclusão, retorno da ficha e posição, tabela, redimensionamento desktop/celular.
- Fotos, notas longas sem perda de conteúdo, teclado, movimento reduzido, texturas desligadas e ausência de overflow introduzido pelo caderno.
- Adaptar seletores/testes anteriores à paginação: não exigir que todos os registros estejam simultaneamente no DOM; navegar pelo índice quando necessário. Não enfraquecer assertions de backup/fotos/deletes para fazer testes passarem.
- Rodar os cenários afetados de journal e backup em desktop e Pixel 7, incluindo a regressão do passaporte, além de npm test, npm run build e npm run lint. APIs de leitura de rótulo devem permanecer mockadas/bloqueadas e chaves GEMINI_API_KEY/GOOGLE_API_KEY vazias nos servidores de validação.
- Baseline do lint: AppProvider.tsx:388 (clearDraft) e PaperDialog.tsx:50 (ref), anteriores a esta tarefa. Diferenciar novos erros da baseline real, incluindo resolução dos tipos React ancestrais.
- Chromium existente para Playwright: /Users/jhonatan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell. Não instalar browser/dependência.
- Capturas de caderno vazio, abertura preenchida, índice e celular, com dados fictícios, em output/playwright/caderno-paginado/ (artefatos fora da implementação). Aprovação visual humana é etapa final; não a declarar concluída por teste ou revisão técnica.

## Limites

Sem capa, arrastar folhas, 3D, novos capítulos ou publicação. Emulação de celular não substitui aparelho físico. Preservar todos os ajustes prévios da gamificação e do layout dos selos.
