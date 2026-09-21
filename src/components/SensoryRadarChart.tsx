import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { PaladarAnalysis, WineStyle } from '../types';

interface SensoryRadarChartProps {
  paladar: PaladarAnalysis;
  wineStyle?: WineStyle;
  colorHex?: string;
  className?: string;
}

// Map descriptive sommelier text to 1-5 scale for the radar chart
function parseScore(val: string | undefined, type: 'corpo' | 'acidez' | 'tanino' | 'alcool' | 'docura'): number {
  if (!val) return 3;
  const lower = val.toLowerCase();

  switch (type) {
    case 'corpo':
      if (lower.includes('encorpado')) return 5;
      if (lower.includes('médio+') || lower.includes('medio+')) return 4;
      if (lower.includes('médio-') || lower.includes('medio-')) return 2;
      if (lower.includes('médio') || lower.includes('medio')) return 3;
      if (lower.includes('leve')) return 1.5;
      return 3;

    case 'acidez':
      if (lower.includes('muito alta')) return 5;
      if (lower.includes('alta')) return 4.5;
      if (lower.includes('média+') || lower.includes('media+')) return 4;
      if (lower.includes('média-') || lower.includes('media-')) return 2;
      if (lower.includes('média') || lower.includes('media')) return 3;
      if (lower.includes('baixa')) return 1.5;
      return 3;

    case 'tanino':
      if (lower.includes('nulo') || lower.includes('não tem') || lower.includes('nao tem')) return 1;
      if (lower.includes('baixo')) return 2;
      if (lower.includes('médio-') || lower.includes('medio-')) return 2.5;
      if (lower.includes('médio+') || lower.includes('medio+')) return 4;
      if (lower.includes('sedoso')) return 3.5;
      if (lower.includes('médio') || lower.includes('medio')) return 3;
      if (lower.includes('adstringente') || lower.includes('alto')) return 5;
      return 2.5;

    case 'alcool':
      if (lower.includes('quente')) return 5;
      if (lower.includes('alto')) return 4.5;
      if (lower.includes('equilibrado') || lower.includes('médio') || lower.includes('medio')) return 3.5;
      if (lower.includes('baixo')) return 2;
      return 3;

    case 'docura':
      if (lower.includes('doce')) return 5;
      if (lower.includes('suave')) return 3.8;
      if (lower.includes('meio-seco')) return 2.5;
      if (lower.includes('seco')) return 1.2;
      return 1.5;
  }
}

export const SensoryRadarChart: React.FC<SensoryRadarChartProps> = ({
  paladar,
  wineStyle = 'tinto',
  colorHex,
  className = '',
}) => {
  const safePaladar = paladar || {
    docura: 'Seco',
    acidez: 'Média',
    tanino: 'Médio',
    aromasBoca: '',
    corpo: 'Médio',
    alcool: 'Equilibrado',
    retrogosto: '',
    persistencia: 'Média',
  };

  const corpoVal = parseScore(safePaladar.corpo, 'corpo');
  const acidezVal = parseScore(safePaladar.acidez, 'acidez');
  const taninoVal = parseScore(safePaladar.tanino, 'tanino');
  const alcoolVal = parseScore(safePaladar.alcool, 'alcool');
  const docuraVal = parseScore(safePaladar.docura, 'docura');

  const chartData = [
    { attribute: 'Corpo', value: corpoVal, fullText: safePaladar.corpo || 'Médio', max: 5 },
    { attribute: 'Acidez', value: acidezVal, fullText: safePaladar.acidez || 'Média', max: 5 },
    { attribute: 'Taninos', value: taninoVal, fullText: safePaladar.tanino || 'Médio', max: 5 },
    { attribute: 'Álcool', value: alcoolVal, fullText: safePaladar.alcool || 'Equilibrado', max: 5 },
    { attribute: 'Doçura', value: docuraVal, fullText: safePaladar.docura || 'Seco', max: 5 },
  ];

  // Colors based on wine style with safe fallback
  const themesMap: Record<string, { stroke: string; fill: string; bgGlow: string; badge: string }> = {
    branco: {
      stroke: '#B48210',
      fill: '#D4A017',
      bgGlow: 'bg-amber-50/50 dark:bg-amber-950/20',
      badge: 'border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    },
    rose: {
      stroke: '#DB2777',
      fill: '#EC4899',
      bgGlow: 'bg-pink-50/50 dark:bg-pink-950/20',
      badge: 'border-pink-300 dark:border-pink-700/60 bg-pink-50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200',
    },
    tinto: {
      stroke: colorHex || '#881337',
      fill: colorHex || '#9F1239',
      bgGlow: 'bg-rose-50/50 dark:bg-rose-950/20',
      badge: 'border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
    },
  };

  const themeColors = themesMap[wineStyle] || themesMap.tinto;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-[#2E3342] bg-stone-50/70 dark:bg-[#1E222D] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColors.stroke }} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 font-serif-title">
            Perfil Sensorial Estrutural (Radar de Paladar)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
          Escala 1 a 5
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Radar Chart Visual */}
        <div className="md:col-span-7 h-[230px] sm:h-[250px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={220}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" opacity={0.7} />
              <PolarAngleAxis
                dataKey="attribute"
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tickCount={6}
                stroke="#94a3b8"
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Perfil"
                dataKey="value"
                stroke={themeColors.stroke}
                fill={themeColors.fill}
                fillOpacity={0.45}
                strokeWidth={2.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Sensory Values Breakdown Badges */}
        <div className="md:col-span-5 space-y-2 text-xs">
          {chartData.map((item) => (
            <div
              key={item.attribute}
              className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#252A37] border border-stone-200/80 dark:border-[#353B4B] shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {item.attribute}
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-[110px]">
                  ({item.fullText})
                </span>
              </div>

              {/* Graphical score pips */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <span
                    key={lvl}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      lvl <= Math.round(item.value)
                        ? 'bg-rose-900 dark:bg-rose-400'
                        : 'bg-stone-200 dark:bg-stone-700'
                    }`}
                    style={
                      lvl <= Math.round(item.value)
                        ? { backgroundColor: themeColors.stroke }
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
