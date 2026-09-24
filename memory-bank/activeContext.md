# Contexto ativo

O app ganhou as rotas `#/adega` e `#/estatisticas`, que já existiam na navegação e abriam tela vazia.

A interface antiga da versão 1 (modal gigante, cartão e ficha soltos, gráfico de radar e `localStorage` direto) foi removida. A tela de erro deixou de gravar vinhos de exemplo por cima do backup legado.

O plano em `/Users/jhonatan/Downloads/Winefolio-Implementacao` não estava disponível nesta máquina. O trabalho seguiu o contrato que o código já anunciava.

O plano das funções que ainda faltam está em `docs/superpowers/plans/2026-09-21-prototype-gaps.md`. A ordem obrigatória é país (tarefa 3) antes da leitura de rótulo (tarefa 5). As outras tarefas são independentes.

## Lançamento (2026-09-24)

O objetivo do ciclo é lançar pelo Google AI Studio (Cloud Run). O plano está em `docs/superpowers/plans/2026-09-24-launch-readiness.md`, com priorização ICE e critério go/no-go. As tarefas 1 a 5 bloqueiam o lançamento. A tarefa 1 corrige um bug confirmado no Chromium: o backup falha com duas ou mais fotos.
