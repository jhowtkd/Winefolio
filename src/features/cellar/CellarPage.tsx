import React, { useMemo, useState } from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { groupIntoCellar, type CellarBottle } from '../../domain/cellar';
import { styleLabel } from '../../domain/insights';
import { PaperSurface } from '../../components/ui/PaperSurface';
import { PaperButton } from '../../components/ui/PaperButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { InkStamp } from '../../components/ui/InkStamp';
import { Heart, Plus, Sparkles, Wine } from 'lucide-react';

interface CellarPageProps {
  entries: WineEntry[];
  onOpenEntry: (id: string) => void;
  onNewEntry: () => void;
  onLoadDemoWines: () => void;
}

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina',
  BR: 'Brasil',
  CL: 'Chile',
  FR: 'França',
  IT: 'Itália',
  ES: 'Espanha',
  PT: 'Portugal',
  US: 'Estados Unidos',
  DE: 'Alemanha',
  ZA: 'África do Sul',
  AU: 'Austrália',
  NZ: 'Nova Zelândia',
  UY: 'Uruguai',
};

function formatDate(value: string): string {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return 'Sem data';
  return `${day}/${month}/${year}`;
}

function Stars({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-[11px] text-[#8a7f6f]">Sem nota</span>;
  }
  const filled = Math.round(value);
  return (
    <span className="text-sm tracking-tight text-[#793b46] dark:text-[#e7b3bc]" aria-label={`${value} de 5`}>
      {'★'.repeat(filled)}
      <span className="text-[#cfc4b0] dark:text-[#4a4338]">{'★'.repeat(Math.max(0, 5 - filled))}</span>
      <span className="ml-1.5 text-[11px] font-mono-code text-[#6b6458] dark:text-[#9e9687]">{value.toFixed(1)}</span>
    </span>
  );
}

const BottleCard: React.FC<{ bottle: CellarBottle; onOpen: () => void }> = ({ bottle, onOpen }) => {
  const title = bottle.vinho || bottle.produtor || 'Garrafa sem nome';
  const country = bottle.countryCode ? COUNTRY_NAMES[bottle.countryCode] || bottle.countryCode : '';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left w-full"
    >
      <PaperSurface className="h-full p-4 sm:p-5 hover:-translate-y-0.5 transition-transform">
        <div className="flex items-start justify-between gap-3">
          <InkStamp
            label={bottle.countryCode || '—'}
            size="sm"
            tone={bottle.tipo === 'espumante' ? 'sage' : 'wine'}
            rotation={-8}
          />
          {bottle.favorite && (
            <Heart className="w-4 h-4 fill-[#793b46] text-[#793b46] dark:fill-[#e7b3bc] dark:text-[#e7b3bc]" />
          )}
        </div>
        <h3 className="mt-4 font-serif text-xl font-semibold leading-tight text-[#312d26] dark:text-[#eee7db]">
          {title}
        </h3>
        <p className="mt-1 text-sm text-[#6b6458] dark:text-[#9e9687]">
          {[bottle.produtor, bottle.safra].filter(Boolean).join(' · ') || 'Produtor não informado'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-[#6b6458] dark:text-[#9e9687]">
          <span className="rounded-full border border-[#cfc4b0] dark:border-[#3d362b] px-2 py-0.5">
            {styleLabel(bottle)}
          </span>
          {country && <span>{country}</span>}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <Stars value={bottle.averageRating} />
          <div className="text-right text-[11px] text-[#6b6458] dark:text-[#9e9687]">
            <p className="font-medium text-[#312d26] dark:text-[#eee7db]">
              {bottle.tastingCount} {bottle.tastingCount === 1 ? 'ficha' : 'fichas'}
            </p>
            <p>Última em {formatDate(bottle.lastTasted)}</p>
          </div>
        </div>
      </PaperSurface>
    </button>
  );
};

export const CellarPage: React.FC<CellarPageProps> = ({
  entries,
  onOpenEntry,
  onNewEntry,
  onLoadDemoWines,
}) => {
  const [query, setQuery] = useState('');
  const bottles = useMemo(() => groupIntoCellar(entries), [entries]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bottles;
    return bottles.filter((bottle) =>
      [bottle.vinho, bottle.produtor, bottle.safra, bottle.region, bottle.countryCode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [bottles, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#793b46] dark:text-[#e7b3bc]">Adega</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#312d26] dark:text-[#eee7db]">
            Garrafas do caderno
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#6b6458] dark:text-[#9e9687]">
            Cada rótulo reúne as fichas da mesma safra. A nota é a média das degustações.
          </p>
        </div>
        <PaperButton variant="primary" onClick={onNewEntry}>
          <Plus className="w-4 h-4" />
          Nova ficha
        </PaperButton>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Wine className="w-7 h-7 stroke-[1.5]" />}
          title="A adega ainda está vazia"
          description="Registre uma degustação para a garrafa aparecer aqui, ou carregue as fichas de exemplo."
          action={
            <div className="flex flex-col sm:flex-row gap-3">
              <PaperButton variant="primary" onClick={onNewEntry}>
                <Plus className="w-4 h-4" />
                Registrar primeiro vinho
              </PaperButton>
              <PaperButton variant="secondary" onClick={onLoadDemoWines}>
                <Sparkles className="w-4 h-4" />
                Carregar exemplos
              </PaperButton>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="sr-only" htmlFor="cellar-search">
              Buscar na adega
            </label>
            <input
              id="cellar-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por vinho, produtor, safra ou região"
              className="w-full sm:max-w-md px-3 py-2 text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] placeholder-[#8a7f6f]"
            />
            <p className="text-xs text-[#6b6458] dark:text-[#9e9687]">
              {visible.length} {visible.length === 1 ? 'garrafa' : 'garrafas'} · {entries.length}{' '}
              {entries.length === 1 ? 'ficha' : 'fichas'}
            </p>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title="Nenhuma garrafa encontrada"
              description="Nenhum rótulo corresponde a essa busca."
              action={
                <PaperButton variant="secondary" onClick={() => setQuery('')}>
                  Limpar busca
                </PaperButton>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((bottle) => (
                <BottleCard
                  key={bottle.key}
                  bottle={bottle}
                  onOpen={() => onOpenEntry(bottle.latestEntryId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
