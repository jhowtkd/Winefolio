import React from 'react';
import type { CollectionTab, SortOption } from '../../domain/collection';
import { PaperButton } from '../../components/ui/PaperButton';
import { Search, X, LayoutGrid, Table, SlidersHorizontal, Plus, Star, Sparkles } from 'lucide-react';

interface CollectionToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: CollectionTab;
  onTabChange: (tab: CollectionTab) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableCountries: string[];
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  availableStyles: string[];
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  selectedRating: 'all' | 1 | 2 | 3 | 4 | 5;
  onRatingChange: (rating: 'all' | 1 | 2 | 3 | 4 | 5) => void;
  availableTags: string[];
  selectedTag: string;
  onTagChange: (tag: string) => void;
  totalFiltered: number;
  totalAll: number;
  onNewEntry: () => void;
}

export const CollectionToolbar: React.FC<CollectionToolbarProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  availableCountries,
  selectedCountry,
  onCountryChange,
  availableStyles,
  selectedStyle,
  onStyleChange,
  selectedRating,
  onRatingChange,
  availableTags,
  selectedTag,
  onTagChange,
  totalFiltered,
  totalAll,
  onNewEntry,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="space-y-3">
      {/* Linha Principal: Busca, Abas e Botão Principal */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca estilizado como papel */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7f6f] dark:text-[#6b6458]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por vinho, produtor, uva, região ou notas..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] placeholder-[#8a7f6f] dark:placeholder-[#6b6458] shadow-[0_1px_2px_rgba(59,48,18,0.06)] focus:outline-hidden focus:border-[#793b46] focus:ring-1 focus:ring-[#793b46]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Abas e Controles de visualização */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Abas */}
          <div className="inline-flex rounded border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onTabChange('all')}
              className={`px-3 py-1.5 rounded transition-all ${
                activeTab === 'all'
                  ? 'bg-[#793b46] text-[#fffaf0] font-semibold shadow-xs'
                  : 'text-[#6b6458] dark:text-[#9e9687] hover:text-[#312d26] dark:hover:text-white'
              }`}
            >
              Todas ({totalAll})
            </button>
            <button
              type="button"
              onClick={() => onTabChange('favorites')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                activeTab === 'favorites'
                  ? 'bg-[#793b46] text-[#fffaf0] font-semibold shadow-xs'
                  : 'text-[#6b6458] dark:text-[#9e9687] hover:text-[#312d26] dark:hover:text-white'
              }`}
            >
              <Star className="w-3 h-3" />
              Favoritos
            </button>
            <button
              type="button"
              onClick={() => onTabChange('sparkling')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                activeTab === 'sparkling'
                  ? 'bg-[#793b46] text-[#fffaf0] font-semibold shadow-xs'
                  : 'text-[#6b6458] dark:text-[#9e9687] hover:text-[#312d26] dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Espumantes
            </button>
          </div>

          {/* Alternador de visualização Grid vs Tabela */}
          <div className="hidden sm:inline-flex rounded border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid'
                  ? 'bg-[#eae1cd] dark:bg-[#3d362b] text-[#312d26] dark:text-[#eee7db]'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
              title="Exibir como Cartões de Memória"
              aria-label="Exibir como Cartões de Memória"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded ${
                viewMode === 'table'
                  ? 'bg-[#eae1cd] dark:bg-[#3d362b] text-[#312d26] dark:text-[#eee7db]'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
              title="Exibir como Tabela de Arquivo"
              aria-label="Exibir como Tabela de Arquivo"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

          {/* Botão de Filtros expandíveis */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-xs font-medium flex items-center gap-1.5 ${
              showFilters ||
              selectedCountry !== 'all' ||
              selectedStyle !== 'all' ||
              selectedRating !== 'all' ||
              selectedTag !== ''
                ? 'text-[#793b46] border-[#793b46]'
                : 'text-[#6b6458] dark:text-[#9e9687]'
            }`}
            aria-label="Filtros avançados"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden md:inline">Filtros</span>
          </button>

          {/* Botão CTA Nova Ficha */}
          <PaperButton
            variant="primary"
            onClick={onNewEntry}
            className="!py-2 !px-3.5 text-xs sm:text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Nova Ficha
          </PaperButton>
        </div>
      </div>

      {/* Painel Expansível de Filtros e Ordenação */}
      {showFilters && (
        <div className="p-3.5 rounded border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] flex flex-wrap items-center gap-4 text-xs">
          {/* Ordenação */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#6b6458] dark:text-[#9e9687]">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="py-1 px-2 rounded border border-[#cfc4b0] dark:border-[#3d362b] bg-white dark:bg-[#1a1714] text-[#312d26] dark:text-[#eee7db] text-xs focus:outline-hidden"
            >
              <option value="date-desc">Mais recentes primeiro</option>
              <option value="date-asc">Mais antigos primeiro</option>
              <option value="rating-desc">Maior avaliação</option>
              <option value="name-asc">Nome do vinho (A-Z)</option>
              <option value="vintage-desc">Safra mais recente</option>
            </select>
          </div>

          {/* Filtro por Estilo */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#6b6458] dark:text-[#9e9687]">Estilo:</span>
            <select
              value={selectedStyle}
              onChange={(e) => onStyleChange(e.target.value)}
              className="py-1 px-2 rounded border border-[#cfc4b0] dark:border-[#3d362b] bg-white dark:bg-[#1a1714] text-[#312d26] dark:text-[#eee7db] text-xs focus:outline-hidden capitalize"
            >
              <option value="all">Todos os estilos</option>
              {availableStyles.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por País */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#6b6458] dark:text-[#9e9687]">País:</span>
            <select
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="py-1 px-2 rounded border border-[#cfc4b0] dark:border-[#3d362b] bg-white dark:bg-[#1a1714] text-[#312d26] dark:text-[#eee7db] text-xs focus:outline-hidden"
            >
              <option value="all">Todos os países</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Nota */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#6b6458] dark:text-[#9e9687]">Nota:</span>
            <select
              value={selectedRating}
              onChange={(e) =>
                onRatingChange(
                  e.target.value === 'all'
                    ? 'all'
                    : (Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                )
              }
              className="py-1 px-2 rounded border border-[#cfc4b0] dark:border-[#3d362b] bg-white dark:bg-[#1a1714] text-[#312d26] dark:text-[#eee7db] text-xs focus:outline-hidden"
            >
              <option value="all">Todas as notas</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'estrela' : 'estrelas'}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tag */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#6b6458] dark:text-[#9e9687]">Tag:</span>
            <select
              value={selectedTag}
              onChange={(e) => onTagChange(e.target.value)}
              className="py-1 px-2 rounded border border-[#cfc4b0] dark:border-[#3d362b] bg-white dark:bg-[#1a1714] text-[#312d26] dark:text-[#eee7db] text-xs focus:outline-hidden"
            >
              <option value="">Todas as tags</option>
              {availableTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Limpar filtros */}
          {(selectedCountry !== 'all' ||
            selectedStyle !== 'all' ||
            selectedRating !== 'all' ||
            selectedTag !== '') && (
            <button
              type="button"
              onClick={() => {
                onCountryChange('all');
                onStyleChange('all');
                onRatingChange('all');
                onTagChange('');
              }}
              className="text-[#793b46] dark:text-[#b05e6e] font-medium hover:underline ml-auto"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-xs text-[#6b6458] dark:text-[#9e9687] px-1">
        <span>
          Exibindo {totalFiltered} {totalFiltered === 1 ? 'ficha' : 'fichas'}
          {totalFiltered !== totalAll && ` (de um total de ${totalAll})`}
        </span>
      </div>
    </div>
  );
};
