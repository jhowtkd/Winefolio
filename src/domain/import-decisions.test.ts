import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { createPreferences } from './preferences.js';
import { defaultImportDecisions, normalizeImportedEntry } from './import-decisions.js';

function previewWith(ids: { conflicts: string[]; duplicates: string[] }, hasDraft: boolean) {
  return {
    conflicts: ids.conflicts.map((id) => ({ id, incoming: createEntry(id), existing: createEntry(id) })),
    duplicates: ids.duplicates,
    draft: hasDraft ? { id: 'active' as const, entry: createEntry('d'), editingId: null, baseRevision: null, updatedAt: 0 } : null,
  };
}

describe('defaultImportDecisions', () => {
  it('mantém as fichas que já existem e as preferências atuais', () => {
    const decisions = defaultImportDecisions(previewWith({ conflicts: ['a'], duplicates: ['b'] }, true), {
      entries: [],
      draft: null,
      preferences: createPreferences(null),
    });
    assert.deepStrictEqual(decisions.records, { a: 'keep-existing', b: 'keep-existing' });
    assert.strictEqual(decisions.preferences, 'keep-existing');
    assert.strictEqual(decisions.draft, 'replace');
  });

  it('não troca um rascunho que já existe', () => {
    const current = { entries: [], draft: previewWith({ conflicts: [], duplicates: [] }, true).draft, preferences: createPreferences(null) };
    const decisions = defaultImportDecisions(previewWith({ conflicts: [], duplicates: [] }, true), current);
    assert.strictEqual(decisions.draft, 'keep-existing');
  });
});

describe('normalizeImportedEntry', () => {
  it('completa campos que o app pode deixar vazios', () => {
    const raw = JSON.parse(JSON.stringify({ ...createEntry('x'), origin: undefined, temperaturaServico: null }));
    const entry = normalizeImportedEntry(raw);
    assert.deepStrictEqual(entry?.origin, { countryCode: null, region: '' });
    assert.strictEqual(entry?.temperaturaServico, undefined);
  });

  it('recusa o que não é ficha', () => {
    assert.strictEqual(normalizeImportedEntry({ id: 'x', schemaVersion: 1 }), null);
    assert.strictEqual(normalizeImportedEntry('texto'), null);
    assert.strictEqual(normalizeImportedEntry({}), null);
  });
});
