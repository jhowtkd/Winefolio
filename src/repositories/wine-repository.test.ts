import 'fake-indexeddb/auto';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from '../domain/wine-factory.js';
import type { WineEntry } from '../domain/wine-entry.js';
import { openWineDatabase } from './database.js';
import { createWineRepository } from './wine-repository.js';

describe('repository commit', () => {
  it('grava revisitedAt só a partir da segunda gravação com mudança', async () => {
    const repo = createWineRepository(await openWineDatabase(`revisit-${Date.now()}`));
    const input = (entry: WineEntry, expectedRevision: number | null) => ({
      entry,
      expectedRevision,
      photo: { kind: 'keep' as const },
      clearDraft: false,
    });
    const first = await repo.commitEntry(input({ ...createEntry('db1'), vinho: 'Reserva' }, null));
    assert.strictEqual(first.evidence.revisitedAt, null);
    const same = await repo.commitEntry(input(first, first.revision));
    assert.strictEqual(same.evidence.revisitedAt, null);
    const edited = await repo.commitEntry(input({ ...same, occasion: 'Aniversário' }, same.revision));
    assert.ok(edited.evidence.revisitedAt);
  });
});
