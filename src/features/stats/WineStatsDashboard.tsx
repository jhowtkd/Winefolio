import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { WineEntry } from '../../domain/wine-entry';
import { grapeBreakdown, ratingDistribution } from '../../domain/insights';
import { PaperSurface } from '../../components/ui/PaperSurface';
import { Star, Wine, Award } from 'lucide-react';

export interface WineStatsDashboardProps {
  entries: WineEntry[];
  className?: string;
  title?: string;
  description?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: Record<string, unknown> }>;
  label?: string;
}

const GrapeTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as { name: string; count: number; percent: number };
    return (
      <div className="rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] p-2.5 shadow-md text-xs">
        <p className="font-serif font-semibold text-sm text-[#312d26] dark:text-[#eee7db]">{item.name}</p>
        <p className="mt-1 text-[#793b46] dark:text-[#e7b3bc] font-mono-code font-bold">
          {item.count} {item.count === 1 ? 'vinho registrado' : 'vinhos registrados'}
        </p>
        <p className="text-[10px] text-[#6b6458] dark:text-[#9e9687]">
          {item.percent.toFixed(0)}% das uvas catalogadas
        </p>
      </div>
    );
  }
  return null;
};

const RatingTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as {
      stars: number;
      label: string;
      fullLabel: string;
      count: number;
      percent: number;
    };
    return (
      <div className="rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] p-2.5 shadow-md text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-semibold text-sm text-[#312d26] dark:text-[#eee7db]">
            {item.fullLabel}
          </span>
          <span className="text-[#b48210] flex">
            {Array.from({ length: item.stars }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-[#b48210] stroke-[#b48210]" />
            ))}
          </span>
        </div>
        <p className="mt-1 text-[#793b46] dark:text-[#e7b3bc] font-mono-code font-bold">
          {item.count} {item.count === 1 ? 'vinho avaliado' : 'vinhos avaliados'}
        </p>
        <p className="text-[10px] text-[#6b6458] dark:text-[#9e9687]">
          {item.percent.toFixed(0)}% do total avaliado
        </p>
      </div>
    );
  }
  return null;
};

const RATING_COLORS = ['#8a7e71', '#a89c87', '#b7a26b', '#965941', '#793b46'];

/**
 * Painel de estatísticas com Recharts para variedades de uvas mais degustadas
 * e distribuição de notas atribuídas aos vinhos registrados.
 */
