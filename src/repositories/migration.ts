import type { IDBPDatabase } from 'idb';
import type { WineDb } from './database';
import { adaptLegacy } from './adapters/legacy';

export async function migrateLegacy(
  db: IDBPDatabase<WineDb>,
  raw: string | null,
  now: Date = new Date()
): Promise<'none' | 'migrated' | 'already-migrated'> {
  // Verifica se já migrou
  const alreadyMigrated = await db.get('meta', 'migration:app-v1');
  if (alreadyMigrated) {
    return 'already-migrated';
  }

  if (!raw || raw.trim() === '') {
    await db.put('meta', { date: now.getTime(), count: 0 }, 'migration:app-v1');
    return 'none';
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('JSON legado corrompido, preservando dados intactos:', err);
    return 'none';
  }

  const { entries, photos } = adaptLegacy(parsed, now);

  const tx = db.transaction(['records', 'photos', 'meta'], 'readwrite');
  try {
    const recordsStore = tx.objectStore('records');
    const photosStore = tx.objectStore('photos');
    const metaStore = tx.objectStore('meta');

    for (const entry of entries) {
      const existing = await recordsStore.get(entry.id);
      if (!existing) {
        await recordsStore.put(entry);
      }
    }

    for (const photo of photos) {
      const existing = await photosStore.get(photo.id);
      if (!existing) {
        await photosStore.put(photo.blob, photo.id);
      }
    }

    await metaStore.put(
      { date: now.getTime(), count: entries.length },
      'migration:app-v1'
    );

    await tx.done;
    return 'migrated';
  } catch (err) {
    try {
      tx.abort();
    } catch {}
    await tx.done.catch(() => undefined);
    throw err;
  }
}
