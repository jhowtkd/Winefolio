import React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import type { PaladarAnalysis, WineStyle } from '../../domain/wine-entry';
import { scorePalate, type PalateAxis } from '../../domain/sensory-scale';

interface SensoryRadarProps {
  paladar: PaladarAnalysis;
  estilo: WineStyle | null;
  corHex?: string;
}

const AXES: Array<{ axis: PalateAxis; label: string; pick: (p: PaladarAnalysis) => string }> = [
  { axis: 'corpo', label: 'Corpo', pick: (p) => p.corpo },
  { axis: 'acidez', label: 'Acidez', pick: (p) => p.acidez },
  { axis: 'tanino', label: 'Tanino', pick: (p) => p.tanino },
  { axis: 'alcool', label: 'Álcool', pick: (p) => p.alcool },
  { axis: 'docura', label: 'Doçura', pick: (p) => p.docura },
];

export const SensoryRadar: React.FC<SensoryRadarProps> = ({ paladar, estilo, corHex }) => {
  const scores = AXES.map(({ axis, label, pick }) => ({
    axis,
    label,
    score: scorePalate(pick(paladar), axis),
  }));

  if (scores.every((item) => item.score === null)) return null;

  const color =
    corHex ||
    (estilo === 'branco' ? '#B48210' : estilo === 'rose' ? '#DB2777' : '#881337');

  const data = scores.map((item) => ({
    axis: item.label,
    value: item.score ?? 0,
  }));

  return (
    <div className="pt-2 border-t border-[#cfc4b0]/30">
      <span className="text-[10px] font-mono-code text-[#6b6458] dark:text-[#9e9687] uppercase block">
        Perfil de paladar
      </span>
      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height={230}>
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke="#cfc4b0" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: '#6b6458', fontSize: 11 }}
            />
            <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.35}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] text-[#6b6458] dark:text-[#9e9687]">
        {scores.map((item) => (
          <li key={item.axis} className="flex items-center justify-between gap-1">
            <span>{item.label}</span>
            <span className="font-mono-code">{item.score === null ? '—' : item.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
