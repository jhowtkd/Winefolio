import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { AppProvider } from './app/AppProvider';
import { useWinefolio } from './app/useWinefolio';
import { Header } from './components/layout/Header';
import { SvgSprite, Icon } from './components/proto/Sprite';
import { JournalPage } from './features/journal/JournalPage';
import { EmptyState } from './components/ui/EmptyState';
import { PaperButton } from './components/ui/PaperButton';
import { visibleEntries } from './domain/demo-visibility';
import { getDemoWines } from './data/demo-wines';

// Diálogos e páginas secundárias carregam sob demanda. O caderno fica no bundle inicial.
const loadEditor = () => import('./features/entry/EntryEditorPage');
const loadSheet = () => import('./features/entry/TastingSheetDetails');
const PassportPage = lazy(() => import('./features/passport/PassportPage').then((m) => ({ default: m.PassportPage })));
const PalatePage = lazy(() => import('./features/palate/PalatePage').then((m) => ({ default: m.PalatePage })));
const TastingSheetDetails = lazy(() => loadSheet().then((m) => ({ default: m.TastingSheetDetails })));
const EntryEditorPage = lazy(() => loadEditor().then((m) => ({ default: m.EntryEditorPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const CellarPage = lazy(() => import('./features/cellar/CellarPage').then((m) => ({ default: m.CellarPage })));
const StatsPage = lazy(() => import('./features/stats/StatsPage').then((m) => ({ default: m.StatsPage })));

const PageLoading: React.FC = () => (
  <p className="py-16 text-center text-xs mono" role="status">
    Abrindo a página...
  </p>
);

const AppContent: React.FC = () => {
  const {
    entries,
    draft,
    preferences,
    activeRoute,
    navigate,
    commitEntry,
    setFavorite,
    confirmAiReading,
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
    backupStatus,
    backupDue,
    storagePersisted,
    snoozeBackupReminder,
    stampHighlights,
    markStampsSeen,
    clearStampHighlights,
  } = useWinefolio();

  // Memorizadas: o Passaporte recalcula os 233 marcos quando estas listas mudam.
  const ownEntries = useMemo(() => entries.filter((e) => !e._demo), [entries]);
  const demoEntries = useMemo(() => getDemoWines(), []);

  // Pré-carrega o editor e a ficha com o navegador ocioso. "Registrar vinho" abre sem
  // espera, e salvar não deixa a tela vazia enquanto a ficha carrega.
  useEffect(() => {
    const preload = () => {
      void loadEditor();
      void loadSheet();
      // O aviso de carimbo novo ao salvar usa o catálogo de marcos.
      void import('./domain/stamps');
    };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(preload, 1500);
    return () => clearTimeout(timer);
  }, []);

  const [searchQuery, setSearchQuery] = React.useState(() => {
    if (activeRoute.kind === 'journal') {
      return activeRoute.search ?? '';
    }
    return '';
  });

  React.useEffect(() => {
    if (activeRoute.kind === 'journal') {
      setSearchQuery(activeRoute.search ?? '');
    }
  }, [activeRoute.kind, activeRoute.kind === 'journal' ? activeRoute.search : undefined]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-3 border-[#793b46] border-t-transparent animate-spin mx-auto" />
          <h2 className="font-serif text-lg font-bold">Abrindo o seu caderno...</h2>
          <p className="text-xs mono">Winefolio · arquivo pessoal</p>
        </div>
      </div>
    );
  }

  const showDemo = preferences.showDemo !== false;
  const shown = visibleEntries(entries, showDemo);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (activeRoute.kind === 'journal') {
      const clean = query.trim();
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      if (clean) {
        params.set('q', clean);
      } else {
        params.delete('q');
      }
      const newQueryString = params.toString();
      const newHash = newQueryString ? `#/caderno?${newQueryString}` : '#/caderno';
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    }
  };

  const templateEntry =
    activeRoute.kind === 'new' && activeRoute.fromTemplateId
      ? entries.find((e) => e.id === activeRoute.fromTemplateId) || null
      : null;

  const overlayRoute =
    activeRoute.kind === 'entry' || activeRoute.kind === 'new' || activeRoute.kind === 'settings';

  const journal = (
    <JournalPage
      entries={shown}
      ownCount={ownEntries.length}
      showDemo={showDemo}
      draft={draft}
      readPhoto={readPhotoBlob}
      route={activeRoute.kind === 'journal' ? activeRoute : { kind: 'journal', tab: 'all' }}
      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
      onSelectEntry={(entry) => navigate({ kind: 'entry', id: entry.id, mode: 'view' })}
      onToggleFavorite={(entry) => setFavorite(entry.id, !entry.favorite, entry.revision)}
      onNewEntry={() => navigate({ kind: 'new' })}
      onLoadDemoWines={loadDemoWines}
      onResumeDraft={() => navigate({ kind: 'new' })}
      onDiscardDraft={discardDraft}
      onNavigate={(route) => navigate(route)}
      onOpenPassport={() => navigate({ kind: 'passport' })}
      backupDue={backupDue}
      onExportBackup={exportBackup}
      onSnoozeBackup={snoozeBackupReminder}
    />
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SvgSprite />
      <Header
        activeRoute={activeRoute}
        entries={shown}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSelectEntry={(id) => navigate({ kind: 'entry', id, mode: 'view' })}
        onNavigate={(hash) => {
          window.location.hash = hash;
        }}
      />

      <main id="main" className="wrap flex-1 w-full" tabIndex={-1}>
        {(activeRoute.kind === 'journal' || overlayRoute) && journal}

        {activeRoute.kind === 'passport' && (
          <Suspense fallback={<PageLoading />}>
            <PassportPage
              entries={ownEntries}
              demoEntries={demoEntries}
              defaultMode={ownEntries.length ? 'mine' : 'demo'}
              onOpenCountry={(code) =>
                navigate({ kind: 'journal', tab: 'all', country: code })
              }
              seenStampIds={preferences.seenStampIds ?? []}
              highlights={stampHighlights}
              onStampsSeen={(ids) => {
                void markStampsSeen(ids);
                clearStampHighlights();
              }}
              onOpenEntry={(id) => navigate({ kind: 'entry', id, mode: 'view' })}
            />
          </Suspense>
        )}

        {activeRoute.kind === 'palate' && (
          <Suspense fallback={<PageLoading />}>
            <PalatePage
              entries={ownEntries}
              demoEntries={demoEntries}
              defaultMode={ownEntries.length ? 'mine' : 'demo'}
              onAromaSearch={(aroma) => navigate({ kind: 'journal', tab: 'all', search: aroma })}
              onRevisit={(entry) => {
                if (entry) navigate({ kind: 'entry', id: entry.id, mode: 'view' });
                else navigate({ kind: 'new' });
              }}
            />
          </Suspense>
        )}

        {activeRoute.kind === 'cellar' && (
          <Suspense fallback={<PageLoading />}>
            <CellarPage
              entries={shown}
              onOpenEntry={(id) => navigate({ kind: 'entry', id, mode: 'view' })}
              onNewEntry={() => navigate({ kind: 'new' })}
              onLoadDemoWines={loadDemoWines}
            />
          </Suspense>
        )}

        {activeRoute.kind === 'stats' && (
          <Suspense fallback={<PageLoading />}>
            <StatsPage entries={shown} onOpenJournal={() => navigate({ kind: 'journal', tab: 'all' })} />
          </Suspense>
        )}

        {activeRoute.kind === 'entry' && activeRoute.mode === 'view' && activeEntry && (
          <Suspense fallback={null}>
            <TastingSheetDetails
              entry={activeEntry}
              readPhoto={readPhotoBlob}
              onBack={() => navigate({ kind: 'journal', tab: 'all' })}
              onEdit={(entry) => navigate({ kind: 'entry', id: entry.id, mode: 'edit' })}
              onDuplicate={(entry) => navigate({ kind: 'new', fromTemplateId: entry.id })}
              onToggleFavorite={(entry) => setFavorite(entry.id, !entry.favorite, entry.revision)}
              onConfirmAiReading={confirmAiReading}
              onDelete={async (id, rev) => {
                await removeEntry(id, rev);
                navigate({ kind: 'journal', tab: 'all' });
              }}
            />
          </Suspense>
        )}

        {activeRoute.kind === 'entry' && activeRoute.mode === 'edit' && activeEntry && (
          <Suspense fallback={null}>
            <EntryEditorPage
              key={`edit-${activeEntry.id}`}
              initialEntry={activeEntry}
              readPhoto={readPhotoBlob}
              onCommit={(entry, photo, expectedRevision, clearDraft) =>
                commitEntry({ entry, photo, expectedRevision, clearDraft })
              }
              onSaveDraft={saveDraft}
              onDiscardDraft={discardDraft}
              aiConsented={Boolean(preferences.aiConsentAt)}
              sheetLevel={preferences.sheetLevel}
              onGrantAiConsent={() => updatePreferences({ aiConsentAt: Date.now() })}
              onNavigate={(hash) => {
                window.location.hash = hash;
              }}
              showToast={showToast}
            />
          </Suspense>
        )}

        {activeRoute.kind === 'entry' && !activeEntry && (
          <div className="py-10">
            <EmptyState
              title="Ficha não encontrada"
              description="O registro solicitado não existe ou foi removido do seu caderno local."
              action={
                <PaperButton
                  variant="primary"
                  onClick={() => navigate({ kind: 'journal', tab: 'all' })}
                >
                  Voltar para o Caderno
                </PaperButton>
              }
            />
          </div>
        )}

        {activeRoute.kind === 'new' && (
          <Suspense fallback={null}>
            <EntryEditorPage
              key={activeRoute.fromTemplateId || 'new-clean'}
              fromTemplate={templateEntry}
              existingDraft={draft}
              readPhoto={readPhotoBlob}
              onCommit={(entry, photo, expectedRevision, clearDraft) =>
                commitEntry({ entry, photo, expectedRevision, clearDraft })
              }
              onSaveDraft={saveDraft}
              onDiscardDraft={discardDraft}
              aiConsented={Boolean(preferences.aiConsentAt)}
              sheetLevel={preferences.sheetLevel}
              onGrantAiConsent={() => updatePreferences({ aiConsentAt: Date.now() })}
              onNavigate={(hash) => {
                window.location.hash = hash;
              }}
              showToast={showToast}
            />
          </Suspense>
        )}

        {activeRoute.kind === 'settings' && (
          <Suspense fallback={null}>
            <SettingsPage
              preferences={preferences}
              onUpdatePreferences={updatePreferences}
              onExportBackup={exportBackup}
              onPreviewImport={previewImport}
              onConfirmImport={confirmImport}
              onLoadDemoWines={loadDemoWines}
              backupStatus={backupStatus}
              storagePersisted={storagePersisted}
              onNavigate={(hash) => {
                window.location.hash = hash;
              }}
              showToast={showToast}
            />
          </Suspense>
        )}

        <footer className="site-footer print:hidden">
          <div className="foot-left">
            <div className="footer-brand">Winefolio.</div>
            <span>Feito para guardar, não para competir.</span>
          </div>
          <div className="foot-right">
            <button
              type="button"
              className="text-btn"
              onClick={() => navigate({ kind: 'settings' })}
            >
              Opções do caderno <Icon name="arrow" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
