import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import type { WineEntry } from './wine-entry.js';
import { contentChanged, withRevisit } from './revisit.js';

const NOW = 1_800_000_000_000;
const saved = (): WineEntry => ({ ...createEntry('r1', new Date('2026-09-01T12:00:00Z')), vinho: 'Reserva', revision: 1 });

describe('contentChanged', () => {
  it('ignora campos de controle e ordem de chaves', () => {
    const before = saved();
    assert.strictEqual(contentChanged(before, { ...before, revision: 7, atualizadoEm: NOW, favorite: true }), false);
    assert.strictEqual(contentChanged(before, { ...before, provenance: { uvas: 'user' } }), false);
    const reordered = Object.fromEntries(Object.entries(before).reverse()) as unknown as WineEntry;
    assert.strictEqual(contentChanged(before, reordered), false);
  });

  it('vê mudança no que a ficha diz', () => {
    const before = saved();
    assert.strictEqual(contentChanged(before, { ...before, vinho: 'Grande Reserva' }), true);
    assert.strictEqual(contentChanged(before, { ...before, aromaTags: ['Cereja'] }), true);
  });
});

describe('withRevisit', () => {
  it('ficha nova não é revisita', () => {
    assert.strictEqual(withRevisit(null, saved(), NOW).evidence.revisitedAt, null);
  });

  it('editar uma ficha salva grava a data', () => {
    const before = saved();
    assert.strictEqual(withRevisit(before, { ...before, occasion: 'Jantar' }, NOW).evidence.revisitedAt, NOW);
  });

  it('mantém a data da primeira revisita', () => {
    const before = { ...saved(), evidence: { ...saved().evidence, revisitedAt: 100 } };
    const next = { ...before, occasion: 'Outra', evidence: { ...before.evidence, revisitedAt: null } };
    assert.strictEqual(withRevisit(before, next, NOW).evidence.revisitedAt, 100);
  });

  it('salvar sem mudar o conteúdo não é revisita', () => {
    const before = saved();
    const same = { ...before, provenance: { uvas: 'user' as const } };
    assert.strictEqual(withRevisit(before, same, NOW), same);
  });

  it('ficha de exemplo fica intocada', () => {
    const before = { ...saved(), kind: 'demo' as const };
    assert.strictEqual(withRevisit(before, { ...before, occasion: 'x' }, NOW).evidence.revisitedAt, null);
  });
});
