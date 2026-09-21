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
    assert.strictEqual(sparkling.length, 1);
    assert.strictEqual(sparkling[0].vinho, 'Brut 24 Meses');
  });

  it('filtra por texto de busca com correspondência ampla', () => {
    const results = filterAndSortEntries(demos, { query: 'borgonha' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].produtor, 'Domaine Laroche');
  });

  it('calcula estatísticas resumidas com precisão', () => {
    const stats = getCollectionStats(demos);
    assert.strictEqual(stats.total, 3);
    assert.strictEqual(stats.favorites, 2);
    assert.strictEqual(stats.countriesCount, 3); // AR, BR, FR
    assert.ok(stats.distinctGrapesCount >= 4);
    assert.ok(stats.averageRating !== null && stats.averageRating >= 4);
  });

  it('calcula frequências de aromas sem perdas', () => {
    const aromas = getAromaFrequencies(demos);
    assert.ok(aromas.length > 0);
    assert.ok(aromas[0].count >= 1);
  });
});
