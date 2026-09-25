import { describe, it } from 'node:test';
import assert from 'node:assert';
import { filterAndSortEntries, getCollectionStats, getAromaFrequencies } from './collection.js';
import { getDemoWines } from '../data/demo-wines.js';

describe('Collection domain tests', () => {
  const demos = getDemoWines(new Date('2026-09-21T12:00:00Z'));

  it('filtra por aba de favoritos e espumantes', () => {
    const favorites = filterAndSortEntries(demos, { tab: 'favorites' });
    assert.strictEqual(favorites.length, 2);

    const sparkling = filterAndSortEntries(demos, { tab: 'sparkling' });
    assert.strictEqual(sparkling.length, 0);
  });

  it('filtra por texto de busca com correspondência ampla', () => {
    const results = filterAndSortEntries(demos, { query: 'douro' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].produtor, 'Quinta do Vento');
  });

  it('filtra entradas por nome do vinho, produtor ou safra', () => {
    // Por nome do vinho
    const byWine = filterAndSortEntries(demos, { query: 'Casa do Vento' });
    assert.strictEqual(byWine.length, 1);
    assert.strictEqual(byWine[0].vinho, 'Casa do Vento');

    // Por produtor
    const byProducer = filterAndSortEntries(demos, { query: 'Bodega La Loma' });
    assert.strictEqual(byProducer.length, 1);
    assert.strictEqual(byProducer[0].produtor, 'Bodega La Loma');

    // Por safra
    const byVintage = filterAndSortEntries(demos, { query: '2022' });
    assert.ok(byVintage.length >= 1);
    assert.ok(byVintage.some((w) => w.safra === '2022'));

    // Combinado: produtor + safra
    const combined = filterAndSortEntries(demos, { query: 'Vento 2022' });
    assert.strictEqual(combined.length, 1);
    assert.strictEqual(combined[0].vinho, 'Casa do Vento');
  });

  it('filtra por nota exata e por tag', () => {
    const five = filterAndSortEntries(demos, { rating: 5 });
    assert.strictEqual(five.length, 2);

    const tagged = demos.map((entry, index) =>
      index === 0 ? { ...entry, tags: ['Presente'] } : entry
    );
    const byTag = filterAndSortEntries(tagged, { tag: 'presente' });
    assert.strictEqual(byTag.length, 1);
    assert.strictEqual(byTag[0].id, tagged[0].id);
    assert.strictEqual(filterAndSortEntries(tagged, { tag: '' }).length, 6);
  });

  it('calcula estatísticas resumidas com precisão', () => {
    const stats = getCollectionStats(demos);
    assert.strictEqual(stats.total, 6);
    assert.strictEqual(stats.favorites, 2);
    assert.strictEqual(stats.countriesCount, 4); // PT, AR, FR, BR
    assert.ok(stats.distinctGrapesCount >= 6);
    assert.ok(stats.averageRating !== null && stats.averageRating >= 4);
  });

  it('calcula frequências de aromas sem perdas', () => {
    const aromas = getAromaFrequencies(demos);
    assert.ok(aromas.length > 0);
    assert.ok(aromas[0].count >= 1);
  });
});
