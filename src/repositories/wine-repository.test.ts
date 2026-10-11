import 'fake-indexeddb/auto';
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { deleteDB } from 'idb';
import { createEntry } from '../domain/wine-factory.js';
import { passportProgress } from '../domain/passport.js';
import { openWineDatabase } from './database.js';
import { createWineRepository, RevisionConflictError } from './wine-repository.js';

it('registra uma revisita só ao mudar a impressão de uma ficha pessoal já salva', async () => {
  const db = await openWineDatabase('passport-revisit-test');
  const repository = createWineRepository(db);
  const commit = (entry: ReturnType<typeof createEntry>, expectedRevision: number | null) =>
    repository.commitEntry({ entry, expectedRevision, photo: { kind: 'keep' }, clearDraft: false });
  try {
    const entry = createEntry('personal');
    entry.conclusao.impressaoFinal = 'Frutas escuras.';
    const first = await commit(entry, null);
    assert.equal(first.evidence.revisitedAt, null);
    const renamed = await commit({ ...first, vinho: 'Outro nome' }, first.revision);
    assert.equal(renamed.evidence.revisitedAt, null);
    const spaced = await commit({ ...renamed, conclusao: { ...renamed.conclusao, impressaoFinal: ' Frutas escuras. ' } }, renamed.revision);
    assert.equal(spaced.evidence.revisitedAt, null);
    const revised = { ...spaced, conclusao: { ...spaced.conclusao, impressaoFinal: 'Frutas escuras e ameixa.' } };
    await assert.rejects(commit(revised, first.revision), RevisionConflictError);
    const saved = await commit(revised, spaced.revision);
    assert.ok(saved.evidence.revisitedAt);
    const cleared = await commit({ ...saved, conclusao: { ...saved.conclusao, impressaoFinal: '' } }, saved.revision);
    assert.equal(cleared.evidence.revisitedAt, saved.evidence.revisitedAt);
    const reloaded = await repository.load();
    assert.ok(passportProgress(reloaded.entries).milestones.find((m) => m.key === 'revisited')?.earned);

    const demo = { ...entry, id: 'demo', kind: 'demo' as const };
    const savedDemo = await commit(demo, null);
    const editedDemo = await commit({ ...savedDemo, conclusao: { ...savedDemo.conclusao, impressaoFinal: 'Outra impressão.' } }, savedDemo.revision);
    assert.equal(editedDemo.evidence.revisitedAt, null);

    const empty = await commit(createEntry('empty'), null);
    const unchanged = await commit({ ...empty, vinho: 'Nome novo' }, empty.revision);
    assert.equal(unchanged.evidence.revisitedAt, null);
  } finally {
    db.close();
    await deleteDB(db.name);
  }
});
