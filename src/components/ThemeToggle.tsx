import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id="btn-alternar-modo-noturno"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar modo diurno' : 'Ativar modo noturno'}
      title={
        isDark
          ? 'Modo Noturno ativo (Grafite & Bordô). Clique para voltar ao modo claro.'
          : 'Ativar Modo Noturno (Grafite & Bordô) para proteção visual em ambientes com pouca luz.'
      }
      className={`group relative inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer border ${
        isDark
          ? 'bg-[#222530] hover:bg-[#2C313E] text-rose-200 border-[#7E1B2C]/60 shadow-xs shadow-[#7E1B2C]/20'
          : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700 border-stone-200 hover:border-stone-300'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-rose-900 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>

      <span className="hidden sm:inline font-medium">
        {isDark ? (
          <span className="flex items-center gap-1.5">
            <span>Noturno</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          </span>
        ) : (
          <span>Modo Noturno</span>
        )}
      </span>

      {showLabel && (
        <span className="sm:hidden font-medium">
          {isDark ? 'Noturno' : 'Noturno'}
        </span>
      )}
    </button>
  );
};
