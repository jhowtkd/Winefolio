import { describe, it } from 'node:test';
import assert from 'node:assert';
import { palateScore, scorePalate } from './sensory-scale.js';
import { createEntry } from './wine-factory.js';

describe('scorePalate', () => {
  it('não inventa nota para campo vazio', () => {
    assert.strictEqual(scorePalate('', 'corpo'), null);
    assert.strictEqual(scorePalate(undefined, 'acidez'), null);
  });

  it('usa a escala do protótipo', () => {
    assert.strictEqual(scorePalate('Encorpado', 'corpo'), 5);
    assert.strictEqual(scorePalate('Leve', 'corpo'), 1.5);
    assert.strictEqual(scorePalate('Muito alta', 'acidez'), 5);
    assert.strictEqual(scorePalate('Seco', 'docura'), 1.2);
    assert.strictEqual(scorePalate('Alto (14.5%)', 'alcool'), 4.5);
    assert.strictEqual(scorePalate('Nulo / Não tem', 'tanino'), 1);
  });
});

describe('palateScore', () => {
  it('lê os códigos da grade ASI', () => {
    const entry = createEntry('x');
    entry.paladar = { ...entry.paladar, body: 'full', acidity: 'high', sweetness: 'luscious', alcohol: 'fortified' };
    assert.strictEqual(palateScore(entry, 'corpo'), 5);
    assert.strictEqual(palateScore(entry, 'acidez'), 4.5);
    assert.strictEqual(palateScore(entry, 'docura'), 5);
    assert.strictEqual(palateScore(entry, 'alcool'), 5);
    assert.strictEqual(palateScore(entry, 'tanino'), null);
  });

  it('usa o texto da ficha anterior à grade quando não há código', () => {
    const entry = { ...createEntry('x'), legacyNotes: { 'paladar.acidity': 'Média+' } };
    assert.strictEqual(palateScore(entry, 'acidez'), 4);
  });
});
