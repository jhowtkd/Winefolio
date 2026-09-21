import React, { useState, useMemo } from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import type { CollectionTab, SortOption } from '../../domain/collection';
import { filterAndSortEntries, getCollectionStats, getAromaFrequencies } from '../../domain/collection';
import { CollectionToolbar } from './CollectionToolbar';
import { WineMemoryCard } from './WineMemoryCard';
import { JournalSidebar } from './JournalSidebar';
import { WineTableView } from '../../components/WineTableView';
import { EmptyState } from '../../components/ui/EmptyState';
import { PaperDialog } from '../../components/ui/PaperDialog';
import { PaperButton } from '../../components/ui/PaperButton';
import { BookOpen, Sparkles, Upload, Plus, Trash2 } from 'lucide-react';

interface JournalPageProps {
  entries: WineEntry[];
  readPhoto: (id: string) => Promise<Blob | undefined>;
  onSelectEntry: (entry: WineEntry) => void;
  onEditEntry: (entry: WineEntry) => void;
  onDuplicateEntry: (entry: WineEntry) => void;
  onToggleFavorite: (entry: WineEntry) => void;
  onDeleteEntry: (id: string, expectedRevision: number) => Promise<void>;
  onNewEntry: () => void;
  onLoadDemoWines: () => void;
  onOpenSettings: () => void;
  initialTab?: CollectionTab;
  initialSearch?: string;
}

export const JournalPage: React.FC<JournalPageProps> = ({
  entries,
  readPhoto,
  onSelectEntry,
  onEditEntry,
  onDuplicateEntry,
  onToggleFavorite,
  onDeleteEntry,
  onNewEntry,
  onLoadDemoWines,
  onOpenSettings,
  initialTab = 'all',
  initialSearch = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState<CollectionTab>(initialTab);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedAroma, setSelectedAroma] = useState('');

  // Dialogo de exclusão
  const [deletingEntry, setDeletingEntry] = useState<WineEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lista única de países e estilos disponíveis
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      if (e.origin?.countryCode) set.add(e.origin.countryCode);
    }
    return Array.from(set).sort();
  }, [entries]);

  const availableStyles = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      if (e.tipo === 'espumante') set.add('espumante');
      else if (e.estilo) set.add(e.estilo);
    }
    return Array.from(set).sort();
  }, [entries]);

  // Filtro combinado incluindo o aroma selecionado se houver
  const filteredEntries = useMemo(() => {
    let result = filterAndSortEntries(entries, {
      query: searchQuery,
      tab: activeTab,
      style: selectedStyle,
      country: selectedCountry,
      sortBy,
    });

    if (selectedAroma) {
      result = result.filter((e) =>
        (e.aromaTags || []).some((a) => a.toLowerCase() === selectedAroma.toLowerCase())
      );
    }

    return result;
  }, [entries, searchQuery, activeTab, selectedStyle, selectedCountry, sortBy, selectedAroma]);

  const stats = useMemo(() => getCollectionStats(entries), [entries]);
  const aromaFrequencies = useMemo(() => getAromaFrequencies(entries), [entries]);

  const handleConfirmDelete = async () => {
    if (!deletingEntry) return;
    try {
      setIsDeleting(true);
      await onDeleteEntry(deletingEntry.id, deletingEntry.revision);
      setDeletingEntry(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ferramentas Principal */}
      <CollectionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedAroma('');
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
        availableCountries={availableCountries}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        availableStyles={availableStyles}
        selectedStyle={selectedStyle}
        onStyleChange={setSelectedStyle}
        totalFiltered={filteredEntries.length}
        totalAll={entries.length}
        onNewEntry={onNewEntry}
      />

      {/* Conteúdo Principal com Sidebar Responsiva */}
      {entries.length === 0 ? (
        <EmptyState
          title="Caderno de Degustações em Branco"
          description="Você ainda não registrou nenhuma ficha. Comece anotando sua primeira taça, carregue exemplos ou importe um backup existente."
          action={
            <div className="flex flex-col sm:flex-row gap-3">
              <PaperButton variant="primary" onClick={onNewEntry}>
                <Plus className="w-4 h-4 mr-1.5" />
                Registrar primeiro vinho
              </PaperButton>
              <PaperButton variant="secondary" onClick={onLoadDemoWines}>
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-600" />
                Carregar fichas de exemplo
              </PaperButton>
              <PaperButton variant="quiet" onClick={onOpenSettings}>
                <Upload className="w-4 h-4 mr-1.5" />
                Importar backup
              </PaperButton>
            </div>
          }
        />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          title="Nenhuma ficha encontrada"
          description="Nenhum registro corresponde aos filtros ou à pesquisa atual."
          action={
            <PaperButton
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
                setSelectedCountry('all');
                setSelectedStyle('all');
                setSelectedAroma('');
              }}
            >
              Limpar todos os filtros
            </PaperButton>
          }
        />
      ) : (
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Grade ou Tabela de Fichas */}
          <div className="flex-1 w-full min-w-0">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredEntries.map((entry) => (
                  <WineMemoryCard
                    key={entry.id}
                    entry={entry}
                    readPhoto={readPhoto}
                    onSelect={onSelectEntry}
                    onEdit={onEditEntry}
                    onDuplicate={onDuplicateEntry}
                    onToggleFavorite={onToggleFavorite}
                    onDelete={(e) => setDeletingEntry(e)}
                  />
                ))}
              </div>
            ) : (
              <WineTableView
                wines={filteredEntries}
                readPhoto={readPhoto}
                onOpenSheet={onSelectEntry}
                onEdit={onEditEntry}
                onDelete={(id) => {
                  const entry = entries.find((e) => e.id === id);
                  if (entry) setDeletingEntry(entry);
                }}
                onSelectTag={(tag) => setSearchQuery(tag)}
              />
            )}
          </div>

          {/* Barra Lateral com Estatísticas e Nuvem de Aromas */}
          <JournalSidebar
            stats={stats}
            aromaFrequencies={aromaFrequencies}
            onSelectAroma={setSelectedAroma}
            selectedAroma={selectedAroma}
          />
        </div>
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      <PaperDialog
        open={Boolean(deletingEntry)}
        title="Excluir Ficha de Degustação"
        onRequestClose={() => !isDeleting && setDeletingEntry(null)}
        footer={
          <>
            <PaperButton
              variant="secondary"
              disabled={isDeleting}
              onClick={() => setDeletingEntry(null)}
            >
              Cancelar
            </PaperButton>
            <PaperButton
              variant="danger"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {isDeleting ? 'Excluindo...' : 'Sim, excluir ficha'}
            </PaperButton>
          </>
        }
      >
        <div className="space-y-3">
          <p>
            Tem certeza de que deseja excluir permanentemente a ficha de{' '}
            <strong className="font-serif font-bold text-[#312d26] dark:text-[#eee7db]">
              {deletingEntry?.vinho || deletingEntry?.produtor || 'este vinho'}
            </strong>
            ?
          </p>
          <p className="text-xs text-[#6b6458] dark:text-[#9e9687]">
            Esta ação apagará as notas sensoriais e o rótulo do armazenamento local do navegador.
          </p>
        </div>
      </PaperDialog>
    </div>
  );
};
