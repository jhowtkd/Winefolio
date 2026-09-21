import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scorePalate } from './sensory-scale.js';

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
