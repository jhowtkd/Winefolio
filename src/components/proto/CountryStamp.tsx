import React, { useId } from 'react';
import { countryName } from '../../domain/countries';

const STAMP_NAMES: Record<string, [string, string]> = {
  PT: ['PORTUGAL', 'TERRAS DE VINHO'],
  AR: ['ARGENTINA', 'MEMÓRIAS DOS ANDES'],
  FR: ['FRANÇA', 'PEQUENAS DESCOBERTAS'],
  BR: ['BRASIL', 'ORIGENS DO CADERNO'],
};

interface CountryStampProps {
  code: string;
  count: number;
  index: number;
  onOpen: (code: string) => void;
}

/** Carimbo de origem do passaporte, igual ao protótipo. */
export const CountryStamp: React.FC<CountryStampProps> = ({ code, count, index, onOpen }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [name, sub] = STAMP_NAMES[code] ?? [
    countryName(code).toUpperCase(),
    'ORIGENS DO CADERNO',
  ];
  const round = index % 2 === 0;
  const n = `stamp-${uid}`;

  return (
    <button
      type="button"
      className="country-stamp"
      aria-label={`Ver ${count} ${count === 1 ? 'registro' : 'registros'} de ${countryName(code)}`}
      onClick={() => onOpen(code)}
    >
      <svg viewBox="0 0 150 140" aria-hidden="true">
        <g transform={`rotate(${index % 2 ? -7 : 8} 75 70)`} opacity=".88">
          {round ? (
            <>
              <circle
                cx="75"
                cy="70"
                r="61"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="57 1 25 .7"
              />
              <circle
                cx="75"
                cy="70"
                r="55"
                fill="none"
                stroke="currentColor"
                strokeWidth=".8"
              />
              <path id={n} d="M25 70a50 50 0 0 1 100 0" fill="none" />
              <text fill="currentColor" fontFamily="monospace" fontSize="7" letterSpacing="1.7">
                <textPath href={`#${n}`} startOffset="50%" textAnchor="middle">
                  {sub}
                </textPath>
              </text>
              <text
                x="75"
                y="112"
                textAnchor="middle"
                fill="currentColor"
                fontFamily="monospace"
                fontSize="7"
                letterSpacing="1.2"
              >
                WINEFOLIO
              </text>
            </>
          ) : (
            <>
              <rect
                x="10"
                y="20"
                width="130"
                height="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="34 1 23 .5"
              />
              <rect
                x="15"
                y="25"
                width="120"
                height="90"
                fill="none"
                stroke="currentColor"
                strokeWidth=".7"
              />
              <text
                x="75"
                y="41"
                fill="currentColor"
                fontFamily="monospace"
                fontSize="6"
                textAnchor="middle"
                letterSpacing="1.1"
              >
                {sub}
              </text>
              <text
                x="75"
                y="104"
                textAnchor="middle"
                fill="currentColor"
                fontFamily="monospace"
                fontSize="7"
                letterSpacing="1.3"
              >
                WINEFOLIO
              </text>
            </>
          )}
          <text
            x="75"
            y="64"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="Georgia,serif"
            fontSize={name.length > 10 ? 12 : 17}
            fontWeight="bold"
            letterSpacing=".4"
          >
            {name}
          </text>
          <path d="M31 73h88" stroke="currentColor" strokeWidth="1" />
          <text
            x="75"
            y="88"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="monospace"
            fontSize="7"
          >
            {count} {count === 1 ? 'PÁGINA' : 'PÁGINAS'} NO CADERNO
          </text>
        </g>
      </svg>
    </button>
  );
};
