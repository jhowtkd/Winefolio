import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { backupPhotoIds, bytesToBase64, DRAFT_PHOTO_ID } from './backup-photos.js';

describe('backupPhotoIds', () => {
  it('leva só as fotos das fichas exportadas', () => {
    const withPhoto = createEntry('a');
    withPhoto.photoId = 'photo-a';
    const withoutPhoto = createEntry('b');
    assert.deepStrictEqual([...backupPhotoIds([withPhoto, withoutPhoto], null)], ['photo-a']);
  });

  it('inclui a foto do rascunho quando há rascunho', () => {
    const draft = { id: 'active' as const, entry: createEntry('d'), editingId: null, baseRevision: null, updatedAt: 0 };
    assert.ok(backupPhotoIds([], draft).has(DRAFT_PHOTO_ID));
  });
});

describe('bytesToBase64', () => {
  it('codifica igual ao Buffer, inclusive acima de 32 KB', () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 256);
    assert.strictEqual(bytesToBase64(bytes), Buffer.from(bytes).toString('base64'));
  });
});
