import { describe, it } from 'node:test';
import assert from 'node:assert';
import { filterByWineProducerOrVintage } from './quick-search.js';
import { getDemoWines } from '../data/demo-wines.js';

describe('Quick Search by Wine, Producer or Vintage', () => {
  const demos = getDemoWines(new Date('2026-09-21T12:00:00Z'));

  it('retorna todas as entradas quando a busca está vazia', () => {
    const all = filterByWineProducerOrVintage(demos, '');
    assert.strictEqual(all.length, demos.length);

    const whitespaceOnly = filterByWineProducerOrVintage(demos, '   ');
    assert.strictEqual(whitespaceOnly.length, demos.length);
  });

  it('filtra por nome do vinho (case-insensitive)', () => {
    const results = filterByWineProducerOrVintage(demos, 'casa do vento');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].vinho, 'Casa do Vento');

    const upper = filterByWineProducerOrVintage(demos, 'LA LOMA');
    assert.strictEqual(upper.length, 1);
    assert.strictEqual(upper[0].vinho, 'La Loma');
  });

  it('filtra por produtor', () => {
    const results = filterByWineProducerOrVintage(demos, 'Quinta do Vento');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].produtor, 'Quinta do Vento');

    const partial = filterByWineProducerOrVintage(demos, 'Bodega');
    assert.strictEqual(partial.length, 2);
    assert.ok(partial.every((p) => p.produtor.toLowerCase().includes('bodega')));
  });

  it('filtra por safra', () => {
    // 2022 demo: Casa do Vento
    const results2022 = filterByWineProducerOrVintage(demos, '2022');
    assert.ok(results2022.length >= 1);
    assert.ok(results2022.some((w) => w.safra === '2022'));

    // 2023 demo: La Loma
    const results2023 = filterByWineProducerOrVintage(demos, '2023');
    assert.ok(results2023.length >= 1);
    assert.ok(results2023.some((w) => w.safra === '2023'));
  });

  it('suporta múltiplos termos cruzando produtor e safra ou nome e safra', () => {
    const combined = filterByWineProducerOrVintage(demos, 'vento 2022');
    assert.strictEqual(combined.length, 1);
    assert.strictEqual(combined[0].vinho, 'Casa do Vento');
    assert.strictEqual(combined[0].safra, '2022');

    const loma2023 = filterByWineProducerOrVintage(demos, 'Bodega 2023');
    assert.strictEqual(loma2023.length, 1);
    assert.strictEqual(loma2023[0].vinho, 'La Loma');
  });

  it('retorna lista vazia para termos inexistentes', () => {
    const results = filterByWineProducerOrVintage(demos, 'VinhoInexistente12345');
    assert.strictEqual(results.length, 0);
  });
});
