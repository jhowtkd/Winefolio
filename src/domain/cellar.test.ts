import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { cellarIdentity, groupIntoCellar } from './cellar.js';
import { getDemoWines } from '../data/demo-wines.js';

describe('Cellar grouping', () => {
  it('agrupa degustações do mesmo rótulo e safra', () => {
    const first = createEntry('a', new Date('2026-01-01T12:00:00Z'));
    first.produtor = 'Catena';
    first.vinho = 'Malbec';
    first.safra = '2020';
    first.dataDegustacao = '2026-01-01';
    first.conclusao.avaliacaoEstrelas = 5;

    const second = createEntry('b', new Date('2026-06-01T12:00:00Z'));
    second.produtor = ' catena ';
    second.vinho = 'Malbec';
    second.safra = '2020';
    second.dataDegustacao = '2026-06-01';
    second.conclusao.avaliacaoEstrelas = 3;
    second.favorite = true;

    assert.strictEqual(cellarIdentity(first), cellarIdentity(second));

    const cellar = groupIntoCellar([first, second]);
    assert.strictEqual(cellar.length, 1);
    assert.strictEqual(cellar[0].tastingCount, 2);
    assert.strictEqual(cellar[0].averageRating, 4);
    assert.strictEqual(cellar[0].favorite, true);
    assert.strictEqual(cellar[0].latestEntryId, 'b');
    assert.strictEqual(cellar[0].lastTasted, '2026-06-01');
  });

  it('mantém fichas sem nome como garrafas separadas', () => {
    const blankA = createEntry('blank-a');
    const blankB = createEntry('blank-b');
    const cellar = groupIntoCellar([blankA, blankB]);
    assert.strictEqual(cellar.length, 2);
  });

  it('transforma as fichas de exemplo em três garrafas', () => {
    const cellar = groupIntoCellar(getDemoWines(new Date('2026-09-21T12:00:00Z')));
    assert.strictEqual(cellar.length, 3);
    assert.ok(cellar.some((bottle) => bottle.vinho === 'Malbec Argentino' && bottle.averageRating === 5));
  });
});
