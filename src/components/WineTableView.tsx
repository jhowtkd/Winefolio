import React from 'react';
import type { WineEntry } from '../domain/wine-entry';
import { WineGlassVisual } from './WineGlassVisual';
import { Eye, Edit3, Trash2, Star, Tag, Heart } from 'lucide-react';
import { usePhotoUrl } from '../features/journal/usePhotoUrl';
import { InkStamp } from './ui/InkStamp';

interface WineTableRowProps {
  wine: WineEntry;
  readPhoto?: (id: string) => Promise<Blob | undefined>;
  onOpenSheet: (sheet: WineEntry) => void;
  onEdit: (sheet: WineEntry) => void;
  onDelete: (id: string) => void;
  onSelectTag?: (tag: string) => void;
}

const WineTableRow: React.FC<WineTableRowProps> = ({
  wine,
  readPhoto,
  onOpenSheet,
  onEdit,
  onDelete,
  onSelectTag,
}) => {
  const photoUrl = usePhotoUrl(wine.photoId, readPhoto || (() => Promise.resolve(undefined)));

  return (
    <tr
      className="hover:bg-[#eae1cd]/40 dark:hover:bg-[#2c271f] transition group cursor-pointer border-b border-[#cfc4b0]/40 dark:border-[#3d362b]"
      onClick={() => onOpenSheet(wine)}
    >
      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center" onClick={() => onOpenSheet(wine)}>
          {photoUrl ? (
            <div
              className="w-8 h-11 rounded-xs overflow-hidden border border-[#cfc4b0] shadow-2xs group-hover:scale-105 transition-transform bg-[#ede5d4]"
              title="Ver rótulo e ficha"
            >
              <img
                src={photoUrl}
                alt="Rótulo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : wine.origin?.countryCode ? (
            <InkStamp label={wine.origin.countryCode} size="sm" tone="wine" />
          ) : (
            <WineGlassVisual
              colorHex={wine.visual?.corHex}
              style={wine.estilo || undefined}
              size="sm"
            />
          )}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[#312d26] dark:text-[#eee7db] block group-hover:text-[#793b46] dark:group-hover:text-[#b05e6e] transition font-serif">
            {wine.vinho || wine.produtor || 'Vinho Sem Nome'}
          </span>
          {wine.favorite && <Heart className="w-3 h-3 text-[#793b46] fill-current" />}
        </div>
        {wine.vinho && wine.produtor && (
          <span className="text-xs text-[#6b6458] dark:text-[#9e9687] block uppercase tracking-wider text-[10px]">
            {wine.produtor}
          </span>
        )}
      </td>
      <td className="py-2.5 px-3 font-mono-code text-xs text-[#312d26] dark:text-[#eee7db]">
        {wine.safra || '—'}
      </td>
      <td className="py-2.5 px-3 text-[#312d26] dark:text-[#eee7db] text-xs">
        {wine.uvas || '—'}
      </td>
      <td className="py-2.5 px-3 text-[#6b6458] dark:text-[#9e9687] text-xs">
        {wine.regiaoPais || '—'}
      </td>
      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
        {wine.tags && wine.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[180px]">
            {wine.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag?.(tag)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#f2ecdf] dark:bg-[#2e2820] hover:bg-[#eae1cd] text-[#312d26] dark:text-[#eee7db] border border-[#cfc4b0]/70 rounded text-[10px] font-medium transition cursor-pointer"
                title={`Filtrar por "${tag}"`}
              >
                <Tag className="w-2.5 h-2.5 text-stone-400" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        ) : (
          <span className="text-stone-400 text-xs">—</span>
        )}
      </td>
      <td className="py-2.5 px-3 text-xs text-[#6b6458] dark:text-[#9e9687] max-w-[200px] truncate">
        {wine.conclusao?.impressaoFinal || wine.olfato?.aromas || '—'}
      </td>
      <td className="py-2.5 px-3 whitespace-nowrap">
        {wine.conclusao?.avaliacaoEstrelas ? (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${
                  star <= wine.conclusao.avaliacaoEstrelas!
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-[#cfc4b0]'
                }`}
              />
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-[#6b6458] italic">—</span>
        )}
      </td>
      <td className="py-2.5 px-3 font-mono-code text-xs text-[#6b6458] dark:text-[#9e9687] whitespace-nowrap">
        {wine.dataDegustacao || '—'}
      </td>
      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onOpenSheet(wine)}
            className="p-1.5 text-stone-500 hover:text-[#793b46] hover:bg-[#eae1cd]/60 rounded"
            title="Ver ficha completa"
            aria-label="Ver ficha completa"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(wine)}
            className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-[#eae1cd]/60 rounded"
            title="Editar ficha"
            aria-label="Editar ficha"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(wine.id)}
            className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
            title="Excluir ficha"
            aria-label="Excluir ficha"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export interface WineTableViewProps {
  wines: WineEntry[];
  readPhoto?: (id: string) => Promise<Blob | undefined>;
  onOpenSheet: (sheet: WineEntry) => void;
  onEdit: (sheet: WineEntry) => void;
  onDelete: (id: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const WineTableView: React.FC<WineTableViewProps> = ({
  wines,
  readPhoto,
  onOpenSheet,
  onEdit,
  onDelete,
  onSelectTag,
}) => {
  return (
    <div className="bg-[#fffaf0] dark:bg-[#25221d] border border-[#cfc4b0] dark:border-[#3d362b] rounded-xs shadow-xs overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#f2ecdf] dark:bg-[#1c1916] border-b border-[#cfc4b0] dark:border-[#3d362b] text-[#6b6458] dark:text-[#9e9687] uppercase text-[10px] tracking-wider font-mono-code">
              <th className="py-3 px-3 font-bold text-center w-14">Visual</th>
              <th className="py-3 px-3 font-bold">Vinho & Produtor</th>
              <th className="py-3 px-3 font-bold">Safra</th>
              <th className="py-3 px-3 font-bold">Uva(s)</th>
              <th className="py-3 px-3 font-bold">Região / País</th>
              <th className="py-3 px-3 font-bold">Tags</th>
              <th className="py-3 px-3 font-bold">Notas</th>
              <th className="py-3 px-3 font-bold">Avaliação</th>
              <th className="py-3 px-3 font-bold">Data</th>
              <th className="py-3 px-3 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#cfc4b0]/30 dark:divide-[#3d362b]">
            {wines.map((wine) => (
              <WineTableRow
                key={wine.id}
                wine={wine}
                readPhoto={readPhoto}
                onOpenSheet={onOpenSheet}
                onEdit={onEdit}
                onDelete={onDelete}
                onSelectTag={onSelectTag}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