export const WineStatsDashboard: React.FC<WineStatsDashboardProps> = ({
  entries,
  className = '',
  title = 'Painel de Uvas e Avaliações',
  description = 'Visão gráfica das variedades de uvas mais recorrentes e distribuição de notas atribuídas.',
}) => {
  // Dados de variedades de uva
  const grapeData = useMemo(() => {
    const raw = grapeBreakdown(entries, 8);
    const totalGrapes = raw.reduce((sum, g) => sum + g.count, 0);
    return raw.map((g) => ({
      name: g.name,
      count: g.count,
      percent: totalGrapes > 0 ? (g.count / totalGrapes) * 100 : 0,
    }));
  }, [entries]);

  // Dados de distribuição de notas
  const ratingData = useMemo(() => {
    const raw = ratingDistribution(entries);
    const totalRated = raw.reduce((sum, r) => sum + r.count, 0);
    return raw.map((r) => ({
      stars: r.stars,
      label: `${r.stars} ★`,
      fullLabel: `${r.stars} ${r.stars === 1 ? 'estrela' : 'estrelas'}`,
      count: r.count,
      percent: totalRated > 0 ? (r.count / totalRated) * 100 : 0,
    }));
  }, [entries]);

  // Indicadores de resumo
  const summary = useMemo(() => {
    const totalWines = entries.length;
    const ratedWines = entries.filter((e) => e.conclusao?.avaliacaoEstrelas);
    const avgRating =
      ratedWines.length > 0
        ? ratedWines.reduce((sum, e) => sum + (e.conclusao?.avaliacaoEstrelas || 0), 0) /
          ratedWines.length
        : null;

    const topGrape = grapeData.length > 0 ? grapeData[0] : null;

    return {
      totalWines,
      ratedCount: ratedWines.length,
      avgRating,
      topGrape,
      distinctGrapesCount: grapeData.length,
    };
  }, [entries, grapeData]);

  const maxGrapeCount = useMemo(() => {
    const max = Math.max(1, ...grapeData.map((d) => d.count));
    return max;
  }, [grapeData]);

  const maxRatingCount = useMemo(() => {
    const max = Math.max(1, ...ratingData.map((d) => d.count));
    return max;
  }, [ratingData]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#cfc4b0]/40 pb-3">
        <div>
          <span className="text-[10px] font-mono-code tracking-[0.16em] uppercase text-[#793b46] dark:text-[#e7b3bc]">
            Gráficos &amp; Métricas
          </span>
          <h2 className="font-serif text-2xl font-semibold text-[#312d26] dark:text-[#eee7db]">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-[#6b6458] dark:text-[#9e9687] mt-0.5">{description}</p>
          )}
        </div>

        {/* Resumo rápido */}
        <div className="flex items-center gap-4 text-xs font-mono-code text-[#6b6458] dark:text-[#9e9687]">
          {summary.avgRating !== null && (
            <span className="flex items-center gap-1 bg-[#efe4c8] dark:bg-[#3d362b] px-2.5 py-1 rounded-xs">
              <Star className="w-3.5 h-3.5 fill-[#b48210] stroke-[#b48210]" />
              <strong className="text-[#312d26] dark:text-[#eee7db]">
                {summary.avgRating.toFixed(1)}
              </strong>{' '}
              média
            </span>
          )}
          {summary.topGrape && (
            <span className="flex items-center gap-1 bg-[#efe4c8] dark:bg-[#3d362b] px-2.5 py-1 rounded-xs">
              <Wine className="w-3.5 h-3.5 text-[#793b46] dark:text-[#b05e6e]" />
              <strong className="text-[#312d26] dark:text-[#eee7db]">
                {summary.topGrape.name}
              </strong>{' '}
              líder
            </span>
          )}
        </div>
      </div>

      {/* Grade com os dois gráficos Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico 1: Variedades de Uvas Mais Degustadas */}
        <PaperSurface className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Wine className="w-4 h-4 text-[#793b46] dark:text-[#b05e6e]" />
                <h3 className="font-serif text-lg font-medium text-[#312d26] dark:text-[#eee7db]">
                  Variedades de Uvas
                </h3>
              </div>
              <span className="text-[10px] font-mono-code text-[#6b6458] dark:text-[#9e9687]">
                Top {grapeData.length} uvas
              </span>
            </div>
            <p className="text-xs text-[#6b6458] dark:text-[#9e9687] mb-4">
              Uvas identificadas com maior frequência nas fichas de degustação.
            </p>
          </div>

          {grapeData.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#cfc4b0] dark:border-[#3d362b] rounded-xs bg-[#fffaf0]/30 dark:bg-[#25221d]/30">
              <Wine className="w-8 h-8 text-[#9e9687] stroke-[1.2] mb-2" />
              <p className="text-sm font-medium text-[#312d26] dark:text-[#eee7db]">
                Nenhuma variedade informada
              </p>
              <p className="text-xs text-[#6b6458] dark:text-[#9e9687] mt-1 max-w-xs">
                Registre as castas no formulário de degustação para visualizar o ranking.
              </p>
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={grapeData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#cfc4b0"
                    strokeOpacity={0.35}
                  />
                  <XAxis
                    type="number"
                    domain={[0, Math.max(maxGrapeCount + 1, 3)]}
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#6b6458' }}
                    axisLine={{ stroke: '#cfc4b0', strokeOpacity: 0.5 }}
                    tickLine={{ stroke: '#cfc4b0', strokeOpacity: 0.5 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11, fill: '#312d26' }}
                    axisLine={{ stroke: '#cfc4b0', strokeOpacity: 0.5 }}
                    tickLine={false}
                  />
                  <Tooltip content={<GrapeTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#793b46"
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  >
                    {grapeData.map((_, index) => (
                      <Cell
                        key={`grape-cell-${index}`}
                        fill={index === 0 ? '#793b46' : index < 3 ? '#965941' : '#b05e6e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-[#cfc4b0]/20 flex items-center justify-between text-[11px] text-[#6b6458] dark:text-[#9e9687]">
            <span>Total de castas listadas</span>
            <span className="font-mono-code font-semibold text-[#312d26] dark:text-[#eee7db]">
              {grapeData.reduce((acc, g) => acc + g.count, 0)} menções
            </span>
          </div>
        </PaperSurface>

        {/* Gráfico 2: Distribuição de Notas Atribuídas */}
        <PaperSurface className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#793b46] dark:text-[#b05e6e]" />
                <h3 className="font-serif text-lg font-medium text-[#312d26] dark:text-[#eee7db]">
                  Distribuição de Notas
                </h3>
              </div>
              <span className="text-[10px] font-mono-code text-[#6b6458] dark:text-[#9e9687]">
                Escala 1 a 5 estrelas
              </span>
            </div>
            <p className="text-xs text-[#6b6458] dark:text-[#9e9687] mb-4">
              Contagem de garrafas avaliadas segundo a pontuação de estrelas.
            </p>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={ratingData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#cfc4b0"
                  strokeOpacity={0.35}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#312d26' }}
                  axisLine={{ stroke: '#cfc4b0', strokeOpacity: 0.5 }}
                  tickLine={{ stroke: '#cfc4b0', strokeOpacity: 0.5 }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, Math.max(maxRatingCount + 1, 3)]}
                  tick={{ fontSize: 10, fill: '#6b6458' }}
                  axisLine={{ stroke: '#cfc4b0', strokeOpacity: 0.5 }}
                  tickLine={{ stroke: '#cfc4b0', strokeOpacity: 0.5 }}
                />
                <Tooltip content={<RatingTooltip />} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                >
                  {ratingData.map((entry, index) => (
                    <Cell
                      key={`rating-cell-${entry.stars}`}
                      fill={RATING_COLORS[index] || '#793b46'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-[#cfc4b0]/20 flex items-center justify-between text-[11px] text-[#6b6458] dark:text-[#9e9687]">
            <span>Vinhos com avaliação</span>
            <span className="font-mono-code font-semibold text-[#312d26] dark:text-[#eee7db]">
              {summary.ratedCount} de {summary.totalWines} ({summary.totalWines > 0 ? Math.round((summary.ratedCount / summary.totalWines) * 100) : 0}%)
            </span>
          </div>
        </PaperSurface>
      </div>
    </div>
  );
};
