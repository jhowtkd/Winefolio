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


## Carimbos e marcos do Passaporte (2026-09-26)

Feito, conforme `docs/superpowers/plans/2026-09-26-carimbos-marcos.md`:
- 233 marcos calculados das fichas por função pura (`src/domain/stamps/`): 72 de uva, 93 de região, 64 fixos e os 4 legados
- Catálogos de uvas e regiões com sinônimos; uva, região e país lidos pela IA só contam depois de confirmados
- Botão "Confirmar leitura do rótulo" na ficha
- `evidence.revisitedAt` passa a ser gravado ao salvar uma ficha existente com mudança ("Memória revisitada" deixou de ser impossível)
- Selos em SVG com 8 modelos, carimbo postal, vaga de álbum e variante compacta (`MilestoneStamp`)
- Página "03 / MARCOS" no Passaporte, aviso de carimbo novo no toast de salvar e selo "NOVO" até a pessoa abrir o passaporte
- Textos que prometiam "sem metas" e "não da quantidade de vinho" reescritos
- `npm run render:stamps` gera PNGs transparentes sob demanda

Fora desta leva: arte final das ilustrações (as atuais são provisórias), PNGs no repositório, compartilhar carimbo.
