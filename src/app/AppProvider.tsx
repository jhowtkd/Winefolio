import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import type { IDBPDatabase } from 'idb';
import type { WineDb } from '../repositories/database';
import { openWineDatabase } from '../repositories/database';
import {
  createWineRepository,
  RevisionConflictError,
  MissingEntryError,
  type WineRepository,
} from '../repositories/wine-repository';
import type { ImportPreview, ImportDecisions } from '../repositories/transfer';
import type {
  WineEntry,
  EntryDraft,
  Preferences,
  CommitEntryInput,
  PhotoChange,
} from '../domain/wine-entry';
import { createPreferences } from '../domain/preferences';
import { motionDataset } from '../domain/motion';
import { applyDemoFavorites } from '../domain/demo-visibility';
import { EMPTY_BACKUP_STATUS, isBackupDue, type BackupStatus } from '../domain/backup-reminder';
import { ensurePersistentStorage, readPersistentStorage } from './storage-persistence';
import { getDemoWines } from '../data/demo-wines';
import { WinefolioContext, type WinefolioContextValue } from './useWinefolio';
import { parseHash, formatHash, type AppRoute } from './navigation';
import { Icon } from '../components/proto/Sprite';

type ToastType = 'info' | 'success' | 'warn' | 'error';

export interface ToastOptions {
  action?: { label: string; run: () => void };
  durationMs?: number;
}

// Só aparece quando o banco falha ao abrir.
const RecoveryScreen = lazy(() => import('./RecoveryScreen').then((m) => ({ default: m.RecoveryScreen })));

// Backup e importação carregam o zod; ficam fora do bundle inicial.
// A migração do formato v1 só roda quando há dados antigos no localStorage.
const loadTransfer = () => import('../repositories/transfer');
const loadImportDecisions = () => import('../domain/import-decisions');

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastOptions['action'];
}

