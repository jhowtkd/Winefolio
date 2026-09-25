import type { IDBPDatabase } from 'idb';
import type { WineDb } from './database';
import { adaptLegacy } from './adapters/legacy';
import type { Preferences, WineEntry } from '../domain/wine-entry';
import { needsUpgrade, upgradeToV3 } from '../domain/asi-convert';
import { createPreferences } from '../domain/preferences';

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

export const ASI_MIGRATION_KEY = 'migration:asi-v3';

/**
 * Converte as fichas e o rascunho do formato 2 (texto livre) para a grade ASI.
 * Roda uma vez, numa transação só: se falhar, nada muda e tenta de novo na próxima
 * abertura. Quem já tem fichas começa no nível Avançado, para não sumir campo
 * que já preenchia.
 */
export async function migrateToAsi(
  db: IDBPDatabase<WineDb>,
  now: Date = new Date()
): Promise<'migrated' | 'already-migrated'> {
  if (await db.get('meta', ASI_MIGRATION_KEY)) return 'already-migrated';

  const tx = db.transaction(['records', 'drafts', 'settings', 'meta'], 'readwrite');
  try {
    const recordsStore = tx.objectStore('records');
    const draftsStore = tx.objectStore('drafts');
    const settingsStore = tx.objectStore('settings');

    const records = (await recordsStore.getAll()) as unknown[];
    let converted = 0;
    for (const record of records) {
      if (!needsUpgrade(record)) continue;
      await recordsStore.put(upgradeToV3(record as Record<string, any>) as WineEntry);
      converted++;
    }

    const draft = await draftsStore.get('active');
    if (draft && needsUpgrade(draft.entry)) {
      await draftsStore.put(
        { ...draft, entry: upgradeToV3(draft.entry as unknown as Record<string, any>) as WineEntry },
        'active'
      );
    }

    const hasOwnEntries = records.some((r) => (r as WineEntry).kind !== 'demo');
    const stored = (await settingsStore.get('preferences')) as Partial<Preferences> | undefined;
    if (!stored?.sheetLevel && hasOwnEntries) {
      await settingsStore.put(
        { ...createPreferences(null), ...stored, sheetLevel: 'avancado' },
        'preferences'
      );
    }

    await tx.objectStore('meta').put({ date: now.getTime(), count: converted }, ASI_MIGRATION_KEY);
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
