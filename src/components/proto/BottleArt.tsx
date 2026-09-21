import React, { useId } from 'react';
import type { WineEntry } from '../../domain/wine-entry';

interface ArtSet {
  bg: string;
  shadow: string;
  glass: [string, string, string];
  ink: string;
  paper: string;
  seal: string;
  name: [string, string];
  small: string;
}

const ART_SETS: ArtSet[] = [
  { bg: '#dfc9ae', shadow: '#99714b', glass: ['#3d4030', '#222a25', '#111e17'], ink: '#733b40', paper: '#f3e7d1', seal: '#793b46', name: ['CASA DO', 'VENTO'], small: 'DOURO · PORTUGAL' },
  { bg: '#d5d6be', shadow: '#73805b', glass: ['#c4b567', '#989242', '#a4a667'], ink: '#586344', paper: '#f1ecd9', seal: '#5d6b4f', name: ['LA', 'LOMA'], small: 'MENDOZA · ARGENTINA' },
  { bg: '#e6cbbb', shadow: '#ac8070', glass: ['#d8a286', '#ac7e5d', '#e8bd97'], ink: '#96523f', paper: '#f8ebda', seal: '#9f5a45', name: ['ROSÉ', 'DE SOL'], small: 'PROVENCE · FRANCE' },
  { bg: '#c9c6b0', shadow: '#777654', glass: ['#363d2f', '#17211b', '#34472d'], ink: '#464e3b', paper: '#ddd9bc', seal: '#5c654c', name: ['LINHA', 'DA SERRA'], small: 'SERRA GAÚCHA · BRASIL' },
  { bg: '#ddd5b3', shadow: '#a6915c', glass: ['#acaa53', '#7a843c', '#b4b366'], ink: '#767339', paper: '#efedd8', seal: '#807a46', name: ['CAMPO', 'CLARO'], small: 'ALENTEJO · PORTUGAL' },
  { bg: '#d3bbaa', shadow: '#866959', glass: ['#31322b', '#15221a', '#3a392c'], ink: '#76423b', paper: '#eadcca', seal: '#783f37', name: ['ENTRE', 'RIOS'], small: 'MENDOZA · ARGENTINA' },
];

const LEAF =
  'M17 42Q-2 22 17 7q19 14 0 35ZM17 7v47m0-13q-27-2-17-20 18 3 17 20Zm0 0q27-2 17-20-18 3-17 20Z';
const HILLS =
  'M-5 40q38-48 77-8 28-31 48-15M-5 47q37-36 65-3 26-17 60-8M5 58l29-23m-14 27 23-23m-6 25 17-19m-2 22 13-15m5 14 13-14m5 18 12-18';

export function demoArtIndex(entry: WineEntry): number | undefined {
  const art = entry.importMetadata?.art;
  return typeof art === 'number' ? art : undefined;
}

/**
 * Ilustração de rótulo gerada em SVG, fiel ao protótipo.
 * Fichas pessoais sem foto ganham um espaço de rótulo em branco.
 */
