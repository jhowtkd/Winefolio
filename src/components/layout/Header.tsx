import React from 'react';
import type { AppRoute } from '../../app/navigation';
import { BarChart3, BookOpen, Plus, Settings, Sun, Moon, Warehouse } from 'lucide-react';
import { PaperButton } from '../ui/PaperButton';

interface HeaderProps {
  activeRoute: AppRoute;
  theme: 'paper' | 'night';
  onToggleTheme: () => void;
  onNavigate: (hash: string) => void;
}

const LINKS = [
  { hash: '#/caderno', label: 'Caderno', icon: BookOpen, match: 'journal' },
  { hash: '#/adega', label: 'Adega', icon: Warehouse, match: 'cellar' },
  { hash: '#/estatisticas', label: 'Estatísticas', icon: BarChart3, match: 'stats' },
] as const;

export const Header: React.FC<HeaderProps> = ({
  activeRoute,
  theme,
  onToggleTheme,
  onNavigate,
}) => {
  const isNew = activeRoute.kind === 'new';
  const isSettings = activeRoute.kind === 'settings';

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#f9f5ed]/95 dark:bg-[#1a1714]/95 backdrop-blur-xs border-b border-[#cfc4b0] dark:border-[#3d362b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('#/caderno')}
            className="flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xs bg-[#793b46] text-[#fffaf0] flex items-center justify-center border border-[#5a212d]">
              <span className="font-serif text-lg leading-none">W</span>
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#312d26] dark:text-[#eee7db]">
                Winefolio
              </span>
              <p className="text-[10px] tracking-widest uppercase text-[#6b6458] dark:text-[#9e9687] hidden sm:block">
                Caderno de degustações
              </p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((link) => {
              const active = activeRoute.kind === link.match;
              const Icon = link.icon;
              return (
                <button
                  key={link.hash}
                  type="button"
                  onClick={() => onNavigate(link.hash)}
                  className={`px-3 py-1.5 rounded-xs text-sm font-medium inline-flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#eae1cd] dark:bg-[#3d362b] text-[#312d26] dark:text-[#eee7db] font-semibold'
                      : 'text-[#6b6458] dark:text-[#9e9687] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <PaperButton
              variant={isNew ? 'primary' : 'quiet'}
              className="px-2.5 sm:px-4"
              onClick={() => onNavigate('#/novo')}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova ficha</span>
            </PaperButton>
            <button
              type="button"
              onClick={() => onNavigate('#/ajustes')}
              className={`p-2 rounded-xs ${
                isSettings
                  ? 'bg-[#eae1cd] dark:bg-[#3d362b] text-[#312d26] dark:text-[#eee7db]'
                  : 'text-[#6b6458] dark:text-[#9e9687] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              aria-label="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xs text-[#6b6458] dark:text-[#9e9687] hover:bg-black/5 dark:hover:bg-white/5"
              aria-label={theme === 'night' ? 'Usar tema claro' : 'Usar tema noturno'}
            >
              {theme === 'night' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#cfc4b0] dark:border-[#3d362b] bg-[#f9f5ed]/95 dark:bg-[#1a1714]/95 backdrop-blur-xs">
        <div className="grid grid-cols-4">
          {LINKS.map((link) => {
            const active = activeRoute.kind === link.match;
            const Icon = link.icon;
            return (
              <button
                key={link.hash}
                type="button"
                onClick={() => onNavigate(link.hash)}
                className={`py-2.5 flex flex-col items-center gap-1 text-[11px] ${
                  active ? 'text-[#793b46] dark:text-[#e7b3bc] font-semibold' : 'text-[#6b6458] dark:text-[#9e9687]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onNavigate('#/ajustes')}
            className={`py-2.5 flex flex-col items-center gap-1 text-[11px] ${
              isSettings ? 'text-[#793b46] dark:text-[#e7b3bc] font-semibold' : 'text-[#6b6458] dark:text-[#9e9687]'
            }`}
          >
            <Settings className="w-4 h-4" />
            Ajustes
          </button>
        </div>
      </nav>
    </>
  );
};
