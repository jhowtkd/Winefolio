import type { IDBPDatabase } from 'idb';
import type { WineDb } from './database';
import type {
  WineEntry,
  EntryDraft,
  Preferences,
  StoreSnapshot,
  CommitEntryInput,
  PhotoChange,
} from '../domain/wine-entry';
import { createPreferences } from '../domain/preferences';

export class StorageUnavailableError extends Error {
  code = 'STORAGE_UNAVAILABLE';
  constructor(message = 'Armazenamento IndexedDB indisponível.') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

export class StorageQuotaError extends Error {
  code = 'STORAGE_QUOTA';
  constructor(message = 'Espaço insuficiente de armazenamento no navegador.') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

export class RevisionConflictError extends Error {
  code = 'REVISION_CONFLICT';
  constructor(message = 'A ficha mudou em outra aba. Reabra antes de substituir.') {
    super(message);
    this.name = 'RevisionConflictError';
  }
}

export class MissingEntryError extends Error {
  code = 'MISSING_ENTRY';
  constructor(message = 'A ficha solicitada não foi encontrada.') {
    super(message);
    this.name = 'MissingEntryError';
  }
}

export interface WineRepository {
  load(): Promise<StoreSnapshot>;
  commitEntry(input: CommitEntryInput): Promise<WineEntry>;
  setFavorite(id: string, favorite: boolean, expectedRevision: number): Promise<WineEntry>;
  removeEntry(id: string, expectedRevision: number): Promise<void>;
  saveDraft(draft: EntryDraft, photo: PhotoChange): Promise<void>;
  discardDraft(): Promise<void>;
  savePreferences(value: Preferences): Promise<void>;
  readPhoto(id: string): Promise<Blob | undefined>;
}

export function createWineRepository(db: IDBPDatabase<WineDb>): WineRepository {
  return {
    async load(): Promise<StoreSnapshot> {
      try {
        const tx = db.transaction(['records', 'drafts', 'settings'], 'readonly');
        const entriesPromise = tx.objectStore('records').getAll();
        const draftPromise = tx.objectStore('drafts').get('active');
        const settingsPromise = tx.objectStore('settings').get('preferences');

        const [entries, draft, settings] = await Promise.all([
          entriesPromise,
          draftPromise,
          settingsPromise,
        ]);

        await tx.done;

        return {
          entries: entries || [],
          draft: draft || null,
          preferences: settings || createPreferences(null),
        };
      } catch (err: any) {
        if (err.name === 'QuotaExceededError') {
          throw new StorageQuotaError();
        }
        throw new StorageUnavailableError(err.message);
      }
    },

    async commitEntry(input: CommitEntryInput): Promise<WineEntry> {
      const tx = db.transaction(['records', 'photos', 'drafts'], 'readwrite');
      try {
        const recordsStore = tx.objectStore('records');
        const photosStore = tx.objectStore('photos');
        const draftsStore = tx.objectStore('drafts');

        const current = await recordsStore.get(input.entry.id);
        const currentRev = current ? current.revision : null;

        if (currentRev !== input.expectedRevision) {
          throw new RevisionConflictError();
        }

        const nextRevision = (currentRev ?? 0) + 1;
        const now = Date.now();

        let finalPhotoId = input.entry.photoId;

        if (input.photo.kind === 'replace') {
          finalPhotoId = `photo-${input.entry.id}`;
          await photosStore.put(input.photo.blob, finalPhotoId);
        } else if (input.photo.kind === 'remove') {
          if (finalPhotoId) {
            await photosStore.delete(finalPhotoId);
          }
          finalPhotoId = null;
        }

        if (input.clearDraft) {
          await draftsStore.delete('active');
          await photosStore.delete('draft:active');
        }

        const savedEntry: WineEntry = {
          ...input.entry,
          revision: nextRevision,
          photoId: finalPhotoId,
          atualizadoEm: now,
        };

        await recordsStore.put(savedEntry);
        await tx.done;

        return savedEntry;
      } catch (err: any) {
        try {
          tx.abort();
        } catch {}
        await tx.done.catch(() => undefined);
        if (err instanceof RevisionConflictError) throw err;
        if (err.name === 'QuotaExceededError') throw new StorageQuotaError();
        throw new StorageUnavailableError(err.message);
      }
    },

    async setFavorite(id: string, favorite: boolean, expectedRevision: number): Promise<WineEntry> {
      const tx = db.transaction(['records'], 'readwrite');
      try {
        const store = tx.objectStore('records');
        const current = await store.get(id);

        if (!current) {
          throw new MissingEntryError();
        }

        if (current.revision !== expectedRevision) {
          throw new RevisionConflictError();
        }

        const updated: WineEntry = {
          ...current,
          favorite,
          revision: current.revision + 1,
          atualizadoEm: Date.now(),
        };

        await store.put(updated);
        await tx.done;
        return updated;
      } catch (err: any) {
        try {
          tx.abort();
        } catch {}
        await tx.done.catch(() => undefined);
        if (err instanceof RevisionConflictError || err instanceof MissingEntryError) throw err;
        throw new StorageUnavailableError(err.message);
      }
    },

    async removeEntry(id: string, expectedRevision: number): Promise<void> {
      const tx = db.transaction(['records', 'photos'], 'readwrite');
      try {
        const recordsStore = tx.objectStore('records');
        const photosStore = tx.objectStore('photos');

        const current = await recordsStore.get(id);
        if (!current) {
          throw new MissingEntryError();
        }

        if (current.revision !== expectedRevision) {
          throw new RevisionConflictError();
        }

        if (current.photoId) {
          await photosStore.delete(current.photoId);
        }

        await recordsStore.delete(id);
        await tx.done;
      } catch (err: any) {
        try {
          tx.abort();
        } catch {}
        await tx.done.catch(() => undefined);
        if (err instanceof RevisionConflictError || err instanceof MissingEntryError) throw err;
        throw new StorageUnavailableError(err.message);
      }
    },

    async saveDraft(draft: EntryDraft, photo: PhotoChange): Promise<void> {
      const tx = db.transaction(['drafts', 'photos'], 'readwrite');
      try {
        const draftsStore = tx.objectStore('drafts');
        const photosStore = tx.objectStore('photos');

        if (photo.kind === 'replace') {
          await photosStore.put(photo.blob, 'draft:active');
        } else if (photo.kind === 'remove') {
          await photosStore.delete('draft:active');
        }

        await draftsStore.put(draft, 'active');
        await tx.done;
      } catch (err: any) {
        try {
          tx.abort();
        } catch {}
        await tx.done.catch(() => undefined);
        throw new StorageUnavailableError(err.message);
      }
    },

    async discardDraft(): Promise<void> {
      const tx = db.transaction(['drafts', 'photos'], 'readwrite');
      try {
        await tx.objectStore('drafts').delete('active');
        await tx.objectStore('photos').delete('draft:active');
        await tx.done;
      } catch (err: any) {
        try {
          tx.abort();
        } catch {}
        await tx.done.catch(() => undefined);
        throw new StorageUnavailableError(err.message);
      }
    },

    async savePreferences(value: Preferences): Promise<void> {
      const tx = db.transaction(['settings'], 'readwrite');
      try {
        await tx.objectStore('settings').put(value, 'preferences');
        await tx.done;
      } catch (err: any) {
        try {
          tx.abort();
        } catch {}
        await tx.done.catch(() => undefined);
        throw new StorageUnavailableError(err.message);
      }
    },

    async readPhoto(id: string): Promise<Blob | undefined> {
      try {
        return await db.get('photos', id);
      } catch {
        return undefined;
      }
    },
  };
}