export const BottleArt: React.FC<{ entry: WineEntry }> = ({ entry }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const isDemo = Boolean(entry._demo);

  if (!isDemo) {
    return (
      <svg
        className="bottle-art"
        viewBox="0 0 320 250"
        preserveAspectRatio="xMidYMid meet"
        style={{ background: '#e9dec9' }}
        role="img"
        aria-label="Espaço para o seu rótulo"
      >
        <rect width="320" height="250" fill="#e9dec9" />
        <path d="M40 34h240v175H40Z" fill="#f8f1e2" stroke="#c8b698" strokeDasharray="4 4" />
        <svg x="122" y="50" width="77" height="119" style={{ color: '#795642' }}>
          <use href="#doodle-cork" />
        </svg>
        <text
          x="160"
          y="194"
          textAnchor="middle"
          fontFamily="monospace"
          fill="#776449"
          fontSize="8.5"
          letterSpacing="1"
        >
          SEU RÓTULO PODE ENTRAR DEPOIS
        </text>
      </svg>
    );
  }

  const styleIndex = { tinto: 0, branco: 1, rose: 2 } as Record<string, number>;
  const index =
    demoArtIndex(entry) ??
    (entry.tipo === 'espumante' ? 4 : entry.estilo ? styleIndex[entry.estilo] ?? 3 : 3);
  const s = ART_SETS[index % ART_SETS.length];
  const id = `art-${uid}`;
  const vintage = entry.safra || '';

  const mark =
    index % 3 === 0 ? (
      <g transform="translate(8 22) scale(.58)">
        <path d={HILLS} />
      </g>
    ) : index % 3 === 1 ? (
      <g transform="translate(36 13) scale(.7)">
        <path d={LEAF} />
      </g>
    ) : (
      <g transform="translate(46 38)">
        <circle r="14" />
        <path d="M0-20v-8M0 20v8M20 0h8M-20 0h-8m-14-14-6-6m34 0 6-6m-6 34 6 6m-34-6-6 6" />
      </g>
    );

  return (
    <svg
      className="bottle-art"
      viewBox="0 0 320 250"
      preserveAspectRatio="xMidYMid meet"
      style={{ background: s.bg }}
      role="img"
      aria-label={`Estudo de rótulo ilustrativo de ${entry.vinho}`}
    >
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          <stop stopColor={s.glass[0]} />
          <stop offset=".21" stopColor={s.glass[2]} />
          <stop offset=".48" stopColor={s.glass[1]} />
          <stop offset=".83" stopColor={s.glass[1]} />
          <stop offset="1" stopColor={s.glass[2]} />
        </linearGradient>
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".15" />
          <stop offset=".65" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <pattern
          id={`${id}-grain`}
          width="43"
          height="39"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="m3 2 2 1m14 8 1 .8m22 15 1 .5m-29 6 .7 1m16-24 1 .3m-8 15 1 .2"
            stroke="#3e2f1a"
            opacity=".16"
            strokeWidth=".6"
          />
        </pattern>
      </defs>
      <rect width="320" height="250" fill={s.bg} />
      <path d="m0 214 320-17v53H0" fill={s.shadow} opacity=".08" />
      <path
        d="M280 0q-11 119-1 250"
        fill="none"
        stroke="#fef6e8"
        strokeOpacity=".18"
        strokeWidth="14"
      />
      <rect width="320" height="250" fill={`url(#${id}-grain)`} />
      <ellipse cx="134" cy="222" rx="59" ry="10" fill="#38241c" opacity=".22" filter={`url(#${id}-blur)`} />
      <g transform="translate(6 0) rotate(-12 115 141)">
        <path
          d="M99 11q13-3 25 0v49c0 10 5 15 13 22q7 5 7 19v119q-33 6-65 0V101q0-14 8-20c9-7 12-13 12-24Z"
          fill={`url(#${id}-glass)`}
          stroke="#222718"
          strokeOpacity=".35"
        />
        <path d="M101 10h22v42q-12 3-23 0Z" fill={s.seal} />
        <path d="M101 18h22m-22 22h22m-22 6h22" stroke="#eee0be" strokeOpacity=".3" strokeWidth=".7" />
        <path d="M89 92q-4 9-4 20v91" fill="none" stroke="#fff" strokeWidth="2.3" opacity=".14" />
        <path d="M99 55v9q-2 10-10 16" fill="none" stroke="#fff" strokeWidth="2" opacity=".12" />
        <path d="M79 117q34 3 65-1v76q-36 3-65 0Z" fill={s.paper} />
        <path d="M81 120q32 3 61 0v67q-31 3-61 0Z" fill="none" stroke={s.ink} strokeWidth=".45" />
        <text
          x="112"
          y="134"
          textAnchor="middle"
          fontFamily="Georgia,serif"
          fontSize="6"
          fill={s.ink}
          letterSpacing="1.2"
        >
          {s.name[0]}
        </text>
        <text
          x="112"
          y="146"
          textAnchor="middle"
          fontFamily="Georgia,serif"
          fontSize="10"
          fill={s.ink}
        >
          {s.name[1]}
        </text>
        <path d="m87 164 16-10 9 8 10-8 16 13M89 168q19-5 47 0" stroke={s.ink} strokeWidth=".7" fill="none" />
        <text
          x="112"
          y="180"
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="5.5"
          fill={s.ink}
        >
          {vintage || 'VINHO'}
        </text>
        <path d="M82 215q29 5 58 0" fill="none" stroke="#ffffff" opacity=".12" />
      </g>
      <g transform="translate(165 52) rotate(8 58 70)">
        <path d="m0 1 114-1 3 153-114 1Z" fill="#3b2312" opacity=".1" transform="translate(3 4)" />
        <path d="m0 1 114-1 3 153-114 1Z" fill={s.paper} />
        <path d="M6 7h103l1 141H8Z" fill="none" stroke={s.ink} strokeWidth=".6" />
        <text
          x="58"
          y="22"
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="5.4"
          fill={s.ink}
          letterSpacing="1"
        >
          {s.small}
        </text>
        <g fill="none" stroke={s.ink} strokeWidth="1.1" transform="translate(10 19)">
          {mark}
        </g>
        <text
          x="58"
          y="97"
          textAnchor="middle"
          fontFamily="Georgia,serif"
          fontWeight="bold"
          fontSize="18"
          fill={s.ink}
          letterSpacing="-.5"
        >
          {s.name[0]}
        </text>
        <text
          x="58"
          y="116"
          textAnchor="middle"
          fontFamily="Georgia,serif"
          fontSize="18"
          fill={s.ink}
          letterSpacing="-.5"
        >
          {s.name[1]}
        </text>
        <path d="M23 124h72" stroke={s.ink} strokeWidth=".6" />
        <text
          x="58"
          y="137"
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="6"
          fill={s.ink}
          letterSpacing="1.5"
        >
          {vintage || 'SEM SAFRA'}
        </text>
      </g>
      <g transform="translate(240 218) rotate(-18)">
        <rect x="-14" y="-7" width="45" height="16" rx="3" fill="#c4a073" />
        <ellipse cx="-14" cy="1" rx="4" ry="8" fill="#b89468" />
        <path d="m-8-4 2 1m7 8 2-1m9-8 2 2m10 2 1 1" stroke="#78603d" strokeWidth="1" />
        <text x="7" y="4" fill="#6c5539" fontFamily="Georgia,serif" fontSize="6" textAnchor="middle">
          VINHO
        </text>
      </g>
      <rect width="320" height="250" fill={`url(#${id}-light)`} />
      <rect width="320" height="250" fill={`url(#${id}-grain)`} opacity=".6" />
    </svg>
  );
};
