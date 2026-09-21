import React from 'react';

/**
 * Sprite SVG com os símbolos do protótipo Winefolio 1.1
 * (ícones de interface e ilustrações lineares). Montado uma
 * única vez no root do app; os componentes referenciam via <use>.
 */
export const SvgSprite: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="0"
    height="0"
    aria-hidden="true"
    style={{ position: 'absolute', pointerEvents: 'none' }}
  >
    <defs>
      <symbol id="i-plus" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </symbol>
      <symbol id="i-arrow" viewBox="0 0 24 24">
        <path d="M4 12h15m-6-6 6 6-6 6" />
      </symbol>
      <symbol id="i-close" viewBox="0 0 24 24">
        <path d="m6 6 12 12M18 6 6 18" />
      </symbol>
      <symbol id="i-book" viewBox="0 0 24 24">
        <path d="M4 4.5h6.2c1 0 1.8.5 1.8 1.5 0-1 .8-1.5 1.8-1.5H20v15h-6.2c-1 0-1.8.5-1.8 1 0-.5-.8-1-1.8-1H4zM12 6v14M7 8h2M7 11h2M15 8h2M15 11h2" />
      </symbol>
      <symbol id="i-passport" viewBox="0 0 24 24">
        <rect x="5" y="3" width="14" height="18" rx="1" />
        <circle cx="12" cy="10" r="3.3" />
        <path d="M8.7 10h6.6M12 6.7c-2 2-2 4.6 0 6.6 2-2 2-4.6 0-6.6M9 17h6" />
      </symbol>
      <symbol id="i-palate" viewBox="0 0 24 24">
        <path d="M8 3h8l1 6c.5 3-1.5 5-5 5s-5.5-2-5-5l1-6ZM12 14v7m-4 0h8M7.5 9h9" />
      </symbol>
      <symbol id="i-search" viewBox="0 0 24 24">
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="m15 15 5 5" />
      </symbol>
      <symbol id="i-grid" viewBox="0 0 24 24">
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" />
        <rect x="14" y="14" width="6" height="6" />
      </symbol>
      <symbol id="i-list" viewBox="0 0 24 24">
        <path d="M9 5h11M9 12h11M9 19h11M4 5h1M4 12h1M4 19h1" />
      </symbol>
      <symbol id="i-bookmark" viewBox="0 0 24 24">
        <path d="M6 3.5h12v17l-6-4-6 4z" />
      </symbol>
      <symbol id="i-star" viewBox="0 0 24 24">
        <path d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1.1 6.1-5.5-2.9L6.5 20l1.1-6.1L3 9.5l6.3-.9Z" />
      </symbol>
      <symbol id="i-info" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v6m0-10v.5" />
      </symbol>
      <symbol id="i-more" viewBox="0 0 24 24">
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </symbol>
      <symbol id="i-check" viewBox="0 0 24 24">
        <path d="m5 12 4 5L20 6" />
      </symbol>
      <symbol id="i-edit" viewBox="0 0 24 24">
        <path d="m15 4 5 5L8 21H3v-5L15 4Zm-1 1 5 5M3 16l5 5" />
      </symbol>
      <symbol id="i-camera" viewBox="0 0 24 24">
        <path d="M3 7h4l2-3h6l2 3h4v13H3Z" />
        <circle cx="12" cy="13" r="4" />
        <path d="M17.5 9h.5" />
      </symbol>
      <symbol id="i-chevron" viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </symbol>
      <symbol id="i-print" viewBox="0 0 24 24">
        <path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 13h10v8H7zM17 11h1" />
      </symbol>
      <symbol id="i-download" viewBox="0 0 24 24">
        <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
      </symbol>
      <symbol id="i-leaf" viewBox="0 0 24 24">
        <path d="M5 18C0 7 9 5 20 3c-1 10-4 19-15 15ZM3 21 15 9M8 16v-5m0 5h5" />
      </symbol>
      <symbol id="i-lock" viewBox="0 0 24 24">
        <rect x="5" y="10" width="14" height="11" rx="1" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </symbol>
      <symbol id="i-refresh" viewBox="0 0 24 24">
        <path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5" />
      </symbol>
      <symbol id="i-spark" viewBox="0 0 24 24">
        <path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z" />
      </symbol>
      <symbol id="doodle-cork" viewBox="0 0 70 110">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M24 7q11-5 21 0l-1 18q-2 17 10 24l2 49q-19 7-40 0l1-49q12-9 9-23Z" />
          <path d="M24 12q10 3 21 0M25 25h19M17 61q20 3 38 0M16 84q18 4 39 0M21 52v42M39 36l7 12" />
          <path d="M32 67q12-6 14 3t-11 8q-9-3-3-11Z" />
        </g>
      </symbol>
      <symbol id="doodle-person" viewBox="0 0 240 300">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g transform="rotate(-12 119 62)">
            <path d="M53 18q57-7 117 0l5 72q-62 10-125-1Z" fill="#e7d6b7" />
            <path d="M54 24q55-7 115 0M54 83q51 7 117-1" />
            <path d="m63 34 4 2m4-4 3 1m77 9 4 2m-16 37 3 2m-67-3 4-1m27-56 3 1m49 39 3 1m-59-2 3 1m-31 1 4-2m53 2 4 1m-4-11 2-1" />
            <text
              x="110"
              y="61"
              textAnchor="middle"
              fill="currentColor"
              stroke="none"
              fontFamily="Georgia,serif"
              fontSize="17"
              fontWeight="bold"
              letterSpacing=".9"
            >
              MEMÓRIAS
            </text>
          </g>
          <path d="M62 73q-12 29-12 48 2 30 47 50M72 78q-8 28-4 41 5 16 40 29M176 65q25 23 27 43 1 30-45 61M166 74q17 28 14 36-3 18-29 35" />
          <path d="m64 77 1-14 3-11 1 15 6-17-3 21 7-15-5 19m91 2-5-15 4-2 6 11-4-19 4 1 7 17 2-12 3 2v17" />
          <path d="M91 135q9-11 20-7m-13 9q10-13 22-7m-23 14q8-10 17-9M102 140q-3 8-9 11l7 4q-7 16 5 20 12 3 19-9l1-21m-17-7q11 9 22 4m-18-9q15 7 23 6" />
          <path d="m112 149 1 1M112 162q5 1 7-2M98 172l-21 25 9 27q25 7 60-1l8-27-19-29M98 172q14 18 34-2M81 184l-10-11m77 12 16-16M87 224l-6 55 20 2 15-44 8 43 22-1-1-55M81 279l-18 11q-4 4 4 4l34-5v-8M126 280l-1 12h31q5-2-10-9M89 230l-4 44m43-40 10 40" />
          <path d="M34 122q-8-5-12-1m11-8-8-8M194 137l14 3m-13 4 7 7" />
        </g>
      </symbol>
      <symbol id="doodle-glass" viewBox="0 0 110 85">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M15 5h27l1 20q-1 14-14 14-15 0-15-13Zm14 34-1 28m-14 1 28-1M14 22q17 6 29-1M69 10l26-3 4 20q0 13-13 15-13 1-16-11Zm17 32 2 27m-13 2 27-3M71 27q12 1 27-5M52 5l3-5m4 17 8-4M51 16l1-7" />
        </g>
      </symbol>
    </defs>
  </svg>
);

interface IconProps {
  name: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className = '' }) => (
  <svg className={`icon ${className}`.trim()} aria-hidden="true">
    <use href={`#i-${name}`} />
  </svg>
);

export const Doodle: React.FC<IconProps> = ({ name, className = '' }) => (
  <svg className={`doodle ${className}`.trim()} aria-hidden="true">
    <use href={`#doodle-${name}`} />
  </svg>
);
