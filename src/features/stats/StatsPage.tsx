import React, { useMemo } from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { getAromaFrequencies, getCollectionStats } from '../../domain/collection';
import {
  countryBreakdown,
  grapeBreakdown,
  ratingDistribution,
  styleBreakdown,
  tastingsByMonth,
} from '../../domain/insights';
import { PaperSurface } from '../../components/ui/PaperSurface';
import { PaperButton } from '../../components/ui/PaperButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

interface StatsPageProps {
  entries: WineEntry[];
  onOpenJournal: () => void;
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

function countryName(code: string): string {
  if (code === 'Sem país') return code;
  return COUNTRY_NAMES[code] || code;
}

const Meter: React.FC<{ label: string; count: number; max: number }> = ({ label, count, max }) => {
  const width = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-sm">
      <span className="truncate text-[#312d26] dark:text-[#eee7db]">{label}</span>
      <span className="h-2 rounded-full bg-[#efe4c8] dark:bg-[#3d362b] overflow-hidden">
        <span className="block h-full rounded-full bg-[#793b46] dark:bg-[#b05e6e]" style={{ width: `${width}%` }} />
      </span>
      <span className="text-right font-mono-code text-xs text-[#6b6458] dark:text-[#9e9687]">{count}</span>
    </div>
  );
};

export const StatsPage: React.FC<StatsPageProps> = ({ entries, onOpenJournal }) => {
  const stats = useMemo(() => getCollectionStats(entries), [entries]);
  const ratings = useMemo(() => ratingDistribution(entries), [entries]);
  const styles = useMemo(() => styleBreakdown(entries), [entries]);
  const grapes = useMemo(() => grapeBreakdown(entries), [entries]);
  const countries = useMemo(() => countryBreakdown(entries), [entries]);
  const months = useMemo(() => tastingsByMonth(entries), [entries]);
  const aromas = useMemo(() => getAromaFrequencies(entries).slice(0, 12), [entries]);

  const maxRating = Math.max(1, ...ratings.map((item) => item.count));
  const maxStyle = Math.max(1, ...styles.map((item) => item.count));
  const maxGrape = Math.max(1, ...grapes.map((item) => item.count));
  const maxCountry = Math.max(1, ...countries.map((item) => item.count));
  const maxMonth = Math.max(1, ...months.map((item) => item.count));

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-7 h-7 stroke-[1.5]" />}
        title="Ainda não há o que contar"
        description="As estatísticas aparecem depois da primeira ficha. Volte ao caderno para registrar uma degustação."
        action={
          <PaperButton variant="primary" onClick={onOpenJournal}>
            Abrir o caderno
          </PaperButton>
        }
      />
    );
  }

  const kpis = [
    { label: 'Fichas', value: String(stats.total) },
    { label: 'Favoritos', value: String(stats.favorites) },
    { label: 'Nota média', value: stats.averageRating === null ? '—' : stats.averageRating.toFixed(1) },
    { label: 'Estilo mais comum', value: stats.topStyle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#793b46] dark:text-[#e7b3bc]">Estatísticas</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#312d26] dark:text-[#eee7db]">
          O que o caderno mostra
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#6b6458] dark:text-[#9e9687]">
          Notas, estilos, uvas e o ritmo das degustações dos últimos seis meses.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((item) => (
          <PaperSurface key={item.label} className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-[#6b6458] dark:text-[#9e9687]">{item.label}</p>
            <p className="mt-2 font-serif text-2xl sm:text-3xl text-[#312d26] dark:text-[#eee7db]">{item.value}</p>
          </PaperSurface>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PaperSurface className="p-5 space-y-4">
          <h2 className="font-serif text-xl">Notas</h2>
          {ratings.map((bucket) => (
            <Meter key={bucket.stars} label={`${bucket.stars} estrela${bucket.stars > 1 ? 's' : ''}`} count={bucket.count} max={maxRating} />
          ))}
        </PaperSurface>

        <PaperSurface className="p-5 space-y-4">
          <h2 className="font-serif text-xl">Estilos</h2>
          {styles.map((item) => (
            <Meter key={item.name} label={item.name} count={item.count} max={maxStyle} />
          ))}
        </PaperSurface>

        <PaperSurface className="p-5 space-y-4">
          <h2 className="font-serif text-xl">Uvas</h2>
          {grapes.length === 0 ? (
            <p className="text-sm text-[#6b6458]">Nenhuma uva informada.</p>
          ) : (
            grapes.map((item) => <Meter key={item.name} label={item.name} count={item.count} max={maxGrape} />)
          )}
        </PaperSurface>

        <PaperSurface className="p-5 space-y-4">
          <h2 className="font-serif text-xl">Países</h2>
          {countries.map((item) => (
            <Meter key={item.name} label={countryName(item.name)} count={item.count} max={maxCountry} />
          ))}
        </PaperSurface>
      </div>

      <PaperSurface className="p-5 space-y-4">
        <h2 className="font-serif text-xl">Degustações recentes</h2>
        <div className="grid grid-cols-6 gap-2 items-end h-36">
          {months.map((month) => (
            <div key={month.key} className="flex flex-col items-center justify-end h-full gap-2">
              <span className="text-[11px] font-mono-code text-[#6b6458] dark:text-[#9e9687]">{month.count}</span>
              <span
                className="w-full max-w-10 rounded-t-xs bg-[#793b46] dark:bg-[#b05e6e]"
                style={{ height: `${Math.max(month.count === 0 ? 4 : 12, Math.round((month.count / maxMonth) * 88))}px` }}
              />
              <span className="text-[11px] text-[#6b6458] dark:text-[#9e9687]">{month.label}</span>
            </div>
          ))}
        </div>
      </PaperSurface>

      {aromas.length > 0 && (
        <PaperSurface className="p-5">
          <h2 className="font-serif text-xl mb-4">Aromas que mais voltam</h2>
          <div className="flex flex-wrap gap-2">
            {aromas.map((item) => (
              <span
                key={item.aroma}
                className="rounded-full border border-[#cfc4b0] dark:border-[#3d362b] px-3 py-1 text-sm text-[#312d26] dark:text-[#eee7db]"
              >
                {item.aroma}
                <span className="ml-2 font-mono-code text-[11px] text-[#6b6458] dark:text-[#9e9687]">{item.count}</span>
              </span>
            ))}
          </div>
        </PaperSurface>
      )}
    </div>
  );
};
