import React from 'react';
import type { AppRoute } from '../../app/navigation';
import { BookOpen, Plus, Settings, Sun, Moon, Sparkles } from 'lucide-react';
import { PaperButton } from '../ui/PaperButton';

interface HeaderProps {
  activeRoute: AppRoute;
  theme: 'paper' | 'night';
  onToggleTheme: () => void;
  onNavigate: (hash: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRoute,
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  const isJournal = activeRoute.kind === 'journal';
  const isNew = activeRoute.kind === 'new';
  const isSettings = activeRoute.kind === 'settings';

  return (
    <header className="sticky top-0 z-40 bg-[#f9f5ed]/95 dark:bg-[#1a1714]/95 backdrop-blur-xs border-b border-[#cfc4b0] dark:border-[#3d362b] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Marca / Logotipo */}
        <div
          onClick={() => onNavigate('#/caderno')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xs bg-[#793b46] text-[#fffaf0] flex items-center justify-center shadow-xs border border-[#5a212d] group-hover:scale-105 transition-transform">
            <svg
              viewBox="0 0 70 110"
              className="w-5 h-7 text-[#efe4c8]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <use href="/assets/winefolio/illustrations.svg#doodle-cork" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#312d26] dark:text-[#eee7db]">
                Winefolio
              </span>
              <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-[#efe4c8] dark:bg-[#2e2820] text-[#793b46] dark:text-[#b05e6e] border border-[#cfc4b0]/70">
                1.1
              </span>
            </div>
            <p className="text-[10px] tracking-widest uppercase text-[#6b6458] dark:text-[#9e9687] font-medium hidden sm:block">
              Caderno de Degustações
            </p>
          </div>
        </div>

        {/* Links Centrais de Navegação */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onNavigate('#/caderno')}
            className={`px-3 py-1.5 rounded-xs text-xs sm:text-sm font-medium transition-all ${
              isJournal
                ? 'bg-[#eae1cd] dark:bg-[#3d362b] text-[#312d26] dark:text-[#eee7db] font-bold shadow-xs'
                : 'text-[#6b6458] dark:text-[#9e9687] hover:text-[#312d26] dark:hover:text-[#eee7db] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Caderno
          </button>

          <button
            type="button"
            onClick={() => onNavigate('#/novo')}
            className={`px-3 py-1.5 rounded-xs text-xs sm:text-sm font-medium flex items-center gap-1 transition-all ${
              isNew
                ? 'bg-[#793b46] text-[#fffaf0] font-bold shadow-xs'
                : 'text-[#793b46] dark:text-[#b05e6e] hover:bg-[#793b46]/10'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Ficha</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('#/ajustes')}
            className={`px-3 py-1.5 rounded-xs text-xs sm:text-sm font-medium flex items-center gap-1 transition-all ${
              isSettings
                ? 'bg-[#eae1cd] dark:bg-[#3d362b] text-[#312d26] dark:text-[#eee7db] font-bold shadow-xs'
                : 'text-[#6b6458] dark:text-[#9e9687] hover:text-[#312d26] dark:hover:text-[#eee7db] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Ajustes e Backup"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Ajustes</span>
          </button>

          {/* Alternador de Tema Claro / Noturno */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xs text-[#6b6458] dark:text-[#9e9687] hover:text-[#312d26] dark:hover:text-[#eee7db] hover:bg-black/5 dark:hover:bg-white/5 ml-1 transition-colors"
            title={theme === 'night' ? 'Mudar para tema claro' : 'Mudar para tema noturno'}
            aria-label="Alternar tema"
          >
            {theme === 'night' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#793b46]" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
