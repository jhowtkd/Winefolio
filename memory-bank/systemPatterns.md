# Padrões

- Domínio em `src/domain`. A UI não inventa regra de agrupamento.
- `groupIntoCellar` identifica um rótulo por produtor + vinho + safra, normalizados. Ficha sem nome fica sozinha.
- `src/domain/insights.ts` alimenta a página de estatísticas.
- Rotas por hash em `src/app/navigation.ts`.
- Persistência em IndexedDB via `src/repositories`. O formato v2 é `WineEntry`.
- Visual de papel: tokens em `src/styles/tokens.css` e componentes `Paper*`.
