import { createContext, useContext } from 'react';
import type {
  WineEntry,
  EntryDraft,
  Preferences,
  CommitEntryInput,
  PhotoChange,
} from '../domain/wine-entry';
import type { BackupStatus } from '../domain/backup-reminder';
import type { AppRoute } from './navigation';

export interface WinefolioContextValue {
  entries: WineEntry[];
  draft: EntryDraft | null;
  preferences: Preferences;
  activeRoute: AppRoute;
  navigate: (route: AppRoute) => void;
  commitEntry: (input: CommitEntryInput) => Promise<WineEntry>;
  setFavorite: (id: string, favorite: boolean, expectedRevision: number) => Promise<WineEntry>;
  removeEntry: (id: string, expectedRevision: number) => Promise<void>;
  saveDraft: (draft: EntryDraft, photo: PhotoChange) => Promise<void>;
  discardDraft: () => Promise<void>;
  updatePreferences: (prefs: Partial<Preferences>) => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<{ imported: number; skipped: number }>;
  loadDemoWines: () => Promise<void>;
  readPhotoBlob: (id: string) => Promise<Blob | undefined>;
  showToast: (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  activeEntry: WineEntry | null;
  loading: boolean;
  error: string | null;
  retryInit: () => void;
  backupStatus: BackupStatus;
  backupDue: boolean;
  storagePersisted: boolean | null;
  snoozeBackupReminder: () => Promise<void>;
}

export const WinefolioContext = createContext<WinefolioContextValue | null>(null);

export function useWinefolio(): WinefolioContextValue {
  const ctx = useContext(WinefolioContext);
  if (!ctx) {
    throw new Error('useWinefolio must be used within an AppProvider');
  }
  return ctx;
}
