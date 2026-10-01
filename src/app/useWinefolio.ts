import { createContext, useContext } from 'react';
import type {
  WineEntry,
  EntryDraft,
  Preferences,
  CommitEntryInput,
  PhotoChange,
} from '../domain/wine-entry';
import type { BackupStatus } from '../domain/backup-reminder';
import type { ImportPreview, ImportDecisions } from '../repositories/transfer';
import type { AppRoute } from './navigation';

export interface WinefolioContextValue {
  entries: WineEntry[];
  draft: EntryDraft | null;
  preferences: Preferences;
  activeRoute: AppRoute;
  navigate: (route: AppRoute) => void;
  commitEntry: (input: CommitEntryInput) => Promise<WineEntry>;
  setFavorite: (id: string, favorite: boolean, expectedRevision: number) => Promise<WineEntry>;
  /** Confirma os campos lidos pela IA. Devolve null se não deu para gravar. */
  confirmAiReading: (entry: WineEntry) => Promise<WineEntry | null>;
  removeEntry: (id: string, expectedRevision: number) => Promise<void>;
  saveDraft: (draft: EntryDraft, photo: PhotoChange) => Promise<void>;
  discardDraft: () => Promise<void>;
  updatePreferences: (prefs: Partial<Preferences>) => Promise<void>;
  exportBackup: () => Promise<void>;
  previewImport: (file: File) => Promise<{ preview: ImportPreview; defaults: ImportDecisions }>;
  confirmImport: (
    preview: ImportPreview,
    decisions: ImportDecisions
  ) => Promise<{ imported: number; skipped: number }>;
  loadDemoWines: () => Promise<void>;
  readPhotoBlob: (id: string) => Promise<Blob | undefined>;
  showToast: (
    message: string,
    type?: 'info' | 'success' | 'warn' | 'error',
    options?: {
      action?: { label: string; run: () => void };
      durationMs?: number;
      detail?: string;
    }
  ) => void;
  activeEntry: WineEntry | null;
  loading: boolean;
  error: string | null;
  retryInit: () => void;
  backupStatus: BackupStatus;
  backupDue: boolean;
  storagePersisted: boolean | null;
  snoozeBackupReminder: () => Promise<void>;
  /** Carimbos anunciados nesta sessão, ainda "novos" no passaporte. */
  stampHighlights: ReadonlySet<string>;
  markStampsSeen: (ids: readonly string[]) => Promise<void>;
  clearStampHighlights: () => void;
}

export const WinefolioContext = createContext<WinefolioContextValue | null>(null);

export function useWinefolio(): WinefolioContextValue {
  const ctx = useContext(WinefolioContext);
  if (!ctx) {
    throw new Error('useWinefolio must be used within an AppProvider');
  }
  return ctx;
}
