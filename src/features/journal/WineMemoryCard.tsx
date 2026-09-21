import React from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { countryName } from '../../domain/countries';
import { BottleArt } from '../../components/proto/BottleArt';
import { Icon } from '../../components/proto/Sprite';
import { Stars, shortDate } from '../../components/proto/bits';
import { usePhotoUrl } from './usePhotoUrl';

interface WineCardProps {
  entry: WineEntry;
  readPhoto: (id: string) => Promise<Blob | undefined>;
  onSelect: (entry: WineEntry) => void;
  onToggleFavorite: (entry: WineEntry) => void;
}

function styleLabel(entry: WineEntry): { text: string; cls: string } {
  if (entry.tipo === 'espumante') return { text: 'Espumante', cls: 'espumante' };
  if (entry.estilo === 'tinto') return { text: 'Tinto', cls: 'tinto' };
  if (entry.estilo === 'branco') return { text: 'Branco', cls: 'branco' };
  if (entry.estilo === 'rose') return { text: 'Rosé', cls: 'rose' };
  return { text: 'ANOTAÇÃO', cls: '' };
}

/** Cartão de memória no estilo scrapbook do protótipo (fita, rótulo ilustrado, nota manuscrita). */
export const WineMemoryCard: React.FC<WineCardProps> = ({
  entry,
  readPhoto,
  onSelect,
  onToggleFavorite,
}) => {
  const photoUrl = usePhotoUrl(entry.photoId, readPhoto);
  const style = styleLabel(entry);
  const title = entry.vinho || entry.produtor || 'Página sem título';
  const country = entry.origin?.countryCode
    ? countryName(entry.origin.countryCode)
    : 'Origem a descobrir';
  const subtitle =
    [entry.uvas, entry.origin?.region || entry.regiaoPais].filter(Boolean).join(' · ') ||
    'Uma descoberta para detalhar';
  const note =
    entry.conclusao?.impressaoFinal || 'Uma página aberta para a próxima anotação.';

  return (
    <article className="wine-card" data-id={entry.id}>
      <span className="tape" aria-hidden="true" />
      <div className="card-visual">
        <button
          type="button"
          className="visual-open"
          aria-label={`Abrir ficha de ${title}`}
          onClick={() => onSelect(entry)}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Foto de rótulo adicionada por você" loading="lazy" />
          ) : (
            <BottleArt entry={entry} />
          )}
        </button>
        <button
          type="button"
          className="bookmark"
          aria-label={`${entry.favorite ? 'Remover dos' : 'Adicionar aos'} favoritos: ${title}`}
          aria-pressed={Boolean(entry.favorite)}
          onClick={() => onToggleFavorite(entry)}
        >
          <Icon name="bookmark" />
        </button>
        <span className={`card-type ${style.cls}`}>{style.text}</span>
        {entry._demo && <span className="card-demo">EXEMPLO</span>}
      </div>
      <div className="card-body">
        <div className="card-overline mono">
          <span>{country}</span>
          <span>{entry.safra || 'S / SAFRA'}</span>
        </div>
        <button type="button" className="card-title" onClick={() => onSelect(entry)}>
          {title}
        </button>
        <p className="card-subtitle">{subtitle}</p>
        <p className="card-note">“{note}”</p>
        <div className="card-bottom">
          <Stars rating={entry.conclusao?.avaliacaoEstrelas ?? null} />
          <span className="card-date">{shortDate(entry.dataDegustacao)}</span>
          <button
            type="button"
            className="card-open"
            aria-label={`Abrir página de ${title}`}
            onClick={() => onSelect(entry)}
          >
            <span>Abrir</span>
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    </article>
  );
};
