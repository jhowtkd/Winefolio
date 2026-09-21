import React, { useMemo, useState } from 'react';
import type { EntryDraft, WineEntry } from '../../domain/wine-entry';
import type { AppRoute } from '../../app/navigation';
import { filterAndSortEntries } from '../../domain/collection';
import { countryName } from '../../domain/countries';
import { WineMemoryCard } from './WineMemoryCard';
import { JournalSidebar } from './JournalSidebar';
import { Icon, Doodle } from '../../components/proto/Sprite';
import { pad, shortDate } from '../../components/proto/bits';

export type JournalFilter = 'todos' | 'tinto' | 'branco' | 'rose' | 'espumante' | 'favoritos';
type Layout = 'cards' | 'table';
type Sort = 'recent' | 'rating';

const PILLS: Array<{ id: JournalFilter; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'tinto', label: 'Tintos' },
  { id: 'branco', label: 'Brancos' },
  { id: 'rose', label: 'Rosés' },
  { id: 'espumante', label: 'Espumantes' },
  { id: 'favoritos', label: 'Favoritos' },
];

interface JournalPageProps {
  entries: WineEntry[];
  ownCount: number;
  showDemo: boolean;
  draft: EntryDraft | null;
  readPhoto: (id: string) => Promise<Blob | undefined>;
  route: Extract<AppRoute, { kind: 'journal' }>;
  onSelectEntry: (entry: WineEntry) => void;
  onToggleFavorite: (entry: WineEntry) => void;
  onNewEntry: () => void;
  onLoadDemoWines: () => void;
  onResumeDraft: () => void;
  onDiscardDraft: () => Promise<void>;
  onNavigate: (route: AppRoute) => void;
  onOpenPassport: () => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({
  entries,
  ownCount,
  showDemo,
  draft,
  readPhoto,
  route,
  onSelectEntry,
  onToggleFavorite,
  onNewEntry,
  onLoadDemoWines,
  onResumeDraft,
  onDiscardDraft,
  onNavigate,
  onOpenPassport,
}) => {
  const filter: JournalFilter =
    route.tab === 'favorites'
      ? 'favoritos'
      : route.tab === 'sparkling'
        ? 'espumante'
        : 'todos';
  const [filterOverride, setFilterOverride] = useState<JournalFilter | null>(null);
  const activeFilter = filterOverride ?? filter;

  const [query, setQuery] = useState(route.search ?? '');
  const [layout, setLayout] = useState<Layout>('cards');
  const [sort, setSort] = useState<Sort>('recent');

  const country = route.country;
  const aroma = route.aroma;

  const filtered = useMemo(() => {
    let list = filterAndSortEntries(entries, {
      query,
      tab: activeFilter === 'favoritos' ? 'favorites' : 'all',
      style:
        activeFilter === 'todos' || activeFilter === 'favoritos' ? 'all' : activeFilter,
      country: country ?? 'all',
      sortBy: sort === 'rating' ? 'rating-desc' : 'date-desc',
    });
    if (aroma) {
      const wanted = aroma.toLowerCase();
      list = list.filter((e) =>
        (e.aromaTags || []).some((a) => a.toLowerCase() === wanted)
      );
    }
    return list;
  }, [entries, query, activeFilter, country, aroma, sort]);

  const demoLabel = showDemo
    ? ownCount > 0
      ? 'Exemplos + suas notas'
      : 'Coleção ilustrativa'
    : 'Seu arquivo pessoal';

  const contextLabel = country
    ? `Origem: ${countryName(country)}`
    : aroma
      ? `Aroma: ${aroma}`
      : query
        ? `“${query}”`
        : '';

  const clearContext = () => {
    setQuery('');
    onNavigate({ kind: 'journal', tab: 'all' });
  };

  const stampCountries = useMemo(() => {
    const codes = Array.from(
      new Set(entries.map((e) => e.origin?.countryCode).filter(Boolean) as string[])
    );
    return [...codes.slice(0, 2), '?'].slice(0, 3);
  }, [entries]);

  const favoritesOnly = activeFilter === 'favoritos' && !query && !country && !aroma;
  const emptyTitle = !entries.length
    ? 'Todo caderno começa em branco.'
    : favoritesOnly
      ? 'As favoritas têm um lugar aqui.'
      : 'Essa página ainda não apareceu.';
  const emptyCopy = !entries.length
    ? 'Um nome, uma lembrança, um rótulo. A primeira página é do seu jeito.'
    : favoritesOnly
      ? 'Use o marcador nos cartões para separar as memórias que você quer reencontrar.'
      : 'Tente outro nome, aroma ou região. Ou deixe os filtros de lado.';

  const emptyState = (
    <div className="empty-state">
      <Icon name={favoritesOnly ? 'bookmark' : 'book'} />
      <h3>{emptyTitle}</h3>
      <p>{emptyCopy}</p>
      {!entries.length ? (
        <>
          <button type="button" className="btn btn-secondary" onClick={onNewEntry}>
            Fazer minha primeira anotação <Icon name="arrow" />
          </button>
          <button type="button" className="text-btn" onClick={onLoadDemoWines}>
            Carregar fichas de exemplo <Icon name="arrow" />
          </button>
        </>
      ) : favoritesOnly ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setFilterOverride('todos')}
        >
          Voltar ao caderno <Icon name="arrow" />
        </button>
      ) : (
        <button type="button" className="btn btn-secondary" onClick={clearContext}>
          Limpar busca e filtros <Icon name="arrow" />
        </button>
      )}
    </div>
  );

  return (
    <section className="page-view" aria-labelledby="journal-hero-title">
      <div className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow mono">Seu caderno. Suas descobertas.</div>
          <h1 id="journal-hero-title" tabIndex={-1}>
            Tem vinho
            <br />
            que vira <em className="underlined">história.</em>
          </h1>
          <p className="hero-text">
            Guarde os rótulos, as impressões e os pequenos detalhes que merecem ficar.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <Doodle name="person" className="doodle" />
          <span className="art-caption hand">
            colecione o que
            <br />
            ficou na memória.
          </span>
        </div>
        <aside className="hero-ticket">
          <div className="mono">Passaporte do paladar</div>
          <div className="mini-stamps" aria-hidden="true">
            {stampCountries.map((code, i) => (
              <span key={`${code}-${i}`} className="mini-stamp">
                {code}
              </span>
            ))}
          </div>
          <h2>
            Cada origem,
            <br />
            uma nova página.
          </h2>
          <p>
            Um lugar para reunir as descobertas
            <br />
            do seu caderno. Sem pressa.
          </p>
          <button type="button" className="text-btn" onClick={onOpenPassport}>
            Abrir meu passaporte <Icon name="arrow" />
          </button>
        </aside>
      </div>

      <div className="journal-heading">
        <div className="journal-title">
          <h2>Entre rótulos e notas</h2>
          <span className="count-badge">{pad(entries.length)}</span>
        </div>
        <div className="heading-tools">
          <span className="demo-label">{demoLabel}</span>
          <div className="layout-toggle" role="group" aria-label="Visualização">
            <button
              type="button"
              className={layout === 'cards' ? 'active' : ''}
              aria-label="Ver cartões"
              aria-pressed={layout === 'cards'}
              onClick={() => setLayout('cards')}
            >
              <Icon name="grid" />
            </button>
            <button
              type="button"
              className={layout === 'table' ? 'active' : ''}
              aria-label="Ver tabela"
              aria-pressed={layout === 'table'}
              onClick={() => setLayout('table')}
            >
              <Icon name="list" />
            </button>
          </div>
        </div>
      </div>

      <div className="workspace">
        <div className="collection">
          {draft && (
            <div className="draft-banner">
              <p>
                <strong>Tem uma página esperando por você.</strong>
                <br />
                Seu rascunho está guardado neste navegador.
              </p>
              <div className="actions">
                <button type="button" onClick={onResumeDraft}>
                  Continuar
                </button>
                <button type="button" aria-label="Descartar rascunho" onClick={onDiscardDraft}>
                  Descartar
                </button>
              </div>
            </div>
          )}

          <div className="collection-toolbar">
            <div className="search-box">
              <label className="sr-only" htmlFor="journal-search">
                Buscar nas anotações
              </label>
              <Icon name="search" />
              <input
                id="journal-search"
                type="search"
                placeholder="Encontre uma boa memória..."
                autoComplete="off"
                value={query}
                onChange={(ev) => setQuery(ev.target.value)}
              />
              {query && (
                <button type="button" aria-label="Limpar busca" onClick={() => setQuery('')}>
                  <Icon name="close" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="filters" role="group" aria-label="Filtrar coleção">
              {PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  className={`filter ${activeFilter === pill.id ? 'active' : ''}`}
                  aria-pressed={activeFilter === pill.id}
                  onClick={() => setFilterOverride(pill.id)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {(query || country || aroma) && (
            <div className="active-context">
              <span>{contextLabel}</span>
              <button
                type="button"
                className="context-chip"
                aria-label="Limpar busca e filtros"
                onClick={clearContext}
              >
                Limpar <Icon name="close" />
              </button>
            </div>
          )}

          {layout === 'cards' ? (
            <div className="cards">
              {filtered.length
                ? filtered.map((entry) => (
                    <WineMemoryCard
                      key={entry.id}
                      entry={entry}
                      readPhoto={readPhoto}
                      onSelect={onSelectEntry}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))
                : emptyState}
            </div>
          ) : (
            <div className="table-wrap">
              {filtered.length ? (
                <table>
                  <caption className="sr-only">Registros do caderno</caption>
                  <thead>
                    <tr>
                      <th>Vinho</th>
                      <th>Origem</th>
                      <th>Safra</th>
                      <th>Minha nota</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <button type="button" onClick={() => onSelectEntry(entry)}>
                            {entry.vinho || entry.produtor || 'Página sem título'}
                          </button>
                          {entry._demo && (
                            <small className="muted" style={{ display: 'block', fontSize: 8 }}>
                              EXEMPLO
                            </small>
                          )}
                        </td>
                        <td>
                          {entry.origin?.countryCode
                            ? countryName(entry.origin.countryCode)
                            : '—'}
                        </td>
                        <td>{entry.safra || '—'}</td>
                        <td>
                          {entry.conclusao?.avaliacaoEstrelas
                            ? `${entry.conclusao.avaliacaoEstrelas} / 5`
                            : 'Sem nota'}
                        </td>
                        <td>{shortDate(entry.dataDegustacao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                emptyState
              )}
            </div>
          )}

          <div className="sr-only" role="status" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'anotação encontrada' : 'anotações encontradas'}
          </div>

          <div className="collection-foot">
            <span>
              {pad(filtered.length)}{' '}
              {filtered.length === 1 ? 'página encontrada' : 'páginas encontradas'}
            </span>
            <button
              type="button"
              className="text-btn"
              aria-label={
                sort === 'rating'
                  ? 'Alterar ordem: melhores notas primeiro'
                  : 'Alterar ordem: mais recentes primeiro'
              }
              onClick={() => setSort(sort === 'recent' ? 'rating' : 'recent')}
            >
              {sort === 'rating' ? 'Melhores notas' : 'Mais recentes'} <Icon name="chevron" />
            </button>
          </div>

          <div className="demo-info">
            <Icon name="info" />
            <p>
              {showDemo
                ? 'Os vinhos, rótulos e relatos desta coleção são fictícios. Os exemplos não contam como conquistas. Novas anotações ficam apenas neste navegador.'
                : 'Suas anotações ficam apenas neste navegador. Não há sincronização com conta ou nuvem.'}
            </p>
          </div>
        </div>

        <JournalSidebar
          entries={entries}
          ownCount={ownCount}
          showDemo={showDemo}
          onNewEntry={onNewEntry}
        />
      </div>
    </section>
  );
};
