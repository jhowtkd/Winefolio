import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { WineEntry, EntryDraft, Preferences } from '../domain/wine-entry';

export interface WineDb extends DBSchema {
  records: {
    key: string;
    value: WineEntry;
  };
  photos: {
    key: string;
    value: Blob;
  };
  drafts: {
    key: 'active';
    value: EntryDraft;
  };
  settings: {
    key: 'preferences';
    value: Preferences;
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const DB_VERSION = 1;

export async function openWineDatabase(dbName: string = 'winefolio-local'): Promise<IDBPDatabase<WineDb>> {
  return openDB<WineDb>(dbName, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('records')) {
        db.createObjectStore('records', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos');
      }
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta');
      }
    },
    blocked() {
      console.warn('Conexão IndexedDB bloqueada por outra aba.');
    },
    blocking() {
      console.warn('Esta conexão IndexedDB está bloqueando um upgrade de versão.');
    },
    terminated() {
      console.error('Conexão IndexedDB terminada inesperadamente pelo navegador.');
    },
  });
}
