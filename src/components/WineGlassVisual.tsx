import React from 'react';
import type { WineStyle } from '../domain/wine-entry';

interface WineGlassProps {
  colorHex?: string;
  style?: WineStyle;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const WineGlassVisual: React.FC<WineGlassProps> = ({
  colorHex,
  style = 'tinto',
  size = 'md',
  className = '',
}) => {
  // Determine fallback color
  const defaultColors: Record<WineStyle, string> = {
    branco: '#F3E99F',
    rose: '#E88B7C',
    tinto: '#83122D',
  };

  const activeColor = colorHex || defaultColors[style] || '#83122D';

  const dimensions = {
    sm: { width: 36, height: 72 },
    md: { width: 56, height: 110 },
    lg: { width: 80, height: 160 },
  }[size];

  const gradientId = `wine-grad-${activeColor.replace('#', '')}-${size}`;
  const glassReflectId = `glass-refl-${size}`;

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 80 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={activeColor} stopOpacity="0.85" />
            <stop offset="40%" stopColor={activeColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1a040a" stopOpacity="0.75" />
          </linearGradient>

          <linearGradient id={glassReflectId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Stem (Haste) */}
        <path
          d="M38 78 L38 140 L42 140 L42 78 Z"
          fill="#cbd5e1"
          stroke="#94a3b8"
          strokeWidth="0.8"
        />

        {/* Base (Pé da Taça) */}
        <ellipse
          cx="40"
          cy="142"
          rx="24"
          ry="4.5"
          fill="#f8fafc"
          stroke="#64748b"
          strokeWidth="1.2"
        />
        <ellipse
          cx="40"
          cy="142"
          rx="18"
          ry="2"
          fill="#e2e8f0"
          opacity="0.6"
        />

        {/* Glass Bowl Outline Background */}
        <path
          d="M18 16 C18 64 24 78 40 78 C56 78 62 64 62 16 Z"
          fill="#f8fafc"
          fillOpacity="0.2"
          stroke="#64748b"
          strokeWidth="1.2"
        />

        {/* Wine Liquid Inside Bowl */}
        <path
          d="M21.5 38 C21.5 65 26.5 75 40 75 C53.5 75 58.5 65 58.5 38 C52 41 28 41 21.5 38 Z"
          fill={`url(#${gradientId})`}
        />

        {/* Meniscus / Liquid surface oval */}
        <ellipse
          cx="40"
          cy="38.5"
          rx="18.5"
          ry="3"
          fill={activeColor}
          stroke="#ffffff"
          strokeWidth="0.5"
          fillOpacity="0.9"
        />

        {/* Glass reflection highlight on side */}
        <path
          d="M23 20 C22 45 26 65 35 73 C33 71 27 55 27 22 Z"
          fill="url(#glass-refl)"
          opacity="0.6"
        />
        <ellipse
          cx="40"
          cy="16"
          rx="22"
          ry="2.5"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
