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
    const blank = createEntry('x');
    const raw = JSON.parse(
      JSON.stringify({ ...blank, origin: undefined, servico: undefined, visual: { ...blank.visual, corHex: null } })
    );
    const entry = normalizeImportedEntry(raw);
    assert.deepStrictEqual(entry?.origin, { countryCode: null, region: '' });
    assert.deepStrictEqual(entry?.servico, blank.servico);
    assert.strictEqual(entry?.visual.corHex, undefined);
  });

  it('converte para a grade ASI a ficha de um backup antigo', () => {
    const entry = normalizeImportedEntry({
      id: 'antiga',
      schemaVersion: 2,
      estilo: 'tinto',
      paladar: { corpo: 'Encorpado', acidez: 'Média+' },
      temperaturaServico: '16°C - 18°C',
    });
    assert.strictEqual(entry?.schemaVersion, 3);
    assert.strictEqual(entry?.paladar.body, 'full');
    assert.deepStrictEqual(entry?.servico.temperature, { min: 16, max: 18 });
    assert.deepStrictEqual(entry?.legacyNotes, { 'paladar.acidity': 'Média+' });
  });

  it('recusa o que não é ficha', () => {
    assert.strictEqual(normalizeImportedEntry({ id: 'x', schemaVersion: 1 }), null);
    assert.strictEqual(normalizeImportedEntry('texto'), null);
    assert.strictEqual(normalizeImportedEntry({}), null);
  });
});