/** Tempo para desfazer uma exclusão antes de ela ir para o IndexedDB. */
const UNDO_DELETE_MS = 6000;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<IDBPDatabase<WineDb> | null>(null);
  const [repository, setRepository] = useState<WineRepository | null>(null);
  const [entries, setEntries] = useState<WineEntry[]>([]);
  const [draft, setDraft] = useState<EntryDraft | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(() => {
    // Carrega tema legado como ponto de partida
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('wine_sommelier_night_mode') : null;
    return createPreferences(savedTheme);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      return parseHash(window.location.hash);
    }
    return { kind: 'journal', tab: 'all' };
  });
  const [toast, setToast] = useState<ToastState | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(EMPTY_BACKUP_STATUS);
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);
  const persistRequested = useRef(false);

  const toastSeq = useRef(0);
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options: ToastOptions = {}) => {
      const id = ++toastSeq.current;
      setToast({ id, message, type, action: options.action });
      setTimeout(() => {
        setToast((curr) => (curr && curr.id === id ? null : curr));
      }, options.durationMs ?? 4000);
    },
    []
  );

  // Inicialização do Banco e Migração
  const initApp = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const database = await openWineDatabase();
      setDb(database);

      // Migração V1 segura se houver
      const legacyRaw = typeof window !== 'undefined' ? localStorage.getItem('sommelier_wine_sheets_v1') : null;
      if (legacyRaw) {
        try {
          const { migrateLegacy } = await import('../repositories/migration');
          const migrationResult = await migrateLegacy(database, legacyRaw);
          if (migrationResult === 'migrated') {
            console.info('Dados legados v1 migrados com sucesso para o IndexedDB v2.');
          }
        } catch (mErr) {
          console.error('Aviso ao migrar dados legados:', mErr);
        }
      }

      // Fichas anteriores à grade ASI. Se falhar, o app segue e tenta na próxima abertura.
      try {
        const { migrateToAsi } = await import('../repositories/migration');
        await migrateToAsi(database);
      } catch (mErr) {
        console.error('Aviso ao converter as fichas para a grade ASI:', mErr);
      }

      const repo = createWineRepository(database);
      setRepository(repo);

      const snapshot = await repo.load();
      setEntries(applyDemoFavorites(snapshot.entries, snapshot.preferences.demoFavorites));
      setDraft(snapshot.draft);
      setPreferences(snapshot.preferences);
      setBackupStatus(await repo.readBackupStatus());
      setStoragePersisted(await readPersistentStorage());
    } catch (err: any) {
      console.error('Falha de inicialização do Winefolio:', err);
      setError(err?.message || 'Erro ao inicializar o banco de dados local.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Sincronização da URL Hash
  useEffect(() => {
    const handleHashChange = () => {
      setActiveRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((route: AppRoute) => {
    const hash = formatHash(route);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    setActiveRoute(route);
  }, []);

  // Efeito para aplicar preferências de Tema, Textura e Animações no documento HTML
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'night') {
      root.classList.add('dark');
      localStorage.setItem('wine_sommelier_night_mode', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('wine_sommelier_night_mode', 'light');
    }

    const body = document.body;
    if (preferences.textures) {
      root.removeAttribute('data-textures');
      body.classList.remove('flat');
    } else {
      root.setAttribute('data-textures', 'off');
      body.classList.add('flat');
    }

    const motion = motionDataset(preferences.reduceMotion);
    if (motion) {
      root.setAttribute('data-motion', motion);
      body.classList.add('minimal-motion');
    } else {
      root.removeAttribute('data-motion');
      body.classList.remove('minimal-motion');
    }
  }, [preferences]);

  // Operações de Ficha
  const commitEntry = useCallback(
    async (input: CommitEntryInput): Promise<WineEntry> => {
      if (!repository) throw new Error('Repositório não inicializado');
      const saved = await repository.commitEntry(input);

      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });

      if (input.clearDraft) {
        setDraft(null);
      }

      // Pede proteção contra limpeza só depois da primeira ficha pessoal:
      // o Firefox mostra um pedido de permissão, e ele precisa fazer sentido.
      if (saved.kind !== 'demo' && storagePersisted !== true && !persistRequested.current) {
        persistRequested.current = true;
        void ensurePersistentStorage().then(setStoragePersisted);
      }

      showToast(`Ficha de "${saved.vinho || saved.produtor || 'Vinho'}" salva com sucesso!`, 'success');
      return saved;
    },
    [repository, showToast, storagePersisted]
  );

  const updatePreferences = useCallback(
    async (partial: Partial<Preferences>): Promise<void> => {
      if (!repository) throw new Error('Repositório não inicializado');
      const next: Preferences = { ...preferences, ...partial };
      await repository.savePreferences(next);
      setPreferences(next);
      showToast('Preferências salvas.', 'success');
    },
    [repository, preferences, showToast]
  );

  const setFavorite = useCallback(
    async (id: string, favorite: boolean, expectedRevision: number): Promise<WineEntry> => {
      if (!repository) throw new Error('Repositório não inicializado');
      const updated = await repository.setFavorite(id, favorite, expectedRevision);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      if (updated.kind === 'demo') {
        await updatePreferences({
          demoFavorites: { ...preferences.demoFavorites, [id]: favorite },
        });
      }
      showToast(favorite ? 'Vinho marcado como favorito!' : 'Vinho desmarcado dos favoritos.', 'info');
      return updated;
    },
    [repository, showToast, preferences.demoFavorites, updatePreferences]
  );

  // Exclusão com desfazer: a ficha some da tela na hora e só sai do IndexedDB
  // depois de UNDO_DELETE_MS, numa nova exclusão ou quando a aba é escondida.
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const pendingDeletion = useRef<{ entry: WineEntry; timer: ReturnType<typeof setTimeout> } | null>(null);

  const flushPendingDeletion = useCallback(async (): Promise<void> => {
    const pending = pendingDeletion.current;
    if (!pending || !repository) return;
    pendingDeletion.current = null;
    clearTimeout(pending.timer);
    try {
      await repository.removeEntry(pending.entry.id, pending.entry.revision);
    } catch {
      setEntries((prev) =>
        prev.some((e) => e.id === pending.entry.id) ? prev : [pending.entry, ...prev]
      );
      showToast('Não foi possível excluir a ficha. Ela voltou para o caderno.', 'error');
    }
  }, [repository, showToast]);

  const undoDeletion = useCallback(
    (id: string) => {
      const pending = pendingDeletion.current;
      if (!pending || pending.entry.id !== id) return;
      clearTimeout(pending.timer);
      pendingDeletion.current = null;
      setEntries((prev) => (prev.some((e) => e.id === id) ? prev : [pending.entry, ...prev]));
      showToast('Ficha restaurada.', 'success');
    },
    [showToast]
  );

  const removeEntry = useCallback(
    async (id: string, expectedRevision: number): Promise<void> => {
      if (!repository) throw new Error('Repositório não inicializado');
      await flushPendingDeletion();
      const entry = entriesRef.current.find((e) => e.id === id);
      if (!entry) throw new MissingEntryError();
      if (entry.revision !== expectedRevision) throw new RevisionConflictError();

      setEntries((prev) => prev.filter((e) => e.id !== id));
      const timer = setTimeout(() => void flushPendingDeletion(), UNDO_DELETE_MS);
      pendingDeletion.current = { entry, timer };
      showToast('Ficha excluída.', 'info', {
        durationMs: UNDO_DELETE_MS,
        action: { label: 'Desfazer', run: () => undoDeletion(id) },
      });
    },
    [repository, flushPendingDeletion, undoDeletion, showToast]
  );

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') void flushPendingDeletion();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [flushPendingDeletion]);

  const saveDraft = useCallback(
    async (d: EntryDraft, photo: PhotoChange): Promise<void> => {
      if (!repository) throw new Error('Repositório não inicializado');
      await repository.saveDraft(d, photo);
      setDraft(d);
    },
    [repository]
  );

  const discardDraft = useCallback(async (): Promise<void> => {
    if (!repository) throw new Error('Repositório não inicializado');
    await repository.discardDraft();
    setDraft(null);
    showToast('Rascunho descartado.', 'info');
  }, [repository, showToast]);

  const exportBackup = useCallback(async (): Promise<void> => {
    if (!db) throw new Error('Banco de dados indisponível');
    const { exportBackup: doExportBackup } = await loadTransfer();
    const blob = await doExportBackup(db);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `winefolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const status: BackupStatus = { lastBackupAt: Date.now(), snoozedUntil: null };
    setBackupStatus(status);
    await repository?.saveBackupStatus(status).catch(() => undefined);
    showToast('Backup exportado com sucesso!', 'success');
  }, [db, repository, showToast]);

  const snoozeBackupReminder = useCallback(async (): Promise<void> => {
    const status: BackupStatus = { ...backupStatus, snoozedUntil: Date.now() + 7 * 86_400_000 };
    setBackupStatus(status);
    await repository?.saveBackupStatus(status).catch(() => undefined);
  }, [backupStatus, repository]);

  const backupDue = useMemo(
    () => isBackupDue(backupStatus, entries, Date.now()),
    [backupStatus, entries]
  );

  const previewImport = useCallback(
    async (file: File): Promise<{ preview: ImportPreview; defaults: ImportDecisions }> => {
      if (!repository) throw new Error('Banco de dados indisponível');
      const [{ prepareImport }, { defaultImportDecisions }] = await Promise.all([
        loadTransfer(),
        loadImportDecisions(),
      ]);
      const text = await file.text();
      const current = await repository.load();
      const preview = await prepareImport(text, current);
      return { preview, defaults: defaultImportDecisions(preview, current) };
    },
    [repository]
  );

  const confirmImport = useCallback(
    async (
      preview: ImportPreview,
      decisions: ImportDecisions
    ): Promise<{ imported: number; skipped: number }> => {
      if (!db || !repository) throw new Error('Banco de dados indisponível');
      const { commitImport } = await loadTransfer();
      const result = await commitImport(db, preview, decisions);
      const reloaded = await repository.load();
      setEntries(applyDemoFavorites(reloaded.entries, reloaded.preferences.demoFavorites));
      setDraft(reloaded.draft);
      setPreferences(reloaded.preferences);
      showToast(`Importação concluída: ${result.imported} fichas importadas.`, 'success');
      return result;
    },
    [db, repository, showToast]
  );

  const loadDemoWines = useCallback(async (): Promise<void> => {
    if (!repository) return;
    const demos = getDemoWines();
    for (const demo of demos) {
      await repository.commitEntry({
        entry: demo,
        photo: { kind: 'keep' },
        expectedRevision: null,
      });
    }
    const reloaded = await repository.load();
    setEntries(applyDemoFavorites(reloaded.entries, preferences.demoFavorites));
    showToast('6 fichas de exemplo adicionadas ao seu caderno!', 'success');
  }, [repository, showToast, preferences.demoFavorites]);

  const readPhotoBlob = useCallback(
    async (id: string): Promise<Blob | undefined> => {
      if (!repository) return undefined;
      return repository.readPhoto(id);
    },
    [repository]
  );

  const activeEntry = useMemo(() => {
    if (activeRoute.kind === 'entry') {
      return entries.find((e) => e.id === activeRoute.id) || null;
    }
    return null;
  }, [activeRoute, entries]);

  const contextValue: WinefolioContextValue = useMemo(
    () => ({
      entries,
      draft,
      preferences,
      activeRoute,
      navigate,
      commitEntry,
      setFavorite,
      removeEntry,
      saveDraft,
      discardDraft,
      updatePreferences,
      exportBackup,
      previewImport,
      confirmImport,
      loadDemoWines,
      readPhotoBlob,
      showToast,
      activeEntry,
      loading,
      error,
      retryInit: initApp,
      backupStatus,
      backupDue,
      storagePersisted,
      snoozeBackupReminder,
    }),
    [
      entries,
      draft,
      preferences,
      activeRoute,
      navigate,
      commitEntry,
      setFavorite,
      removeEntry,
      saveDraft,
      discardDraft,
      updatePreferences,
      exportBackup,
      previewImport,
      confirmImport,
      loadDemoWines,
      readPhotoBlob,
      showToast,
      activeEntry,
      loading,
      error,
      initApp,
      backupStatus,
      backupDue,
      storagePersisted,
      snoozeBackupReminder,
    ]
  );

  if (error) {
    return (
      <Suspense fallback={null}>
        <RecoveryScreen error={error} onRetry={initApp} />
      </Suspense>
    );
  }

  return (
    <WinefolioContext.Provider value={contextValue}>
      {children}

      {/* Notificação Toast no padrão do protótipo */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Icon name={toast.type === 'success' ? 'check' : 'info'} />
          <div>
            <strong>{toast.message}</strong>
          </div>
          {toast.action && (
            <button type="button" className="toast-action" onClick={toast.action.run}>
              {toast.action.label}
            </button>
          )}
          <button type="button" aria-label="Fechar aviso" onClick={() => setToast(null)}>
            <Icon name="close" />
          </button>
        </div>
      )}
    </WinefolioContext.Provider>
  );
};
