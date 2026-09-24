import React from 'react';
import { AppProvider } from './app/AppProvider';
import { useWinefolio } from './app/useWinefolio';
import { Header } from './components/layout/Header';
import { SvgSprite, Icon } from './components/proto/Sprite';
import { JournalPage } from './features/journal/JournalPage';
import { PassportPage } from './features/passport/PassportPage';
import { PalatePage } from './features/palate/PalatePage';
import { TastingSheetDetails } from './features/entry/TastingSheetDetails';
import { EntryEditorPage } from './features/entry/EntryEditorPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { CellarPage } from './features/cellar/CellarPage';
import { StatsPage } from './features/stats/StatsPage';
import { EmptyState } from './components/ui/EmptyState';
import { PaperButton } from './components/ui/PaperButton';
import { visibleEntries } from './domain/demo-visibility';
import { getDemoWines } from './data/demo-wines';

const AppContent: React.FC = () => {
  const {
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
    backupStatus,
    backupDue,
    storagePersisted,
    snoozeBackupReminder,
  } = useWinefolio();

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
  const ownEntries = entries.filter((e) => !e._demo);
  const demoEntries = getDemoWines();

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
        onNavigate={(hash) => {
          window.location.hash = hash;
        }}
      />

      <main id="main" className="wrap flex-1 w-full" tabIndex={-1}>
        {(activeRoute.kind === 'journal' || overlayRoute) && journal}

        {activeRoute.kind === 'passport' && (
          <PassportPage
            entries={ownEntries}
            demoEntries={demoEntries}
            defaultMode={ownEntries.length ? 'mine' : 'demo'}
            onOpenCountry={(code) =>
              navigate({ kind: 'journal', tab: 'all', country: code })
            }
          />
        )}

        {activeRoute.kind === 'palate' && (
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
        )}

        {activeRoute.kind === 'cellar' && (
          <CellarPage
            entries={shown}
            onOpenEntry={(id) => navigate({ kind: 'entry', id, mode: 'view' })}
            onNewEntry={() => navigate({ kind: 'new' })}
            onLoadDemoWines={loadDemoWines}
          />
        )}

        {activeRoute.kind === 'stats' && (
          <StatsPage entries={shown} onOpenJournal={() => navigate({ kind: 'journal', tab: 'all' })} />
        )}

        {activeRoute.kind === 'entry' && activeRoute.mode === 'view' && activeEntry && (
          <TastingSheetDetails
            entry={activeEntry}
            readPhoto={readPhotoBlob}
            onBack={() => navigate({ kind: 'journal', tab: 'all' })}
            onEdit={(entry) => navigate({ kind: 'entry', id: entry.id, mode: 'edit' })}
            onDuplicate={(entry) => navigate({ kind: 'new', fromTemplateId: entry.id })}
            onToggleFavorite={(entry) => setFavorite(entry.id, !entry.favorite, entry.revision)}
            onDelete={async (id, rev) => {
              await removeEntry(id, rev);
              navigate({ kind: 'journal', tab: 'all' });
            }}
          />
        )}

        {activeRoute.kind === 'entry' && activeRoute.mode === 'edit' && activeEntry && (
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
            onGrantAiConsent={() => updatePreferences({ aiConsentAt: Date.now() })}
            onNavigate={(hash) => {
              window.location.hash = hash;
            }}
            showToast={showToast}
          />
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
            onGrantAiConsent={() => updatePreferences({ aiConsentAt: Date.now() })}
            onNavigate={(hash) => {
              window.location.hash = hash;
            }}
            showToast={showToast}
          />
        )}

        {activeRoute.kind === 'settings' && (
          <SettingsPage
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
            onExportBackup={exportBackup}
            onImportBackup={importBackup}
            onLoadDemoWines={loadDemoWines}
            backupStatus={backupStatus}
            storagePersisted={storagePersisted}
            onNavigate={(hash) => {
              window.location.hash = hash;
            }}
            showToast={showToast}
          />
        )}

        <footer className="site-footer print:hidden">
          <div className="foot-left">
            <div className="footer-brand">Winefolio.</div>
            <span>Feito para guardar, não para contar.</span>
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
