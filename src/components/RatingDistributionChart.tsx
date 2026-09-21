import React from 'react';
import { WineTastingSheet } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Star, BarChart3, TrendingUp, Award, X } from 'lucide-react';

interface RatingDistributionChartProps {
  wines: WineTastingSheet[];
  selectedRating?: number | null;
  onSelectRating?: (rating: number | null) => void;
}

// Warm sommelier gradient tones from 1 to 5 stars
const BAR_COLORS = [
  '#d97706', // 1 star - Amber 600
  '#b45309', // 2 stars - Amber 700
  '#be123c', // 3 stars - Rose 700
  '#9f1239', // 4 stars - Rose 800
  '#881337', // 5 stars - Wine / Rose 900
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-[#1E222D]/95 backdrop-blur-xs border border-stone-200 dark:border-[#353B4B] rounded-xl shadow-lg p-3 text-xs max-w-56 z-50 transition-colors">
        <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-[#2E3342] pb-1.5 mb-1.5">
          <span className="flex items-center text-amber-500">
            {Array.from({ length: item.stars }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-500" />
            ))}
          </span>
          <span className="text-stone-700 dark:text-stone-300 font-semibold">{item.fullLabel}</span>
        </div>

        <div className="space-y-1 text-stone-600 dark:text-stone-400">
          <p className="flex justify-between items-center">
            <span>Total de vinhos:</span>
            <strong className="text-stone-900 dark:text-stone-100 text-sm font-bold">{item.count}</strong>
          </p>
          <p className="flex justify-between items-center text-[11px] text-stone-500 dark:text-stone-400">
            <span>Proporção do acervo:</span>
            <span className="font-semibold text-rose-900 dark:text-rose-300">{item.percentage}%</span>
          </p>
        </div>

        {item.sampleWines && item.sampleWines.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-stone-100 dark:border-[#2E3342] text-[11px]">
            <span className="text-stone-400 dark:text-stone-500 block font-medium mb-1">Exemplos:</span>
            <ul className="space-y-0.5 text-stone-700 dark:text-stone-300 truncate">
              {item.sampleWines.slice(0, 3).map((name: string, idx: number) => (
                <li key={idx} className="truncate">• {name}</li>
              ))}
              {item.sampleWines.length > 3 && (
                <li className="text-stone-400 dark:text-stone-500 italic text-[10px]">
                  + {item.sampleWines.length - 3} outro(s)
                </li>
              )}
            </ul>
          </div>
        )}

        <p className="mt-2 text-[10px] text-stone-400 dark:text-stone-500 italic">
          Clique na barra para filtrar
        </p>
      </div>
    );
  }
  return null;
};

