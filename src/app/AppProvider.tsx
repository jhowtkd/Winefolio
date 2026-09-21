import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { IDBPDatabase } from 'idb';
import type { WineDb } from '../repositories/database';
import { openWineDatabase } from '../repositories/database';
import { createWineRepository, type WineRepository } from '../repositories/wine-repository';
import { migrateLegacy } from '../repositories/migration';
import { exportBackup as doExportBackup, prepareImport, commitImport } from '../repositories/transfer';
import type {
  WineEntry,
  EntryDraft,
  Preferences,
  CommitEntryInput,
  PhotoChange,
} from '../domain/wine-entry';
import { createPreferences } from '../domain/preferences';
import { motionDataset } from '../domain/motion';
import { getDemoWines } from '../data/demo-wines';
import { WinefolioContext, type WinefolioContextValue } from './useWinefolio';
import { parseHash, formatHash, type AppRoute } from './navigation';
import { RecoveryScreen } from './RecoveryScreen';

interface ToastState {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

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

  const showToast = useCallback(
    (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
      setToast({ id: Date.now(), message, type });
      setTimeout(() => {
        setToast((curr) => (curr && curr.message === message ? null : curr));
      }, 4000);
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
          const migrationResult = await migrateLegacy(database, legacyRaw);
          if (migrationResult === 'migrated') {
            console.info('Dados legados v1 migrados com sucesso para o IndexedDB v2.');
          }
        } catch (mErr) {
          console.error('Aviso ao migrar dados legados:', mErr);
        }
      }

      const repo = createWineRepository(database);
      setRepository(repo);

      const snapshot = await repo.load();
      setEntries(snapshot.entries);
      setDraft(snapshot.draft);
      setPreferences(snapshot.preferences);
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

    if (preferences.textures) {
      root.removeAttribute('data-textures');
    } else {
      root.setAttribute('data-textures', 'off');
    }

    const motion = motionDataset(preferences.reduceMotion);
    if (motion) {
      root.setAttribute('data-motion', motion);
    } else {
      root.removeAttribute('data-motion');
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

      showToast(`Ficha de "${saved.vinho || saved.produtor || 'Vinho'}" salva com sucesso!`, 'success');
      return saved;
    },
    [repository, showToast]
  );

  const setFavorite = useCallback(
    async (id: string, favorite: boolean, expectedRevision: number): Promise<WineEntry> => {
      if (!repository) throw new Error('Repositório não inicializado');
      const updated = await repository.setFavorite(id, favorite, expectedRevision);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      showToast(favorite ? 'Vinho marcado como favorito!' : 'Vinho desmarcado dos favoritos.', 'info');
      return updated;
    },
    [repository, showToast]
  );

  const removeEntry = useCallback(
    async (id: string, expectedRevision: number): Promise<void> => {
      if (!repository) throw new Error('Repositório não inicializado');
      await repository.removeEntry(id, expectedRevision);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast('Ficha de degustação excluída.', 'info');
    },
    [repository, showToast]
  );

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

  const exportBackup = useCallback(async (): Promise<void> => {
    if (!db) throw new Error('Banco de dados indisponível');
    const blob = await doExportBackup(db);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `winefolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!', 'success');
  }, [db, showToast]);

  const importBackup = useCallback(
    async (file: File): Promise<{ imported: number; skipped: number }> => {
      if (!db || !repository) throw new Error('Banco de dados indisponível');
      const text = await file.text();
      const currentSnapshot = await repository.load();
      const preview = await prepareImport(text, currentSnapshot);

      const decisions = {
        records: Object.fromEntries(preview.entries.map((e) => [e.id, 'replace' as const])),
        draft: 'replace' as const,
        preferences: 'replace' as const,
      };

      const result = await commitImport(db, preview, decisions);
      const reloaded = await repository.load();
      setEntries(reloaded.entries);
      setDraft(reloaded.draft);
      setPreferences(reloaded.preferences);

      showToast(`Importação concluída: ${result.imported} fichas importadas!`, 'success');
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
    setEntries(reloaded.entries);
    showToast('3 fichas de demonstração adicionadas ao seu caderno!', 'success');
  }, [repository, showToast]);

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
      importBackup,
      loadDemoWines,
      readPhotoBlob,
      showToast,
      activeEntry,
      loading,
      error,
      retryInit: initApp,
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
      importBackup,
      loadDemoWines,
      readPhotoBlob,
      showToast,
      activeEntry,
      loading,
      error,
      initApp,
    ]
  );

  if (error) {
    return <RecoveryScreen error={error} onRetry={initApp} />;
  }

  return (
    <WinefolioContext.Provider value={contextValue}>
      {children}

      {/* Notificação Toast Flutuante */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 z-50 animate-toast">
          <div
            className={`px-4 py-2.5 rounded-xs border shadow-lg text-xs sm:text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-[#5d6b4f] text-[#fffaf0] border-[#4a563f]'
                : toast.type === 'error'
                ? 'bg-red-800 text-white border-red-950'
                : toast.type === 'warn'
                ? 'bg-amber-800 text-white border-amber-950'
                : 'bg-[#793b46] text-[#fffaf0] border-[#5c2733]'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </WinefolioContext.Provider>
  );
};
