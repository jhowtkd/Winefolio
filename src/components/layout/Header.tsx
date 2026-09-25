import React from 'react';
import type { AppRoute } from '../../app/navigation';
import { Icon, Doodle } from '../proto/Sprite';

interface HeaderProps {
  activeRoute: AppRoute;
  onNavigate: (hash: string) => void;
}

const NAV_ITEMS = [
  { hash: '#/caderno', label: 'Caderno', icon: 'book', match: 'journal', extra: false },
  { hash: '#/passaporte', label: 'Passaporte', icon: 'passport', match: 'passport', extra: false },
  { hash: '#/paladar', label: 'Meu paladar', icon: 'palate', match: 'palate', extra: false },
  // Entre 680 e 1023 px os extras não cabem no cabeçalho e ficam em Opções.
  { hash: '#/adega', label: 'Adega', icon: 'cellar', match: 'cellar', extra: true },
  { hash: '#/estatisticas', label: 'Estatísticas', icon: 'chart', match: 'stats', extra: true },
] as const;

/** Cabeçalho e navegação inferior móvel no padrão do protótipo 1.1. */
export const Header: React.FC<HeaderProps> = ({ activeRoute, onNavigate }) => (
  <>
    <div className="topline print:hidden" />
    <header className="header wrap print:hidden">
      <div className="header-inner">
        <button
          type="button"
          className="brand"
          onClick={() => onNavigate('#/caderno')}
          aria-label="Winefolio, voltar ao caderno"
        >
          <Doodle name="cork" className="brand-glyph" />
          <div>
            <div className="brand-name">
              Winefolio<span>.</span>
            </div>
            <div className="brand-sub">Um caderno de descobertas</div>
          </div>
        </button>
        <nav className="nav" aria-label="Principal">
          {NAV_ITEMS.map((item) => {
            const active = activeRoute.kind === item.match;
            return (
              <button
                key={item.hash}
                type="button"
                className={`nav-btn ${item.extra ? 'nav-extra' : ''} ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(item.hash)}
              >
                <Icon name={item.icon} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('#/novo')}
          >
            <Icon name="plus" />
            Registrar vinho
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Opções do caderno"
            title="Opções do caderno"
            onClick={() => onNavigate('#/ajustes')}
          >
            <Icon name="more" />
          </button>
        </div>
      </div>
    </header>
    <nav className="mobile-nav print:hidden" aria-label="Navegação móvel">
      {NAV_ITEMS.slice(0, 2).map((item) => {
        const active = activeRoute.kind === item.match;
        return (
          <button
            key={item.hash}
            type="button"
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
            onClick={() => onNavigate(item.hash)}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        );
      })}
      <button
        type="button"
        className="new-mobile"
        aria-label="Registrar vinho"
        onClick={() => onNavigate('#/novo')}
      >
        <Icon name="plus" />
        <span>Anotar</span>
      </button>
      <button
        type="button"
        className={activeRoute.kind === 'palate' ? 'active' : ''}
        aria-current={activeRoute.kind === 'palate' ? 'page' : undefined}
        onClick={() => onNavigate('#/paladar')}
      >
        <Icon name="palate" />
        Meu paladar
      </button>
      <button type="button" onClick={() => onNavigate('#/ajustes')}>
        <Icon name="more" />
        Opções
      </button>
    </nav>
  </>
);
