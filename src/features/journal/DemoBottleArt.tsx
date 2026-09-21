import React from 'react';
import type { WineType, WineStyle } from '../../domain/wine-entry';

interface DemoBottleArtProps {
  tipo?: WineType;
  estilo?: WineStyle;
  corHex?: string;
  className?: string;
}

export const DemoBottleArt: React.FC<DemoBottleArtProps> = ({
  tipo,
  estilo,
  corHex,
  className = '',
}) => {
  // Cores representativas caso corHex não esteja informado
  let defaultColor = '#793b46'; // tinto padrão
  if (tipo === 'espumante') {
    defaultColor = '#c9b46e';
  } else if (estilo === 'branco') {
    defaultColor = '#d9cb8a';
  } else if (estilo === 'rose') {
    defaultColor = '#c76e7d';
  } else if (tipo === 'sobremesa' || tipo === 'fortificado') {
    defaultColor = '#8c4a2f';
  }

  const wineFill = corHex || defaultColor;

  return (
    <div
      className={`w-full h-full min-h-[140px] flex items-center justify-center relative overflow-hidden bg-[#ebe4d4] dark:bg-[#1a1714] ${className}`}
    >
      {/* Silhueta da garrafa vintage */}
      <svg
        viewBox="0 0 70 110"
        className="w-16 h-24 text-[#8a7f6f] dark:text-[#5c5446] opacity-90 transition-transform duration-300 group-hover:scale-105"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <use href="/assets/winefolio/illustrations.svg#doodle-cork" />
      </svg>

      {/* Selo com cor do vinho */}
      <div
        className="absolute bottom-3 right-3 w-4 h-4 rounded-full border border-white/60 shadow-sm"
        style={{ backgroundColor: wineFill }}
        title={`Cor estimada: ${wineFill}`}
      />
    </div>
  );
};
