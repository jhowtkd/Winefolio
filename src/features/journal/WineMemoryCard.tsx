import React from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { PaperSurface } from '../../components/ui/PaperSurface';
import { InkStamp } from '../../components/ui/InkStamp';
import { DemoBottleArt } from './DemoBottleArt';
import { usePhotoUrl } from './usePhotoUrl';
import { Star, Heart, Calendar, Tag, MoreVertical, Edit2, Copy, Trash2 } from 'lucide-react';

interface WineMemoryCardProps {
  entry: WineEntry;
  readPhoto: (id: string) => Promise<Blob | undefined>;
  onSelect: (entry: WineEntry) => void;
  onEdit: (entry: WineEntry) => void;
  onDuplicate: (entry: WineEntry) => void;
  onToggleFavorite: (entry: WineEntry) => void;
  onDelete: (entry: WineEntry) => void;
}

export const WineMemoryCard: React.FC<WineMemoryCardProps> = ({
  entry,
  readPhoto,
  onSelect,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onDelete,
}) => {
  const photoUrl = usePhotoUrl(entry.photoId, readPhoto);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const countryCode = entry.origin?.countryCode || null;
  const rating = entry.conclusao?.avaliacaoEstrelas ?? null;
  const wineTitle = entry.vinho || entry.produtor || 'Vinho Sem Nome';
  const producer = entry.vinho && entry.produtor ? entry.produtor : '';

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.menu-container')) {
      return;
    }
    onSelect(entry);
  };

  return (
    <PaperSurface
      material="sheet"
      onClick={handleCardClick}
      className="group relative flex flex-col overflow-hidden border border-[#cfc4b0] dark:border-[#3d362b] rounded-xs cursor-pointer hover:shadow-md transition-all duration-200"
    >
      {/* Tape decorativa no canto */}
      <div className="tape hidden group-hover:block" />

      {/* Cabeçalho de Mídia / Rótulo */}
      <div className="relative h-44 sm:h-48 w-full bg-[#ede5d4] dark:bg-[#1f1b16] border-b border-[#cfc4b0]/70 dark:border-[#3d362b] overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Rótulo de ${wineTitle}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <DemoBottleArt
            tipo={entry.tipo}
            estilo={entry.estilo}
            corHex={entry.visual?.corHex}
            className="h-full"
          />
        )}

        {/* Selo do País ou Estilo */}
        {countryCode && (
          <div className="absolute top-2.5 left-2.5">
            <InkStamp label={countryCode} size="sm" tone="wine" />
          </div>
        )}

        {/* Badge Demo se aplicável */}
        {entry.kind === 'demo' && (
          <div className="absolute top-2.5 right-11 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#efe4c8] text-[#793b46] border border-[#cfc4b0] shadow-xs">
            DEMO
          </div>
        )}

        {/* Botão de Favorito */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(entry);
          }}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full transition-transform active:scale-90 ${
            entry.favorite
              ? 'bg-[#793b46] text-[#fffaf0] shadow-sm'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-300 hover:text-[#793b46]'
          }`}
          title={entry.favorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
          aria-label={entry.favorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
        >
          <Heart className={`w-3.5 h-3.5 ${entry.favorite ? 'fill-current' : ''}`} />
        </button>

        {/* Estilo e Tipo badge inferior na imagem */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 flex-wrap">
          {entry.tipo === 'espumante' ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f2ecdf]/90 dark:bg-[#1a1714]/90 text-[#312d26] dark:text-[#eee7db] backdrop-blur-[2px] border border-[#cfc4b0]/70">
              Espumante
            </span>
          ) : entry.estilo ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium capitalize bg-[#f2ecdf]/90 dark:bg-[#1a1714]/90 text-[#312d26] dark:text-[#eee7db] backdrop-blur-[2px] border border-[#cfc4b0]/70">
              {entry.estilo}
            </span>
          ) : null}

          {entry.safra && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-[#f2ecdf]/90 dark:bg-[#1a1714]/90 text-[#312d26] dark:text-[#eee7db] backdrop-blur-[2px] border border-[#cfc4b0]/70">
              {entry.safra}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo textual da ficha */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {producer && (
            <p className="text-[11px] font-medium tracking-wide uppercase text-[#6b6458] dark:text-[#9e9687] truncate">
              {producer}
            </p>
          )}

          <h3 className="font-serif text-base sm:text-lg font-bold text-[#312d26] dark:text-[#eee7db] leading-snug line-clamp-2">
            {wineTitle}
          </h3>

          {entry.uvas && (
            <p className="text-xs text-[#5d6b4f] dark:text-[#8b9c79] truncate font-medium">
              {entry.uvas}
            </p>
          )}

          {entry.regiaoPais && (
            <p className="text-xs text-[#6b6458] dark:text-[#9e9687] truncate">
              {entry.regiaoPais}
            </p>
          )}
        </div>

        {/* Avaliação por estrelas */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  rating !== null && star <= rating
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-[#cfc4b0] dark:text-[#42392c]'
                }`}
              />
            ))}
            {rating === null && (
              <span className="text-[10px] italic text-[#6b6458] dark:text-[#9e9687] ml-1">
                (sem nota)
              </span>
            )}
          </div>

          {/* Data */}
          <div className="flex items-center gap-1 text-[11px] text-[#6b6458] dark:text-[#9e9687]">
            <Calendar className="w-3 h-3 opacity-70" />
            <span>{entry.dataDegustacao}</span>
          </div>
        </div>

        {/* Chips de Aromas / Tags */}
        {entry.aromaTags && entry.aromaTags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1">
            {entry.aromaTags.slice(0, 3).map((aroma, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[10px] rounded-full bg-[#f2ecdf] dark:bg-[#2e2820] text-[#312d26] dark:text-[#eee7db] border border-[#cfc4b0]/70"
              >
                {aroma}
              </span>
            ))}
            {entry.aromaTags.length > 3 && (
              <span className="text-[10px] text-[#6b6458] dark:text-[#9e9687]">
                +{entry.aromaTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Rodapé com menu de ações */}
        <div className="pt-2 border-t border-[#cfc4b0]/40 dark:border-[#3d362b] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(entry);
            }}
            className="text-xs font-semibold text-[#793b46] dark:text-[#b05e6e] hover:underline"
          >
            Abrir ficha &rarr;
          </button>

          <div className="relative menu-container">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 bottom-full mb-1 w-36 py-1 bg-white dark:bg-[#25221d] border border-[#cfc4b0] dark:border-[#42392c] rounded shadow-lg z-20 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(entry);
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#f2ecdf] dark:hover:bg-[#2e2820]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(entry);
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#f2ecdf] dark:hover:bg-[#2e2820]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(entry);
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PaperSurface>
  );
};
