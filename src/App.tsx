import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WineTastingSheet, WineStyle } from './types';
import { getSavedWines, saveWines, exportWinesAsJson, importWinesFromJson } from './utils/storage';
import { INITIAL_WINES } from './data/sommelierData';
import { WineCard } from './components/WineCard';
import { WineTableView } from './components/WineTableView';
import { TastingSheetView } from './components/TastingSheetView';
import { TastingFormModal } from './components/TastingFormModal';
import { RatingDistributionChart } from './components/RatingDistributionChart';
import { ThemeToggle } from './components/ThemeToggle';
import { motion } from 'motion/react';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Download,
  Upload,
  Wine,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Tag,
  X,
} from 'lucide-react';

const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export default function App() {
  const [wines, setWines] = useState<WineTastingSheet[]>(() => {
    try {
      return getSavedWines();
    } catch {
      return INITIAL_WINES;
    }
  });
  const [activeSheet, setActiveSheet] = useState<WineTastingSheet | null>(null);
  const [editingSheet, setEditingSheet] = useState<WineTastingSheet | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [startWithScanner, setStartWithScanner] = useState(false);
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'todos' | WineStyle | 'espumante'>('todos');
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [chartSelectedRating, setChartSelectedRating] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved wines on mount as safeguard
  useEffect(() => {
    const loaded = getSavedWines();
    if (loaded && loaded.length > 0) {
      setWines(loaded);
    }
  }, []);

  // Save whenever wines changes
  const updateWinesList = (newList: WineTastingSheet[]) => {
    setWines(newList);
    saveWines(newList);
  };

  const handleSaveSheet = (sheet: WineTastingSheet) => {
    const exists = wines.some((w) => w.id === sheet.id);
    let updated: WineTastingSheet[];
    if (exists) {
      updated = wines.map((w) => (w.id === sheet.id ? sheet : w));
    } else {
      updated = [sheet, ...wines];
    }
    updateWinesList(updated);
    setIsCreatingNew(false);
    setEditingSheet(null);
    setStartWithScanner(false);
    setActiveSheet(sheet); // open the saved sheet right away for preview!
  };

  const handleDeleteSheet = (id: string) => {
    const updated = wines.filter((w) => w.id !== id);
    updateWinesList(updated);
    if (activeSheet?.id === id) {
      setActiveSheet(null);
    }
  };

  const handleResetToDemo = () => {
    if (
      window.confirm(
        'Deseja restaurar as fichas de exemplo originais (incluindo o Terrazas Chardonnay da sua ficha)?'
      )
    ) {
      updateWinesList(INITIAL_WINES);
      setActiveSheet(null);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const merged = importWinesFromJson(text, wines);
        setWines(merged);
        alert(`Importação realizada com sucesso! Total de ${merged.length} vinhos.`);
      } catch (err: any) {
        alert(`Erro ao importar: ${err.message || 'Arquivo inválido'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Collect all unique tags with count
  const allTagsWithCounts = useMemo(() => {
    const counts = new Map<string, number>();
    wines.forEach((w) => {
      (w.tags || []).forEach((t) => {
        const trimmed = t.trim();
        if (trimmed) {
          counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
        }
      });
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [wines]);

  const allTagNames = useMemo(() => {
    return allTagsWithCounts.map((t) => t.tag);
  }, [allTagsWithCounts]);

  // Filtered wines
  const filteredWines = useMemo(() => {
    return wines.filter((w) => {
      // Style filter
      if (selectedStyle === 'espumante') {
        if (w.tipo !== 'espumante') return false;
      } else if (selectedStyle !== 'todos') {
        if (w.estilo !== selectedStyle) return false;
      }

      // Rating filter (minimum stars dropdown)
      if (minRating > 0 && w.conclusao.avaliacaoEstrelas < minRating) {
        return false;
      }

      // Chart exact rating filter
      if (chartSelectedRating !== null && Number(w.conclusao.avaliacaoEstrelas) !== chartSelectedRating) {
        return false;
      }

      // Tag filter
      if (selectedTag) {
        const wineTags = w.tags || [];
        if (!wineTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
          return false;
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesProdutor = w.produtor.toLowerCase().includes(term);
        const matchesVinho = w.vinho.toLowerCase().includes(term);
        const matchesUvas = w.uvas.toLowerCase().includes(term);
        const matchesRegiao = w.regiaoPais.toLowerCase().includes(term);
        const matchesAromas = w.olfato.aromas.toLowerCase().includes(term);
        const matchesSafra = w.safra.toLowerCase().includes(term);
        const matchesNotas = w.conclusao.impressaoFinal.toLowerCase().includes(term);
        const matchesTags = (w.tags || []).some((t) => t.toLowerCase().includes(term));
        return (
          matchesProdutor ||
          matchesVinho ||
          matchesUvas ||
          matchesRegiao ||
          matchesAromas ||
          matchesSafra ||
          matchesNotas ||
          matchesTags
        );
      }

      return true;
    });
  }, [wines, selectedStyle, minRating, chartSelectedRating, selectedTag, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = wines.length;
    const brancos = wines.filter((w) => w.estilo === 'branco').length;
    const tintos = wines.filter((w) => w.estilo === 'tinto').length;
    const roses = wines.filter((w) => w.estilo === 'rose').length;
    const espumantes = wines.filter((w) => w.tipo === 'espumante').length;
    const totalTags = allTagsWithCounts.length;
    const avgStars =
      total > 0
        ? (wines.reduce((acc, w) => acc + (w.conclusao.avaliacaoEstrelas || 0), 0) / total).toFixed(1)
        : '0';

    return { total, brancos, tintos, roses, espumantes, totalTags, avgStars };
  }, [wines, allTagsWithCounts]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#121316] text-stone-800 dark:text-stone-100 flex flex-col selection:bg-rose-900 dark:selection:bg-[#7E1B2C] selection:text-white font-sans transition-colors duration-200">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {/* Main App Bar (Hidden on print) */}
      <header className="print:hidden sticky top-0 z-30 bg-white/90 dark:bg-[#161820]/95 backdrop-blur border-b border-stone-200/80 dark:border-[#282C38] shadow-2xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo & Title */}
          <div
            onClick={() => setActiveSheet(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-900 dark:bg-[#7E1B2C] text-white flex items-center justify-center shadow-xs group-hover:bg-rose-950 dark:group-hover:bg-[#962035] transition">
              <Wine className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold font-serif-title tracking-wide text-stone-900 dark:text-stone-100 leading-none">
                  Ficha de Degustação
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60">
                  Sommelier
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block mt-1">
                Caderno digital de anotações e fichas sensoriais de vinhos
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Dark Mode Night Toggle Button */}
            <ThemeToggle />

            <button
              id="btn-escanear-rotulo-topo"
              onClick={() => {
                setEditingSheet(null);
                setStartWithScanner(true);
                setIsCreatingNew(true);
              }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-rose-900 to-purple-900 hover:from-amber-700 hover:to-purple-950 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
              title="Escanear e ler rótulo com inteligência artificial"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="hidden xs:inline">Ler Rótulo (IA)</span>
            </button>

            <button
              id="btn-nova-ficha-topo"
              onClick={() => {
                setEditingSheet(null);
                setStartWithScanner(false);
                setIsCreatingNew(true);
              }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 dark:bg-[#7E1B2C] dark:hover:bg-[#962035] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Nova Ficha</span>
            </button>

            {/* Export / Backup Dropdown or Button */}
            <div className="flex items-center gap-1 border-l border-stone-200 dark:border-[#282C38] pl-1.5 sm:pl-2 ml-0.5 sm:ml-1">
              <button
                id="btn-exportar-json"
                onClick={() => exportWinesAsJson(wines)}
                className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-[#232733] hover:bg-stone-200/80 dark:hover:bg-[#2D3241] rounded-xl transition cursor-pointer"
                title="Exportar backup das fichas (JSON)"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                id="btn-importar-json"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-[#232733] hover:bg-stone-200/80 dark:hover:bg-[#2D3241] rounded-xl transition cursor-pointer"
                title="Importar fichas (JSON)"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* If Active Sheet is selected, show the full TastingSheetView replica */}
        {activeSheet ? (
          <TastingSheetView
            sheet={activeSheet}
            onClose={() => setActiveSheet(null)}
            onEdit={(sheet) => {
              setEditingSheet(sheet);
              setIsCreatingNew(true);
            }}
            onDelete={(id) => {
              handleDeleteSheet(id);
              setActiveSheet(null);
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Stats Overview Bar */}
            <div className="bg-white dark:bg-[#1A1C23] border border-stone-200/90 dark:border-[#282C38] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs transition-colors">
              <div className="flex items-center gap-4 sm:gap-6 divide-x divide-stone-200 dark:divide-[#282C38] text-xs sm:text-sm">
                <div className="pr-3 sm:pr-4">
                  <span className="text-stone-500 dark:text-stone-400 block text-[11px] uppercase tracking-wider font-semibold">
                    Total Degustado
                  </span>
                  <span className="text-xl font-bold font-serif-title text-stone-900 dark:text-stone-100">
                    {stats.total} {stats.total === 1 ? 'vinho' : 'vinhos'}
                  </span>
                </div>

                <div className="pl-3 sm:pl-4 pr-3 sm:pr-4 hidden sm:block">
                  <span className="text-stone-500 dark:text-stone-400 block text-[11px] uppercase tracking-wider font-semibold mb-1.5">
                    Estilos
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-[#34141B] text-rose-950 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/60">
                      🍷 {stats.tintos} Tintos
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-[#2F2916] text-amber-950 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/60">
                      🥂 {stats.brancos} Brancos
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 dark:bg-[#32162E] text-pink-950 dark:text-pink-200 border border-pink-200/80 dark:border-pink-900/60">
                      🌸 {stats.roses} Rosés
                    </span>
                  </div>
                </div>

                <div className="pl-3 sm:pl-4 hidden md:block">
                  <span className="text-stone-500 dark:text-stone-400 block text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Média de Avaliação
                  </span>
                  <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-serif">
                    ★ {stats.avgStars} <span className="text-xs text-stone-400 dark:text-stone-500 font-normal">/ 5.0</span>
                  </span>
                </div>

                {stats.totalTags > 0 && (
                  <div className="pl-3 sm:pl-4 hidden lg:block">
                    <span className="text-stone-500 dark:text-stone-400 block text-[11px] uppercase tracking-wider font-semibold">
                      Tags Ativas
                    </span>
                    <span className="text-base font-bold text-rose-900 dark:text-rose-300">
                      🏷️ {stats.totalTags} {stats.totalTags === 1 ? 'tag' : 'tags'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-restaurar-demo"
                  onClick={handleResetToDemo}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-[#232733] hover:bg-stone-200/80 dark:hover:bg-[#2D3241] rounded-xl transition cursor-pointer"
                  title="Restaurar ficha original da foto (Terrazas Chardonnay)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exemplo da Ficha</span>
                </button>

                <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#232733] p-1 rounded-xl border border-stone-200/80 dark:border-[#282C38]">
                  <button
                    id="btn-layout-grid"
                    onClick={() => setViewLayout('grid')}
                    className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      viewLayout === 'grid'
                        ? 'bg-white dark:bg-[#1A1C23] text-rose-900 dark:text-rose-300 shadow-2xs'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    title="Visualização em Cartões"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    id="btn-layout-table"
                    onClick={() => setViewLayout('table')}
                    className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      viewLayout === 'table'
                        ? 'bg-white dark:bg-[#1A1C23] text-rose-900 dark:text-rose-300 shadow-2xs'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    title="Visualização em Lista / Tabela"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Rating Distribution Bar Chart Component */}
            <RatingDistributionChart
              wines={wines}
              selectedRating={chartSelectedRating}
              onSelectRating={(r) => setChartSelectedRating(r)}
            />

            {/* Search & Style Filter Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 z-10 pointer-events-none" />
                  <input
                    id="input-busca-vinhos"
                    type="text"
                    placeholder="Buscar por produtor, vinho, uva, região, safra, tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-16 py-2.5 bg-white dark:bg-[#1A1C23] border border-stone-200 dark:border-[#282C38] rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-800/80 focus:border-rose-800 shadow-2xs transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 z-10 cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Style Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                  {(
                    [
                      { id: 'todos', label: 'Todos' },
                      { id: 'tinto', label: 'Tintos' },
                      { id: 'branco', label: 'Brancos' },
                      { id: 'rose', label: 'Rosés' },
                      { id: 'espumante', label: 'Espumantes' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      id={`filtro-${item.id}`}
                      onClick={() => setSelectedStyle(item.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                        selectedStyle === item.id
                          ? 'bg-rose-900 dark:bg-[#7E1B2C] text-white border-rose-900 dark:border-[#7E1B2C] shadow-xs'
                          : 'bg-white dark:bg-[#1A1C23] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-[#282C38] hover:bg-stone-100 dark:hover:bg-[#232733]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}

                  {/* Min Stars Filter */}
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="px-3 py-2 bg-white dark:bg-[#1A1C23] border border-stone-200 dark:border-[#282C38] rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-800/80 cursor-pointer shadow-2xs"
                  >
                    <option value={0} className="dark:bg-[#1A1C23] dark:text-stone-200">Todas as notas</option>
                    <option value={3} className="dark:bg-[#1A1C23] dark:text-stone-200">★ 3+ estrelas</option>
                    <option value={4} className="dark:bg-[#1A1C23] dark:text-stone-200">★ 4+ estrelas</option>
                    <option value={5} className="dark:bg-[#1A1C23] dark:text-stone-200">★ 5 estrelas</option>
                  </select>
                </div>
              </div>

              {/* Custom Tags Filter Row */}
              {allTagsWithCounts.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs pt-1">
                  <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider text-[11px] shrink-0 pl-1">
                    <Tag className="w-3.5 h-3.5 text-rose-900 dark:text-rose-400" />
                    <span>Tags:</span>
                  </div>

                  <button
                    id="filtro-tag-todas"
                    onClick={() => setSelectedTag(null)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                      selectedTag === null
                        ? 'bg-rose-900 dark:bg-[#7E1B2C] text-white border-rose-900 dark:border-[#7E1B2C]'
                        : 'bg-white dark:bg-[#1A1C23] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-[#282C38] hover:bg-stone-100 dark:hover:bg-[#232733]'
                    }`}
                  >
                    Todas as tags
                  </button>

                  {allTagsWithCounts.map(({ tag, count }) => {
                    const isSelected = selectedTag?.toLowerCase() === tag.toLowerCase();
                    return (
                      <button
                        key={tag}
                        id={`filtro-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setSelectedTag(isSelected ? null : tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-rose-900 dark:bg-[#7E1B2C] text-white border-rose-900 dark:border-[#7E1B2C] shadow-2xs'
                            : 'bg-white dark:bg-[#1A1C23] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-[#282C38] hover:bg-stone-100 dark:hover:bg-[#232733]'
                        }`}
                        title={`Filtrar fichas pela tag "${tag}"`}
                      >
                        #{tag} <span className="opacity-75 text-[11px]">({count})</span>
                      </button>
                    );
                  })}

                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 underline underline-offset-2 shrink-0 px-1 cursor-pointer"
                    >
                      Limpar filtro de tag
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* List / Cards Results */}
            {filteredWines.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1C23] border border-stone-200 dark:border-[#282C38] rounded-2xl p-10 text-center max-w-md mx-auto my-8 space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-rose-50 dark:bg-[#34141B] text-rose-900 dark:text-rose-300 rounded-full flex items-center justify-center mx-auto">
                  <Wine className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif-title text-stone-900 dark:text-stone-100">
                    Nenhum vinho encontrado
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {searchTerm || selectedStyle !== 'todos' || minRating > 0 || selectedTag || chartSelectedRating !== null
                      ? 'Nenhuma ficha corresponde aos filtros aplicados.'
                      : 'Você ainda não registrou nenhuma ficha de degustação.'}
                  </p>
                </div>
                {searchTerm || selectedStyle !== 'todos' || minRating > 0 || selectedTag || chartSelectedRating !== null ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedStyle('todos');
                      setMinRating(0);
                      setSelectedTag(null);
                      setChartSelectedRating(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-[#232733] hover:bg-stone-200 dark:hover:bg-[#2D3241] rounded-xl transition cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingSheet(null);
                      setIsCreatingNew(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-950 dark:bg-[#7E1B2C] dark:hover:bg-[#962035] text-white text-sm font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Criar Primeira Ficha</span>
                  </button>
                )}
              </div>
            ) : viewLayout === 'grid' ? (
              <motion.div
                key={`grid-${selectedStyle}-${minRating}-${selectedTag || 'all'}-${chartSelectedRating ?? 'all'}-${searchTerm}`}
                variants={gridContainerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredWines.map((wine, idx) => (
                  <WineCard
                    key={wine.id}
                    sheet={wine}
                    index={idx}
                    onOpenSheet={(sheet) => setActiveSheet(sheet)}
                    onEdit={(sheet) => {
                      setEditingSheet(sheet);
                      setIsCreatingNew(true);
                    }}
                    onDelete={handleDeleteSheet}
                    onSelectTag={(tag) => setSelectedTag(tag)}
                  />
                ))}
              </motion.div>
            ) : (
              <WineTableView
                wines={filteredWines}
                onOpenSheet={(sheet) => setActiveSheet(sheet)}
                onEdit={(sheet) => {
                  setEditingSheet(sheet);
                  setIsCreatingNew(true);
                }}
                onDelete={handleDeleteSheet}
                onSelectTag={(tag) => setSelectedTag(tag)}
              />
            )}
          </div>
        )}
      </main>

      {/* Tasting Form Modal */}
      {isCreatingNew && (
        <TastingFormModal
          initialData={editingSheet}
          availableTags={allTagNames}
          onSave={handleSaveSheet}
          autoOpenScanner={startWithScanner}
          onCancel={() => {
            setIsCreatingNew(false);
            setEditingSheet(null);
            setStartWithScanner(false);
          }}
        />
      )}

      {/* Footer */}
      <footer className="print:hidden border-t border-stone-200 dark:border-[#282C38] bg-white dark:bg-[#161820] py-6 mt-12 text-center text-xs text-stone-500 dark:text-stone-400 transition-colors">
        <p className="font-serif-title text-stone-800 dark:text-stone-200 font-semibold mb-1">
          Ficha de Degustação de Vinhos • Sommelier Journal
        </p>
        <p className="mt-1">Inspirado na ficha técnica oficial de degustação sensorial de vinhos.</p>
      </footer>
    </div>
  );
}
