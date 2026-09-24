import type { IDBPDatabase } from 'idb';
import type { WineDb } from './database';
import type {
  WineEntry,
  EntryDraft,
  Preferences,
  StoreSnapshot,
} from '../domain/wine-entry';
import { adaptLegacy } from './adapters/legacy';
import { adaptPrototype } from './adapters/prototype';
import { backupPhotoIds, bytesToBase64 } from '../domain/backup-photos';

export interface ImportConflict {
  id: string;
  incoming: WineEntry;
  existing: WineEntry;
}

export interface ImportPreview {
  entries: WineEntry[];
  photos: Array<{ id: string; blob: Blob }>;
  draft: EntryDraft | null;
  preferences: Preferences | null;
  expectedRevisions: Record<string, number | null>;
  expectedDraftDigest: string | null;
  expectedPreferencesDigest: string | null;
  duplicates: string[];
  conflicts: ImportConflict[];
  warnings: string[];
  sourceDigest: string;
  sourceFormat: 'native-v2' | 'app-v1' | 'prototype-v1';
}

export interface ImportDecisions {
  records: Record<string, 'keep-existing' | 'replace'>;
  draft: 'keep-existing' | 'replace';
  preferences: 'keep-existing' | 'replace';
}

function computeDigest(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(hash);
}

export async function prepareImport(
  text: string,
  current: StoreSnapshot,
  now: Date = new Date()
): Promise<ImportPreview> {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Arquivo JSON inválido ou corrompido.');
  }

  const existingMap = new Map<string, WineEntry>(current.entries.map((e) => [e.id, e]));
  const duplicates: string[] = [];
  const conflicts: ImportConflict[] = [];
  const warnings: string[] = [];

  let entries: WineEntry[] = [];
  let photos: Array<{ id: string; blob: Blob }> = [];
  let draft: EntryDraft | null = null;
  let preferences: Preferences | null = null;
  let sourceFormat: 'native-v2' | 'app-v1' | 'prototype-v1' = 'native-v2';

  if (Array.isArray(parsed)) {
    sourceFormat = 'app-v1';
    const res = adaptLegacy(parsed, now);
    entries = res.entries;
    photos = res.photos;
    warnings.push(...res.warnings);
  } else if (parsed && typeof parsed === 'object') {
    if (parsed.format === 'winefolio-design-prototype') {
      sourceFormat = 'prototype-v1';
      const res = adaptPrototype(parsed, now);
      entries = res.entries;
      photos = res.photos;
      draft = res.draft;
      warnings.push(...res.warnings);
    } else if (parsed.format === 'winefolio' && parsed.version === 2) {
      sourceFormat = 'native-v2';
      entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      draft = parsed.draft || null;
      preferences = parsed.preferences || null;
      if (Array.isArray(parsed.photos)) {
        for (const p of parsed.photos) {
          if (p.id && p.base64) {
            try {
              const bin = atob(p.base64);
              const arr = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
              photos.push({ id: p.id, blob: new Blob([arr], { type: p.mimeType || 'image/jpeg' }) });
            } catch {
              warnings.push(`Foto ${p.id} não pôde ser decodificada.`);
            }
          }
        }
      }
    } else {
      throw new Error('Formato ou versão de backup não reconhecida.');
    }
  }

  const expectedRevisions: Record<string, number | null> = {};

  for (const entry of entries) {
    const existing = existingMap.get(entry.id);
    expectedRevisions[entry.id] = existing ? existing.revision : null;

    if (existing) {
      const incomingNorm = JSON.stringify({ ...entry, revision: 0, atualizadoEm: 0 });
      const existingNorm = JSON.stringify({ ...existing, revision: 0, atualizadoEm: 0 });
      if (incomingNorm === existingNorm) {
        duplicates.push(entry.id);
      } else {
        conflicts.push({ id: entry.id, incoming: entry, existing });
      }
    }
  }

  return {
    entries,
    photos,
    draft,
    preferences,
    expectedRevisions,
    expectedDraftDigest: current.draft ? computeDigest(JSON.stringify(current.draft)) : null,
    expectedPreferencesDigest: computeDigest(JSON.stringify(current.preferences)),
    duplicates,
    conflicts,
    warnings,
    sourceDigest: computeDigest(text),
    sourceFormat,
  };
}

export async function commitImport(
  db: IDBPDatabase<WineDb>,
  preview: ImportPreview,
  decisions: ImportDecisions
): Promise<{ imported: number; skipped: number }> {
  const tx = db.transaction(['records', 'photos', 'drafts', 'settings', 'meta'], 'readwrite');
  try {
    const recordsStore = tx.objectStore('records');
    const photosStore = tx.objectStore('photos');
    const draftsStore = tx.objectStore('drafts');
    const settingsStore = tx.objectStore('settings');

    let imported = 0;
    let skipped = 0;

    for (const entry of preview.entries) {
      const current = await recordsStore.get(entry.id);
      const expectedRev = preview.expectedRevisions[entry.id];

      if ((current?.revision ?? null) !== expectedRev) {
        throw new Error(`Conflito de alteração simultânea na ficha ${entry.id}.`);
      }

      if (current) {
        const decision = decisions.records[entry.id] || 'keep-existing';
        if (decision === 'keep-existing') {
          skipped++;
          continue;
        }
      }

      await recordsStore.put({
        ...entry,
        revision: (current?.revision ?? 0) + 1,
        atualizadoEm: Date.now(),
      });
      imported++;
    }

    for (const photo of preview.photos) {
      await photosStore.put(photo.blob, photo.id);
    }

    if (preview.draft && decisions.draft === 'replace') {
      await draftsStore.put(preview.draft, 'active');
    }

    if (preview.preferences && decisions.preferences === 'replace') {
      await settingsStore.put(preview.preferences, 'preferences');
    }

    await tx.done;
    return { imported, skipped };
  } catch (err) {
    try {
      tx.abort();
    } catch {}
    await tx.done.catch(() => undefined);
    throw err;
  }
}

export async function exportBackup(db: IDBPDatabase<WineDb>): Promise<Blob> {
  // Todos os pedidos saem no mesmo tick. Esperar qualquer promessa que não seja
  // do IndexedDB dentro da transação faz o navegador fechá-la.
  const tx = db.transaction(['records', 'photos', 'drafts', 'settings'], 'readonly');
  const photoStore = tx.objectStore('photos');
  const [records, draft, preferences, photoKeys, photoBlobs] = await Promise.all([
    tx.objectStore('records').getAll(),
    tx.objectStore('drafts').get('active'),
    tx.objectStore('settings').get('preferences'),
    photoStore.getAllKeys(),
    photoStore.getAll(),
    tx.done,
  ]);

  const entries = records.filter((r) => r.kind !== 'demo');
  const wanted = backupPhotoIds(entries, draft ?? null);
  const photosData: Array<{ id: string; mimeType: string; base64: string }> = [];
  for (let i = 0; i < photoKeys.length; i++) {
    const id = String(photoKeys[i]);
    const blob = photoBlobs[i];
    if (!blob || !wanted.has(id)) continue;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    photosData.push({ id, mimeType: blob.type, base64: bytesToBase64(bytes) });
  }

  const backupObject = {
    format: 'winefolio',
    version: 2,
    exportedAt: new Date().toISOString(),
    entries,
    draft: draft || null,
    preferences: preferences || null,
    photos: photosData,
  };

  const json = JSON.stringify(backupObject, null, 2);
  return new Blob([json], { type: 'application/json;charset=utf-8' });
}
