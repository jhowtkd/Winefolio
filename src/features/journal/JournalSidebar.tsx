import React from 'react';
import type { CollectionStats } from '../../domain/collection';
import { PaperSurface } from '../../components/ui/PaperSurface';
import { InkStamp } from '../../components/ui/InkStamp';
import { Award, BookOpen, Globe2, Sparkles, Wine } from 'lucide-react';

interface JournalSidebarProps {
  stats: CollectionStats;
  aromaFrequencies: Array<{ aroma: string; count: number }>;
  onSelectAroma: (aroma: string) => void;
  selectedAroma?: string;
}

export const JournalSidebar: React.FC<JournalSidebarProps> = ({
  stats,
  aromaFrequencies,
  onSelectAroma,
  selectedAroma,
}) => {
  return (
    <aside className="w-full lg:w-72 space-y-5 shrink-0">
      {/* Resumo do Caderno */}
      <PaperSurface
        material="kraft"
        className="p-4 rounded-xs border border-[#cfc4b0] dark:border-[#42392c] space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#312d26]/15 dark:border-[#eee7db]/15 pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#793b46] dark:text-[#b05e6e]" />
            <h4 className="font-serif font-bold text-sm tracking-wide text-[#312d26] dark:text-[#eee7db]">
              Caderno de Memórias
            </h4>
          </div>
          <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
            v1.1
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded bg-[#fffaf0]/80 dark:bg-[#1f1b16]/80 border border-[#cfc4b0]/60 dark:border-[#3d362b]">
            <div className="font-serif text-xl font-bold text-[#793b46] dark:text-[#b05e6e]">
              {stats.total}
            </div>
            <div className="text-[11px] text-[#6b6458] dark:text-[#9e9687]">Fichas</div>
          </div>

          <div className="p-2.5 rounded bg-[#fffaf0]/80 dark:bg-[#1f1b16]/80 border border-[#cfc4b0]/60 dark:border-[#3d362b]">
            <div className="font-serif text-xl font-bold text-[#b3674c] dark:text-[#c97c62]">
              {stats.favorites}
            </div>
            <div className="text-[11px] text-[#6b6458] dark:text-[#9e9687]">Favoritos</div>
          </div>

          <div className="p-2.5 rounded bg-[#fffaf0]/80 dark:bg-[#1f1b16]/80 border border-[#cfc4b0]/60 dark:border-[#3d362b]">
            <div className="font-serif text-xl font-bold text-[#5d6b4f] dark:text-[#8b9c79]">
              {stats.countriesCount}
            </div>
            <div className="text-[11px] text-[#6b6458] dark:text-[#9e9687]">Países</div>
          </div>

          <div className="p-2.5 rounded bg-[#fffaf0]/80 dark:bg-[#1f1b16]/80 border border-[#cfc4b0]/60 dark:border-[#3d362b]">
            <div className="font-serif text-xl font-bold text-[#312d26] dark:text-[#eee7db]">
              {stats.distinctGrapesCount}
            </div>
            <div className="text-[11px] text-[#6b6458] dark:text-[#9e9687]">Castas</div>
          </div>
        </div>

        {stats.averageRating && (
          <div className="flex items-center justify-between text-xs px-1 text-[#6b6458] dark:text-[#9e9687]">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Média geral:
            </span>
            <span className="font-bold text-[#312d26] dark:text-[#eee7db]">
              {stats.averageRating} / 5
            </span>
          </div>
        )}
      </PaperSurface>

      {/* Aromas Recorrentes */}
      {aromaFrequencies.length > 0 && (
        <PaperSurface
          material="sheet"
          className="p-4 rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#6b6458] dark:text-[#9e9687] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#793b46] dark:text-[#b05e6e]" />
              Aromas mais citados
            </h4>
            {selectedAroma && (
              <button
                type="button"
                onClick={() => onSelectAroma('')}
                className="text-[10px] text-[#793b46] hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {aromaFrequencies.slice(0, 15).map(({ aroma, count }) => {
              const isSelected = selectedAroma?.toLowerCase() === aroma.toLowerCase();
              return (
                <button
                  key={aroma}
                  type="button"
                  onClick={() => onSelectAroma(isSelected ? '' : aroma)}
                  className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#793b46] text-[#fffaf0] shadow-xs'
                      : 'bg-[#f2ecdf] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] hover:bg-[#eae1cd] border border-[#cfc4b0]/60'
                  }`}
                >
                  <span>{aroma}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </PaperSurface>
      )}

      {/* Citação / Vinho Sommelier Card */}
      <PaperSurface
        material="note"
        className="p-4 rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] space-y-2 text-xs relative overflow-hidden"
      >
        <div className="font-hand text-lg text-[#793b46] dark:text-[#b05e6e] leading-snug">
          "O vinho é a única obra de arte que se pode beber."
        </div>
        <p className="text-[11px] text-[#6b6458] dark:text-[#9e9687] italic">
          — Luis Fernando Verissimo
        </p>
      </PaperSurface>
    </aside>
  );
};
