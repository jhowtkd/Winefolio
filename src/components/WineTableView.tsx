import React from 'react';
import { WineTastingSheet } from '../types';
import { WineGlassVisual } from './WineGlassVisual';
import { Eye, Edit3, Trash2, Star, Tag } from 'lucide-react';

interface WineTableViewProps {
  wines: WineTastingSheet[];
  onOpenSheet: (sheet: WineTastingSheet) => void;
  onEdit: (sheet: WineTastingSheet) => void;
  onDelete: (id: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const WineTableView: React.FC<WineTableViewProps> = ({
  wines,
  onOpenSheet,
  onEdit,
  onDelete,
  onSelectTag,
}) => {
  return (
    <div className="bg-white dark:bg-[#1A1C23] border border-stone-200 dark:border-[#282C38] rounded-2xl shadow-xs overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/80 dark:bg-[#202430] border-b border-stone-200 dark:border-[#282C38] text-stone-600 dark:text-stone-300 uppercase text-[11px] tracking-wider">
              <th className="py-3.5 px-4 font-bold text-center w-16">Visual</th>
              <th className="py-3.5 px-4 font-bold">Produtor & Vinho</th>
              <th className="py-3.5 px-4 font-bold">Safra</th>
              <th className="py-3.5 px-4 font-bold">Uva(s)</th>
              <th className="py-3.5 px-4 font-bold">Região / País</th>
              <th className="py-3.5 px-4 font-bold">Tags</th>
              <th className="py-3.5 px-4 font-bold">Aromas & Notas</th>
              <th className="py-3.5 px-4 font-bold">Avaliação</th>
              <th className="py-3.5 px-4 font-bold">Data</th>
              <th className="py-3.5 px-4 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-[#282C38]">
            {wines.map((wine) => (
              <tr
                key={wine.id}
                className="hover:bg-stone-50/80 dark:hover:bg-[#232733] transition group cursor-pointer"
                onClick={() => onOpenSheet(wine)}
              >
                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center" onClick={() => onOpenSheet(wine)}>
                    {wine.fotoRotulo ? (
                      <div
                        className="w-8 h-11 rounded-md overflow-hidden border border-stone-200 dark:border-[#2C3140] shadow-2xs group-hover:scale-105 transition-transform bg-stone-100 dark:bg-stone-800"
                        title="Ver rótulo e ficha"
                      >
                        <img
                          src={wine.fotoRotulo}
                          alt="Rótulo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <WineGlassVisual
                        colorHex={wine.visual.corHex}
                        style={wine.estilo}
                        size="sm"
                      />
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block group-hover:text-rose-900 dark:group-hover:text-rose-300 transition font-serif-title">
                    {wine.produtor}
                  </span>
                  <span className="text-xs text-stone-600 dark:text-stone-400 block">
                    {wine.vinho || 'Vinho'}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-stone-700 dark:text-stone-300">
                  {wine.safra || '—'}
                </td>
                <td className="py-3 px-4 text-stone-700 dark:text-stone-300 text-xs">
                  {wine.uvas || '—'}
                </td>
                <td className="py-3 px-4 text-stone-600 dark:text-stone-400 text-xs">
                  {wine.regiaoPais || '—'}
                </td>
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  {wine.tags && wine.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {wine.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => onSelectTag?.(tag)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-100 dark:bg-[#282D3B] hover:bg-rose-50 dark:hover:bg-[#34141B] text-stone-700 dark:text-stone-300 hover:text-rose-900 dark:hover:text-rose-200 border border-stone-200 dark:border-[#353B4B] rounded text-[10px] font-medium transition cursor-pointer"
                          title={`Filtrar por "${tag}"`}
                        >
                          <Tag className="w-2.5 h-2.5 text-stone-400 dark:text-stone-500" />
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-stone-300 dark:text-stone-600 text-xs">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-stone-600 dark:text-stone-400 text-xs max-w-xs truncate italic">
                  {wine.olfato.aromas || wine.conclusao.impressaoFinal || '—'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                      {wine.conclusao.qualidade}
                    </span>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= wine.conclusao.avaliacaoEstrelas
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-200 dark:text-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-stone-500 dark:text-stone-400 font-mono text-xs whitespace-nowrap">
                  {wine.dataDegustacao}
                </td>
                <td
                  className="py-3 px-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onOpenSheet(wine)}
                      className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-rose-900 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-[#34141B] rounded-lg transition"
                      title="Ver Ficha"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(wine)}
                      className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#282D3B] rounded-lg transition"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir ${wine.produtor}?`)) {
                          onDelete(wine.id);
                        }
                      }}
                      className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
