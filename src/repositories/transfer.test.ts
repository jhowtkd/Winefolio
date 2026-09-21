import { describe, it } from 'node:test';
import assert from 'node:assert';
import { prepareImport } from './transfer.js';
import { createPreferences } from '../domain/preferences.js';

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
