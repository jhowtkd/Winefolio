import 'fake-indexeddb/auto';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { prepareImport, commitImport } from './transfer.js';
import { openWineDatabase } from './database.js';
import { createPreferences } from '../domain/preferences.js';
import { createEntry } from '../domain/wine-factory.js';
import { defaultImportDecisions } from '../domain/import-decisions.js';

describe('Transfer & Backups Test', () => {
  it('prepara importação de backup identificando formato e avisos sem duplicar', async () => {
    const current = {
      entries: [],
      draft: null,
      preferences: createPreferences(null),
    };

    const prototypePayload = JSON.stringify({
      format: 'winefolio-design-prototype',
      version: 1,
      records: [
        {
          id: 'wine-p1',
          name: 'Pera Manca',
          producer: 'Fundação Eugénio de Almeida',
          vintage: '2015',
          country: 'PT',
          rating: 5,
        }
      ]
    });

    const preview = await prepareImport(prototypePayload, current, new Date('2026-09-21T12:00:00Z'));
    assert.strictEqual(preview.sourceFormat, 'prototype-v1');
    assert.strictEqual(preview.entries.length, 1);
    assert.strictEqual(preview.entries[0].vinho, 'Pera Manca');
    assert.strictEqual(preview.conflicts.length, 0);
  });
});

describe('importação validada', () => {
  const empty = () => ({ entries: [], draft: null, preferences: createPreferences(null) });

  it('ignora ficha que não passa no schema e avisa', async () => {
    const good = createEntry('boa');
    const bad = { ...createEntry('ruim'), schemaVersion: 1 };
    const payload = JSON.stringify({ format: 'winefolio', version: 2, entries: [good, bad], photos: [] });
    const preview = await prepareImport(payload, empty());
    assert.deepStrictEqual(preview.entries.map((e) => e.id), ['boa']);
    assert.deepStrictEqual(preview.warnings, ['Ficha ruim ignorada: formato inválido.']);
  });

  it('mantém a foto da ficha que a pessoa escolheu manter', async () => {
    const db = await openWineDatabase(`import-${Date.now()}`);
    const mine = { ...createEntry('w1'), vinho: 'Minha versão', photoId: 'photo-w1', revision: 1 };
    await db.put('records', mine);
    await db.put('photos', new Blob(['A']), 'photo-w1');

    const incoming = { ...mine, vinho: 'Versão do backup' };
    const payload = JSON.stringify({
      format: 'winefolio',
      version: 2,
      entries: [incoming],
      photos: [{ id: 'photo-w1', mimeType: 'image/jpeg', base64: btoa('B') }],
    });
    const current = { entries: [mine], draft: null, preferences: createPreferences(null) };
    const preview = await prepareImport(payload, current);
    assert.strictEqual(preview.conflicts.length, 1);

    const result = await commitImport(db, preview, defaultImportDecisions(preview, current));
    assert.deepStrictEqual(result, { imported: 0, skipped: 1 });
    assert.strictEqual((await db.get('records', 'w1'))?.vinho, 'Minha versão');
    assert.strictEqual(await (await db.get('photos', 'photo-w1'))!.text(), 'A');
    db.close();
  });
});
