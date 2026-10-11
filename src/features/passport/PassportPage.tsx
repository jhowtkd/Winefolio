import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { passportProgress, type PassportMode as Mode } from '../../domain/passport';
import { CountryStamp } from '../../components/proto/CountryStamp';
import { Icon } from '../../components/proto/Sprite';
import { ModeToggle, pad } from '../../components/proto/bits';

interface PassportPageProps {
  entries: WineEntry[];
  demoEntries: WineEntry[];
  defaultMode: Mode;
  onOpenCountry: (code: string, mode: Mode) => void;
}

type MilestoneItem = ReturnType<typeof passportProgress>['milestones'][number];

type OriginsLeaf = {
  kind: 'origins';
  countries: [string, number][];
  blanks: number[];
};

type MilestonesLeaf = {
  kind: 'milestones';
  milestones: MilestoneItem[];
};

type Leaf = OriginsLeaf | MilestonesLeaf;

let lastShowTime = 0;

function showMilestone(button: HTMLButtonElement) {
  const popup = button.nextElementSibling as HTMLDivElement | null;
  if (!popup) return;
  lastShowTime = Date.now();
  popup.showPopover();
  const anchor = button.getBoundingClientRect();
  const { width, height } = popup.getBoundingClientRect();
  const left = Math.max(16, Math.min(anchor.left + (anchor.width - width) / 2, window.innerWidth - width - 16));
  const top = anchor.bottom + height < window.innerHeight - 16
    ? anchor.bottom - 4
    : Math.max(16, anchor.top - height + 4);
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

function closeMilestones(force = true) {
  if (!force && Date.now() - lastShowTime < 150) return;
  document.querySelectorAll<HTMLElement>('.journey-tooltip:popover-open').forEach((popup) => {
    try {
      popup.hidePopover();
    } catch {
      // Ignora se já estiver fechado
    }
  });
}

/** Passaporte do paladar: carimbos de origem e pequenas conquistas folheáveis como um livro. */
export const PassportPage: React.FC<PassportPageProps> = ({
  entries,
  demoEntries,
  defaultMode,
  onOpenCountry,
}) => {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [currentLeaf, setCurrentLeaf] = useState<number>(0);
  const [isTwoPage, setIsTwoPage] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1000px)').matches;
  });
  const bookRef = useRef<HTMLDivElement>(null);

  const demo = mode === 'demo';
  const records = demo ? demoEntries : entries;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)');
    const handleBreakpoint = () => {
      setIsTwoPage(mq.matches);
      // Preservar a primeira folha da abertura atual
      setCurrentLeaf((prev) => Math.floor(prev / 2) * 2);
      closeMilestones();
    };
    mq.addEventListener('change', handleBreakpoint);
    return () => mq.removeEventListener('change', handleBreakpoint);
  }, []);

  useEffect(() => {
    closeMilestones();
    const onScroll = () => closeMilestones(false);
    const onResize = () => closeMilestones(false);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      closeMilestones();
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [mode, currentLeaf]);

  const { countries, milestones, earnedCount } = useMemo(
    () => passportProgress(records, mode),
    [records, mode]
  );

  const leaves = useMemo<Leaf[]>(() => {
    const list: Leaf[] = [];
    const countryEntries = [...countries.entries()];

    if (countryEntries.length === 0) {
      list.push({
        kind: 'origins',
        countries: [],
        blanks: [0, 1, 2, 3],
      });
    } else {
      for (let i = 0; i < countryEntries.length; i += 6) {
        const chunk = countryEntries.slice(i, i + 6);
        const isLast = i + 6 >= countryEntries.length;
        const blanks = isLast
          ? Array.from({ length: Math.max(1, Math.min(4, 6 - chunk.length)) }, (_, b) => b)
          : [];
        list.push({
          kind: 'origins',
          countries: chunk,
          blanks,
        });
      }
    }

    for (let i = 0; i < milestones.length; i += 6) {
      list.push({
        kind: 'milestones',
        milestones: milestones.slice(i, i + 6),
      });
    }

    return list;
  }, [countries, milestones]);

  const totalLeaves = leaves.length;
  const safeLeafIndex = Math.min(Math.max(0, currentLeaf), Math.max(0, totalLeaves - 1));

  useEffect(() => {
    if (currentLeaf >= totalLeaves && totalLeaves > 0) {
      setCurrentLeaf(Math.max(0, totalLeaves - 1));
    }
  }, [totalLeaves, currentLeaf]);

  const currentSpread = Math.floor(safeLeafIndex / 2);
  const totalSpreads = Math.ceil(totalLeaves / 2);

  const canGoPrev = isTwoPage ? currentSpread > 0 : safeLeafIndex > 0;
  const canGoNext = isTwoPage ? currentSpread < totalSpreads - 1 : safeLeafIndex < totalLeaves - 1;

  const goToPrev = () => {
    if (!canGoPrev) return;
    closeMilestones();
    if (isTwoPage) {
      setCurrentLeaf(Math.max(0, (currentSpread - 1) * 2));
    } else {
      setCurrentLeaf((prev) => Math.max(0, prev - 1));
    }
  };

  const goToNext = () => {
    if (!canGoNext) return;
    closeMilestones();
    if (isTwoPage) {
      setCurrentLeaf(Math.min(totalLeaves - 1, (currentSpread + 1) * 2));
    } else {
      setCurrentLeaf((prev) => Math.min(totalLeaves - 1, prev + 1));
    }
  };

  const handleModeToggle = (nextMode: Mode) => {
    setMode(nextMode);
    setCurrentLeaf(0);
    closeMilestones();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    if (!bookRef.current || !bookRef.current.contains(document.activeElement)) {
      return;
    }
    const targetTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
      return;
    }

    if (event.key === 'ArrowLeft') {
      if (canGoPrev) {
        event.preventDefault();
        if (document.activeElement !== bookRef.current) {
          bookRef.current?.focus();
        }
        goToPrev();
      }
    } else if (event.key === 'ArrowRight') {
      if (canGoNext) {
        event.preventDefault();
        if (document.activeElement !== bookRef.current) {
          bookRef.current?.focus();
        }
        goToNext();
      }
    }
  };

  let positionText = '';
  if (isTwoPage) {
    const leftNum = currentSpread * 2 + 1;
    const rightNum = currentSpread * 2 + 2;
    if (rightNum <= totalLeaves) {
      positionText = `Páginas ${leftNum}–${rightNum} de ${totalLeaves}`;
    } else {
      positionText = `Página ${leftNum} de ${totalLeaves}`;
    }
  } else {
    positionText = `Página ${safeLeafIndex + 1} de ${totalLeaves}`;
  }

  const leftLeaf = isTwoPage ? leaves[currentSpread * 2] : leaves[safeLeafIndex];
  const rightLeaf = isTwoPage ? leaves[currentSpread * 2 + 1] : undefined;
  const leftLeafIndex = isTwoPage ? currentSpread * 2 : safeLeafIndex;
  const rightLeafIndex = isTwoPage ? currentSpread * 2 + 1 : -1;

  const renderLeaf = (leaf: Leaf, leafIdx: number) => {
    const pageNum = leafIdx + 1;
    if (leaf.kind === 'origins') {
      return (
        <div className="book-page book-page-origins" key={`leaf-${leafIdx}`}>
          <div className="mono muted" style={{ fontSize: 8 }}>
            {demo ? 'ESTUDO VISUAL / CARIMBOS ILUSTRATIVOS' : 'ARQUIVO PESSOAL / SUAS ORIGENS'}
          </div>
          <h2>Origens que ficaram.</h2>
          <p className="muted">
            {demo
              ? 'Quatro países em uma coleção inteiramente fictícia.'
              : `${countries.size} ${countries.size === 1 ? 'origem registrada' : 'origens registradas'} nas suas próprias anotações.`}
          </p>
          <div className="stamp-grid">
            {leaf.countries.map(([code, n], i) => (
              <CountryStamp
                key={code}
                code={code}
                count={n}
                index={leafIdx * 6 + i}
                onOpen={(c) => onOpenCountry(c, mode)}
              />
            ))}
            {leaf.blanks.map((i) => (
              <div
                key={i}
                className="stamp-empty"
                aria-label="Espaço para uma descoberta futura"
              >
                <Icon name={i % 2 ? 'leaf' : 'plus'} />
                <span>
                  A HISTÓRIA
                  <br />
                  CONTINUA
                </span>
              </div>
            ))}
          </div>
          <div className="stamp-helper">
            {countries.size
              ? 'Cada carimbo, uma lembrança.'
              : 'A primeira marca começa com uma anotação.'}
          </div>
          <span className="page-number">{pad(pageNum)} / ORIGENS</span>
        </div>
      );
    }

    return (
      <div className="book-page book-page-milestones" key={`leaf-${leafIdx}`}>
        <div className="mono muted" style={{ fontSize: 8 }}>
          {demo ? 'AS MARCAS ABAIXO SÃO APENAS EXEMPLOS' : 'CONQUISTAS SEM CONTAGEM DE CONSUMO'}
        </div>
        <h2>Do seu jeito.</h2>
        <p className="muted">O que vale aqui é observar, registrar e revisitar.</p>
        <div className="journey-list">
          {leaf.milestones.map((m) => {
            const isEarned = m.earned;
            const status = demo
              ? isEarned ? 'Exemplo de conquista' : 'Exemplo ainda não conquistado'
              : isEarned ? 'Conquistado' : 'Ainda não conquistado';
            return (
              <div
                key={m.id}
                className={`journey-item ${isEarned ? '' : 'locked'}`}
                onPointerLeave={(event) => {
                  if (event.pointerType !== 'touch' && !event.currentTarget.querySelector('button')?.matches(':focus-visible')) {
                    const popup = event.currentTarget.querySelector<HTMLElement>('.journey-tooltip');
                    try { popup?.hidePopover(); } catch {}
                  }
                }}
              >
                <button
                  type="button"
                  className="journey-trigger"
                  aria-label={`${m.title} — ${status}`}
                  aria-describedby={`milestone-${m.id}`}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== 'touch') showMilestone(event.currentTarget);
                  }}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(':focus-visible')) showMilestone(event.currentTarget);
                  }}
                  onBlur={(event) => {
                    const popup = event.currentTarget.nextElementSibling as HTMLElement | null;
                    try { popup?.hidePopover(); } catch {}
                  }}
                  onClick={(event) => showMilestone(event.currentTarget)}
                >
                  <img
                    className="journey-stamp"
                    src={`/assets/winefolio/stamps/${m.id}.webp`}
                    alt=""
                    width={320}
                    height={320}
                    loading="lazy"
                  />
                </button>
                <div id={`milestone-${m.id}`} className="journey-tooltip" popover="auto" role="tooltip">
                  <h3>{m.title}</h3>
                  <p>{m.description}</p>
                  <small>{status}</small>
                </div>
              </div>
            );
          })}
        </div>
        <span className="page-number">{pad(pageNum)} / PEQUENAS CONQUISTAS</span>
      </div>
    );
  };

  return (
    <section className="page-view" aria-labelledby="passport-title">
      <div className="page-heading">
        <div>
          <div className="mono ink-wine">Pequenas marcas, boas histórias</div>
          <h1 id="passport-title" tabIndex={-1}>
            Seu passaporte
            <br />
            de <em>descobertas.</em>
          </h1>
          <p>
            Um registro de onde vêm as suas memórias.
            <br />
            Sem metas, sem pressa, sem precisar ir a lugar nenhum.
          </p>
        </div>
        <ModeToggle current={mode} onChange={handleModeToggle} />
      </div>

      <div
        ref={bookRef}
        className="passport-book"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Livro do passaporte"
      >
        <div className={`book-spread ${isTwoPage ? 'two-page' : 'single-page'}`}>
          {isTwoPage ? (
            <>
              {leftLeaf && renderLeaf(leftLeaf, leftLeafIndex)}
              {rightLeaf ? (
                renderLeaf(rightLeaf, rightLeafIndex)
              ) : (
                <div className="book-page book-page-decorative" aria-hidden="true">
                  <div className="decorative-leaf-body">
                    <div className="decorative-seal">
                      <Icon name="book" />
                    </div>
                    <h3>Novos capítulos</h3>
                    <p className="muted">
                      Páginas reservadas para futuras origens, garrafas e descobertas pelo caminho.
                    </p>
                    <div className="decorative-flourish">✦ ✦ ✦</div>
                    <div className="mono ink-wine decorative-motto">
                      WINEFOLIO · CADERNO PESSOAL
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            leftLeaf && renderLeaf(leftLeaf, safeLeafIndex)
          )}
        </div>

        <div className="passport-pagination">
          <button
            type="button"
            className="btn text-btn pagination-prev"
            disabled={!canGoPrev}
            onClick={goToPrev}
            aria-label="Página anterior"
          >
            <Icon name="arrow" className="icon-flip" /> Página anterior
          </button>
          <span className="passport-page-indicator" aria-live="polite">
            {positionText}
          </span>
          <button
            type="button"
            className="btn text-btn pagination-next"
            disabled={!canGoNext}
            onClick={goToNext}
            aria-label="Próxima página"
          >
            Próxima página <Icon name="arrow" />
          </button>
        </div>
      </div>

      <div className="passport-bottom">
        <div className="note-horizontal">
          <Icon name="book" />
          <div>
            <h3>A experiência é sua. O ritmo também.</h3>
            <p>
              Sem sequências diárias, ranking ou incentivo a beber mais. Relembrar uma página
              também faz parte.
            </p>
          </div>
        </div>
        <div className="journey-stat">
          <strong>{pad(earnedCount)}</strong>
          <p>
            {demo
              ? 'Marcas ilustrativas para você visualizar a proposta.'
              : 'Marcas nascidas das suas anotações, não da quantidade de vinho.'}
          </p>
        </div>
      </div>

      <div className="demo-info">
        <Icon name="info" />
        <p>
          {demo
            ? 'Este passaporte usa dados fictícios. Selecione “Minhas anotações” para ver apenas o que você registrou.'
            : 'Carimbo de origem significa que um país está nas suas anotações, não que você o visitou. Os exemplos nunca geram conquistas pessoais.'}
        </p>
      </div>
    </section>
  );
};
