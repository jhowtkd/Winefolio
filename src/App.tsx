import React from 'react';
import { AppProvider } from './app/AppProvider';
import { useWinefolio } from './app/useWinefolio';
import { Header } from './components/layout/Header';
import { JournalPage } from './features/journal/JournalPage';
import { TastingSheetDetails } from './features/entry/TastingSheetDetails';
import { EntryEditorPage } from './features/entry/EntryEditorPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { EmptyState } from './components/ui/EmptyState';
import { PaperButton } from './components/ui/PaperButton';
import { Loader2 } from 'lucide-react';

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
  } = useWinefolio();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f2ecdf] dark:bg-[#1a1714]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-3 border-[#793b46] border-t-transparent animate-spin mx-auto" />
          <h2 className="font-serif text-lg font-bold text-[#312d26] dark:text-[#eee7db]">
            Abrindo Caderno de Degustações...
          </h2>
          <p className="text-xs font-mono-code text-[#6b6458] dark:text-[#9e9687]">
            Winefolio 1.1 • Armazenamento Local Seguro
          </p>
        </div>
      </div>
    );
  }

  // Template para clonar caso seja rota #/novo?from=...
  const templateEntry =
    activeRoute.kind === 'new' && activeRoute.fromTemplateId
      ? entries.find((e) => e.id === activeRoute.fromTemplateId) || null
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f2ecdf] dark:bg-[#12100e] text-[#312d26] dark:text-[#eee7db] transition-colors duration-200">
      {/* Barra de Topo */}
      <Header
        activeRoute={activeRoute}
        theme={preferences.theme}
        onToggleTheme={() =>
          updatePreferences({
            theme: preferences.theme === 'night' ? 'paper' : 'night',
          })
        }
        onNavigate={(hash) => {
          window.location.hash = hash;
        }}
      />

      {/* Conteúdo Central Conforme Rota Hash */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activeRoute.kind === 'journal' && (
          <JournalPage
            entries={entries}
            readPhoto={readPhotoBlob}
            onSelectEntry={(entry) =>
              navigate({ kind: 'entry', id: entry.id, mode: 'view' })
            }
            onEditEntry={(entry) =>
              navigate({ kind: 'entry', id: entry.id, mode: 'edit' })
            }
            onDuplicateEntry={(entry) =>
              navigate({ kind: 'new', fromTemplateId: entry.id })
            }
            onToggleFavorite={(entry) =>
              setFavorite(entry.id, !entry.favorite, entry.revision)
            }
            onDeleteEntry={(id, rev) => removeEntry(id, rev)}
            onNewEntry={() => navigate({ kind: 'new' })}
            onLoadDemoWines={loadDemoWines}
            onOpenSettings={() => navigate({ kind: 'settings' })}
            initialTab={activeRoute.tab || 'all'}
            initialSearch={activeRoute.search || ''}
          />
        )}

        {activeRoute.kind === 'entry' && activeRoute.mode === 'view' && (
          <>
            {activeEntry ? (
              <TastingSheetDetails
                entry={activeEntry}
                readPhoto={readPhotoBlob}
                onBack={() => navigate({ kind: 'journal', tab: 'all' })}
                onEdit={(entry) =>
                  navigate({ kind: 'entry', id: entry.id, mode: 'edit' })
                }
                onDuplicate={(entry) =>
                  navigate({ kind: 'new', fromTemplateId: entry.id })
                }
                onToggleFavorite={(entry) =>
                  setFavorite(entry.id, !entry.favorite, entry.revision)
                }
                onDelete={async (id, rev) => {
                  await removeEntry(id, rev);
                  navigate({ kind: 'journal', tab: 'all' });
                }}
              />
            ) : (
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
            )}
          </>
        )}

        {activeRoute.kind === 'entry' && activeRoute.mode === 'edit' && (
          <>
            {activeEntry ? (
              <EntryEditorPage
                key={`edit-${activeEntry.id}`}
                initialEntry={activeEntry}
                readPhoto={readPhotoBlob}
                onCommit={(entry, photo, expectedRevision, clearDraft) =>
                  commitEntry({ entry, photo, expectedRevision, clearDraft })
                }
                onSaveDraft={saveDraft}
                onDiscardDraft={discardDraft}
                onNavigate={(hash) => {
                  window.location.hash = hash;
                }}
                showToast={showToast}
              />
            ) : (
              <EmptyState
                title="Ficha não encontrada para edição"
                description="Não foi possível localizar este registro para edição."
                action={
                  <PaperButton
                    variant="primary"
                    onClick={() => navigate({ kind: 'journal', tab: 'all' })}
                  >
                    Voltar para o Caderno
                  </PaperButton>
                }
              />
            )}
          </>
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
            onNavigate={(hash) => {
              window.location.hash = hash;
            }}
            showToast={showToast}
          />
        )}
      </main>

      {/* Rodapé discreto no estilo caderno */}
      <footer className="border-t border-[#cfc4b0]/40 dark:border-[#3d362b] py-6 px-4 text-center text-[11px] text-[#6b6458] dark:text-[#9e9687] print:hidden">
        <p>
          Winefolio 1.1 • Caderno de Degustações de Vinhos & Sommelier Digital • 100% Local & Seguro
        </p>
      </footer>
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
