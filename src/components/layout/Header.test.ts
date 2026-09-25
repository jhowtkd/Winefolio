import { describe, it } from 'node:test';
import assert from 'node:assert';
import { filterByWineProducerOrVintage } from '../../domain/quick-search.js';
import { getDemoWines } from '../../data/demo-wines.js';

describe('Header Quick Search component and logic', () => {
  it('garante que o módulo Header compila e exporta a função de componente', async () => {
    const headerModule = await import('./Header.js');
    assert.ok(headerModule.Header);
    assert.strictEqual(typeof headerModule.Header, 'function');
  });

  it('permite filtrar as entradas do diário por nome do vinho na busca rápida', () => {
    const demos = getDemoWines(new Date('2026-09-21T12:00:00Z'));
    const matched = filterByWineProducerOrVintage(demos, 'Casa do Vento');
    assert.strictEqual(matched.length, 1);
    assert.strictEqual(matched[0].vinho, 'Casa do Vento');
  });

  it('permite filtrar as entradas do diário por produtor na busca rápida', () => {
    const demos = getDemoWines(new Date('2026-09-21T12:00:00Z'));
    const matched = filterByWineProducerOrVintage(demos, 'Quinta do Vento');
    assert.strictEqual(matched.length, 1);
    assert.strictEqual(matched[0].produtor, 'Quinta do Vento');
  });

  it('permite filtrar as entradas do diário por safra na busca rápida', () => {
    const demos = getDemoWines(new Date('2026-09-21T12:00:00Z'));
    const matched = filterByWineProducerOrVintage(demos, '2022');
    assert.ok(matched.length >= 1);
    assert.ok(matched.some((w) => w.safra === '2022'));
  });

  it('permite combinar termos (ex: nome e safra, ou produtor e safra)', () => {
    const demos = getDemoWines(new Date('2026-09-21T12:00:00Z'));
    const matched = filterByWineProducerOrVintage(demos, 'Vento 2022');
    assert.strictEqual(matched.length, 1);
    assert.strictEqual(matched[0].vinho, 'Casa do Vento');
    assert.strictEqual(matched[0].safra, '2022');
  });
});