export const RatingDistributionChart: React.FC<RatingDistributionChartProps> = ({
  wines,
  selectedRating,
  onSelectRating,
}) => {
  const total = wines.length;

  // Prepare chart data for 1 to 5 stars
  const chartData = [1, 2, 3, 4, 5].map((stars) => {
    const matching = wines.filter((w) => Number(w.conclusao.avaliacaoEstrelas) === stars);
    const count = matching.length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      stars,
      label: `${stars} ★`,
      fullLabel: `${stars} ${stars === 1 ? 'estrela' : 'estrelas'}`,
      count,
      percentage,
      sampleWines: matching.map((w) => `${w.produtor} ${w.vinho}`),
    };
  });

  // Calculate statistics
  const ratedWines = wines.filter((w) => Number(w.conclusao.avaliacaoEstrelas) > 0);
  const avgRating =
    ratedWines.length > 0
      ? (
          ratedWines.reduce((acc, w) => acc + Number(w.conclusao.avaliacaoEstrelas), 0) /
          ratedWines.length
        ).toFixed(1)
      : '0.0';

  const highestCount = Math.max(...chartData.map((d) => d.count), 0);
  const mostFrequentRating = chartData.find((d) => d.count === highestCount && highestCount > 0);

  return (
    <div className="bg-white dark:bg-[#1A1C23] border border-stone-200 dark:border-[#282C38] rounded-2xl p-4 sm:p-5 shadow-xs mb-6 transition-colors">
      {/* Header & Meta Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-stone-100 dark:border-[#282C38]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-[#34141B] border border-rose-100 dark:border-[#7E1B2C]/40 flex items-center justify-center text-rose-900 dark:text-rose-300 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Distribuição de Avaliações
              <span className="text-xs font-normal text-stone-500 dark:text-stone-400">
                (1 a 5 Estrelas)
              </span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Panorama sensorial das notas atribuídas a todos os {total} {total === 1 ? 'vinho registrado' : 'vinhos registrados'}
            </p>
          </div>
        </div>

        {/* Quick Highlights / Indicators */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/80 dark:bg-[#282013] border border-amber-200/60 dark:border-amber-800/40 rounded-xl text-amber-900 dark:text-amber-300">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-stone-600 dark:text-stone-400 font-medium">Média Geral:</span>
            <span className="font-bold text-amber-700 dark:text-amber-300">★ {avgRating}</span>
          </div>

          {mostFrequentRating && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 dark:bg-[#232733] border border-stone-200 dark:border-[#353B4B] rounded-xl text-stone-700 dark:text-stone-300">
              <Award className="w-3.5 h-3.5 text-rose-800 dark:text-rose-400" />
              <span className="text-stone-500 dark:text-stone-400 font-medium">Faixa predominante:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{mostFrequentRating.stars} ★</span>
            </div>
          )}

          {selectedRating && (
            <button
              onClick={() => onSelectRating?.(null)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-900 dark:text-rose-200 bg-rose-100 dark:bg-[#3E1620] hover:bg-rose-200 dark:hover:bg-[#501A28] rounded-lg transition cursor-pointer border border-transparent dark:border-[#7E1B2C]/40"
              title="Limpar filtro de estrelas"
            >
              <span>Filtrando: {selectedRating} ★</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Graphic */}
      <div className="w-full h-44 sm:h-48 pt-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={160}>
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid, #f5f5f4)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#9ca3af' }}
              tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(244, 63, 94, 0.08)' }}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
              cursor="pointer"
              animationDuration={800}
            >
              {chartData.map((entry, index) => {
                const isSelected = selectedRating === entry.stars;
                const isDimmed = selectedRating !== null && selectedRating !== undefined && !isSelected;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isSelected ? '#881337' : BAR_COLORS[index]}
                    opacity={isDimmed ? 0.35 : 1}
                    stroke={isSelected ? '#4c0519' : 'transparent'}
                    strokeWidth={isSelected ? 2 : 0}
                    className="cursor-pointer transition-opacity hover:opacity-90"
                    onClick={() => onSelectRating?.(isSelected ? null : entry.stars)}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / Interactive Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-1 border-t border-stone-100 dark:border-[#282C38] text-xs text-stone-500 dark:text-stone-400">
        <span className="text-[11px] text-stone-400 dark:text-stone-500">
          💡 Dica: Clique em qualquer barra ou botão abaixo para filtrar as fichas pela nota.
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {chartData.map((d, idx) => {
            const isSelected = selectedRating === d.stars;
            return (
              <button
                key={d.stars}
                id={`btn-filtro-estrela-${d.stars}`}
                type="button"
                onClick={() => onSelectRating?.(isSelected ? null : d.stars)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium transition cursor-pointer ${
                  isSelected
                    ? 'bg-rose-900 dark:bg-[#7E1B2C] text-white border-rose-900 dark:border-[#7E1B2C] shadow-2xs font-bold'
                    : 'bg-stone-50 dark:bg-[#232733] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-[#353B4B] hover:bg-stone-100 dark:hover:bg-[#2A2F3E]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: BAR_COLORS[idx] }}
                />
                <span>{d.stars} ★</span>
                <span className="font-semibold text-stone-500 dark:text-stone-400 text-[10px] ml-0.5">
                  ({d.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
