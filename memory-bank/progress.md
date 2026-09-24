# Progresso

## Funciona

- Caderno, ficha, editor, ajustes, backup e tema
- Adega agrupada por rótulo e safra
- Estatísticas do caderno
- Navegação inferior no celular
- Testes de domínio, navegação, adaptadores e backup

## Fora desta leva

- Estoque real de garrafas (quantidade comprada, localização, consumo)
- O plano local `Winefolio-Implementacao` não pôde ser lido
- Ditado, radar de paladar, filtro por nota e tag, código de país no editor, leitura completa do rótulo, movimento reduzido de fato, e ocultar exemplos. O plano está escrito e ainda não foi executado.

## Preparação do lançamento (2026-09-24)

Feito, conforme `docs/superpowers/plans/2026-09-24-launch-readiness.md`:
- Backup exporta todas as fotos (antes quebrava com duas ou mais)
- Rota do Gemini com limite por IP e por dia, validação de imagem e da resposta, sem vazar erro; `npm start` em modo produção
- Leitura de rótulo pede licença; campos da IA ficam marcados até a pessoa revisar; a IA não escreve impressão final nem qualidade
- Pedido de armazenamento persistente e lembrete de backup
- Importação com prévia, validação e escolha em conflitos
- Desfazer exclusão
- Adega e Estatísticas no menu
- Ícones, manifest, README
- Bundle inicial de 295 kB
- E2E com Playwright e CI no GitHub Actions

Fora desta leva: estoque real de garrafas, service worker offline, fontes servidas pelo próprio app.

