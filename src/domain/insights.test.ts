import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getDemoWines } from '../data/demo-wines.js';
import {
  countryBreakdown,
  grapeBreakdown,
  ratingDistribution,
  styleBreakdown,
  styleLabel,
  tastingsByMonth,
} from './insights.js';

describe('Collection insights', () => {
  const demos = getDemoWines(new Date('2026-09-21T12:00:00Z'));

  it('distribui notas de 1 a 5', () => {
    const buckets = ratingDistribution(demos);
    assert.deepStrictEqual(
      buckets.map((bucket) => bucket.count),
      [0, 0, 1, 3, 2]
    );
  });

  it('separa tintos, brancos e rosés', () => {
    const styles = styleBreakdown(demos).map((item) => item.name).sort();
    assert.deepStrictEqual(styles, ['Branco', 'Rosé', 'Tinto']);
  });

  it('conta uvas e países das fichas de exemplo', () => {
    assert.ok(grapeBreakdown(demos).some((item) => item.name.toLowerCase() === 'arinto'));
    const countries = countryBreakdown(demos).map((item) => item.name).sort();
    assert.deepStrictEqual(countries, ['AR', 'BR', 'FR', 'PT']);
  });

  it('conta degustações apenas nos meses pedidos', () => {
    const months = tastingsByMonth(demos, 6, new Date('2026-09-15T12:00:00Z'));
    assert.strictEqual(months.length, 6);
    assert.strictEqual(months[5].key, '2026-09');
    assert.strictEqual(months[5].count, 6);
    assert.strictEqual(
      months.slice(0, 5).reduce((sum, month) => sum + month.count, 0),
      0
    );
  });
});

describe('styleLabel', () => {
  it('conta mistela e aromatizado pelo tipo, não pela cor', () => {
    assert.strictEqual(styleLabel({ tipo: 'mistela', estilo: 'branco' }), 'Mistela');
    assert.strictEqual(styleLabel({ tipo: 'aromatizado', estilo: null }), 'Aromatizado');
    assert.strictEqual(styleLabel({ tipo: 'tranquilo', estilo: 'branco' }), 'Branco');
  });
});
