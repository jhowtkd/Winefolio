import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from '../../domain/wine-factory.js';
import { getDemoWines } from '../../data/demo-wines.js';
import { grapeBreakdown, ratingDistribution } from '../../domain/insights.js';

describe('WineStatsDashboard domain calculations', () => {
  it('calcula a distribuição de notas em 5 faixas a partir das fichas', () => {
    const demos = getDemoWines(new Date('2026-09-21T12:00:00Z'));
    const dist = ratingDistribution(demos);

    assert.strictEqual(dist.length, 5);
    assert.strictEqual(dist[0].stars, 1);
    assert.strictEqual(dist[4].stars, 5);

    // Soma das contagens de vinhos com estrelas
    const totalRated = dist.reduce((sum, item) => sum + item.count, 0);
    assert.strictEqual(totalRated, demos.filter((d) => d.conclusao?.avaliacaoEstrelas).length);
  });

  it('calcula o ranking de variedades de uvas ordenado por frequência', () => {
    const w1 = createEntry('1');
    w1.uvas = 'Touriga Nacional, Tinta Roriz';
    const w2 = createEntry('2');
    w2.uvas = 'Touriga Nacional, Alfrocheiro';
    const w3 = createEntry('3');
    w3.uvas = 'Cabernet Sauvignon';

    const ranking = grapeBreakdown([w1, w2, w3]);

    assert.strictEqual(ranking[0].name, 'Touriga Nacional');
    assert.strictEqual(ranking[0].count, 2);
    assert.ok(ranking.some((item) => item.name === 'Tinta Roriz' && item.count === 1));
  });

  it('lida graciosamente com fichas sem uvas ou sem avaliação', () => {
    const empty1 = createEntry('empty-1');
    empty1.uvas = '';
    empty1.conclusao.avaliacaoEstrelas = null;

    const grapes = grapeBreakdown([empty1]);
    assert.strictEqual(grapes.length, 0);

    const ratings = ratingDistribution([empty1]);
    assert.strictEqual(ratings.every((r) => r.count === 0), true);
  });

  it('garante que o módulo do componente WineStatsDashboard compila e exporta corretamente', async () => {
    const dashboardModule = await import('./WineStatsDashboard.js');
    assert.ok(dashboardModule.WineStatsDashboard);
  });
});
