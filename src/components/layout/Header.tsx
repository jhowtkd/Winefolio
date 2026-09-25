import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { AppRoute } from '../../app/navigation';
import type { WineEntry } from '../../domain/wine-entry';
import { filterByWineProducerOrVintage } from '../../domain/quick-search';
import { Icon, Doodle } from '../proto/Sprite';

interface HeaderProps {
  activeRoute: AppRoute;
  onNavigate: (hash: string) => void;
  entries?: WineEntry[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectEntry?: (id: string) => void;
}

const NAV_ITEMS = [
  { hash: '#/caderno', label: 'Caderno', icon: 'book', match: 'journal', extra: false },
  { hash: '#/passaporte', label: 'Passaporte', icon: 'passport', match: 'passport', extra: false },
  { hash: '#/paladar', label: 'Meu paladar', icon: 'palate', match: 'palate', extra: false },
  // Entre 680 e 1023 px os extras não cabem no cabeçalho e ficam em Opções.
  { hash: '#/adega', label: 'Adega', icon: 'cellar', match: 'cellar', extra: true },
  { hash: '#/estatisticas', label: 'Estatísticas', icon: 'chart', match: 'stats', extra: true },
] as const;

/** Cabeçalho com barra de busca rápida e navegação móvel. */
export const Header: React.FC<HeaderProps> = ({
  activeRoute,
  onNavigate,
  entries = [],
  searchQuery = '',
  onSearchChange,
  onSelectEntry,
}) => {
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const [isOpen, setIsOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mantém sincronizado com mudanças externas (ex: filtro do caderno ou URL)
  useEffect(() => {
    setInternalQuery(searchQuery);
  }, [searchQuery]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtra entradas instantaneamente por nome do vinho, produtor ou safra
  const matches = useMemo(() => {
    if (!entries.length || !internalQuery.trim()) return [];
    return filterByWineProducerOrVintage(entries, internalQuery);
  }, [entries, internalQuery]);

  const handleInputChange = (val: string) => {
    setInternalQuery(val);
    setIsOpen(true);
    onSearchChange?.(val);

    // Se estiver em outra página (ex: passaporte, paladar), muda para o caderno para exibir os resultados filtrados
    if (activeRoute.kind !== 'journal' && val.trim().length > 0) {
      onNavigate(`#/caderno?q=${encodeURIComponent(val.trim())}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    searchInputRef.current?.blur();
    const clean = internalQuery.trim();
    onNavigate(clean ? `#/caderno?q=${encodeURIComponent(clean)}` : '#/caderno');
  };

  const handleClear = () => {
    setInternalQuery('');
    setIsOpen(false);
    onSearchChange?.('');
    if (activeRoute.kind === 'journal') {
      onNavigate('#/caderno');
    }
    searchInputRef.current?.focus();
  };

  const handleSelectEntry = (id: string) => {
    setIsOpen(false);
    if (onSelectEntry) {
      onSelectEntry(id);
    } else {
      onNavigate(`#/ficha/${encodeURIComponent(id)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
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

          {/* Barra de busca rápida */}
          <div ref={searchWrapRef} className="header-search-wrap">
            <form
              role="search"
              className="header-search"
              onSubmit={handleSearchSubmit}
            >
              <label htmlFor="header-quick-search" className="sr-only">
                Buscar por nome do vinho, produtor ou safra
              </label>
              <Icon name="search" className="header-search-icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
                id="header-quick-search"
                type="search"
                className="header-search-input"
                placeholder="Buscar vinho, produtor, safra..."
                aria-label="Buscar vinho, produtor ou safra"
                value={internalQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => {
                  if (internalQuery.trim()) setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
              />
              {internalQuery && (
                <button
                  type="button"
                  className="header-search-clear"
                  aria-label="Limpar busca rápida"
                  title="Limpar busca"
                  onClick={handleClear}
                >
                  <Icon name="close" aria-hidden="true" />
                </button>
              )}
            </form>

            {/* Dropdown de sugestões e correspondências rápidas */}
            {isOpen && internalQuery.trim().length > 0 && (
              <div
                className="header-search-dropdown"
                role="listbox"
                aria-label="Resultados da busca rápida"
              >
                <div className="header-dropdown-header">
                  <span>
                    {matches.length === 1
                      ? '1 vinho encontrado'
                      : `${matches.length} vinhos encontrados`}
                  </span>
                  <span className="mono">Nome · Produtor · Safra</span>
                </div>

                {matches.length > 0 ? (
                  <>
                    <ul className="header-dropdown-list" role="list">
                      {matches.slice(0, 5).map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            className="header-dropdown-item"
                            onClick={() => handleSelectEntry(entry.id)}
                          >
                            <div className="header-dropdown-item-main">
                              <span className="header-dropdown-title">
                                {entry.vinho || 'Vinho sem nome'}
                              </span>
                              <span className={`proto-pill ${entry.estilo || ''}`}>
                                {entry.estilo || entry.tipo || 'vinho'}
                              </span>
                            </div>
                            <div className="header-dropdown-item-meta">
                              <span className="header-dropdown-producer">
                                {entry.produtor || 'Produtor não informado'}
                              </span>
                              {entry.safra && (
                                <span className="header-dropdown-vintage mono">
                                  Safra {entry.safra}
                                </span>
                              )}
                              {entry.conclusao?.avaliacaoEstrelas && (
                                <span className="header-dropdown-rating">
                                  ★ {entry.conclusao.avaliacaoEstrelas}
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="header-dropdown-footer"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate(
                          `#/caderno?q=${encodeURIComponent(internalQuery.trim())}`
                        );
                      }}
                    >
                      Ver no Caderno ({matches.length}) <Icon name="arrow" />
                    </button>
                  </>
                ) : (
                  <div className="header-dropdown-empty">
                    <p>Nenhum vinho encontrado com esse nome, produtor ou safra.</p>
                    <small className="muted">Tente outro termo ou limpe a busca.</small>
                  </div>
                )}
              </div>
            )}
          </div>

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
};
