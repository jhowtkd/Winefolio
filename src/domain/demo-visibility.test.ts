import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { applyDemoFavorites, visibleEntries } from './demo-visibility.js';

describe('demo visibility', () => {
  it('esconde só as fichas de demonstração', () => {
    const demo = createEntry('demo-1');
    demo.kind = 'demo';
    const personal = createEntry('mine');
    personal.kind = 'personal';
    const hidden = visibleEntries([demo, personal], false);
    assert.deepStrictEqual(hidden.map((entry) => entry.id), ['mine']);
    assert.strictEqual(visibleEntries([demo, personal], true).length, 2);
  });

  it('aplica o favorito guardado só em ficha demo', () => {
    const demo = createEntry('demo-1');
    demo.kind = 'demo';
    demo.favorite = false;
    const personal = createEntry('mine');
    personal.kind = 'personal';
    personal.favorite = false;
    const next = applyDemoFavorites([demo, personal], { 'demo-1': true, mine: true });
    assert.strictEqual(next[0].favorite, true);
    assert.strictEqual(next[1].favorite, false);
  });
});
