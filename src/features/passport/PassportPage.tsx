import React, { useEffect, useMemo, useState } from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { evaluateStamps } from '../../domain/stamps/evaluate';
import { stampSummary } from '../../domain/stamps/view';
import { CountryStamp } from '../../components/proto/CountryStamp';
import { Icon } from '../../components/proto/Sprite';
import { ModeToggle, pad } from '../../components/proto/bits';
import { MilestonesSection } from './MilestonesSection';

type Mode = 'mine' | 'demo';

interface PassportPageProps {
  entries: WineEntry[];
  demoEntries: WineEntry[];
  defaultMode: Mode;
  onOpenCountry: (code: string, mode: Mode) => void;
  /** Carimbos já vistos, gravados nas preferências. */
  seenStampIds: readonly string[];
  /** Carimbos anunciados nesta sessão e ainda não vistos aqui. */
  highlights: ReadonlySet<string>;
  onStampsSeen: (ids: string[]) => void;
  onOpenEntry: (id: string) => void;
}

/** Ícone do sprite de cada marca antiga da página 02. */
const LEGACY_ICONS: Record<string, string> = {
  'legado.first': 'book',
  'legado.vocabulary': 'leaf',
  'legado.revisited': 'edit',
  'legado.origin': 'passport',
};

/** Passaporte do paladar: carimbos de origem, pequenas conquistas e marcos, no padrão do protótipo. */
export const PassportPage: React.FC<PassportPageProps> = ({
  entries,
  demoEntries,
  defaultMode,
  onOpenCountry,
  seenStampIds,
  highlights,
  onStampsSeen,
  onOpenEntry,
}) => {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const demo = mode === 'demo';
  const records = demo ? demoEntries : entries;

  // Marcos pessoais só das fichas pessoais; os de exemplo só das fichas de exemplo.
  const personalStates = useMemo(() => evaluateStamps(entries), [entries]);
  const demoStates = useMemo(() => evaluateStamps(demoEntries, { source: 'demo' }), [demoEntries]);
  const states = demo ? demoStates : personalStates;
  const legacy = states.filter((state) => state.def.family === 'legado');
  const summary = stampSummary(states);

  // "NOVO" vale para esta visita: foto do que ainda não tinha sido visto quando a página abriu.
  const [seenAtOpen] = useState(() => new Set(seenStampIds));
  const [highlightedAtOpen] = useState(() => new Set(highlights));
  const isNew = (id: string) => !demo && (!seenAtOpen.has(id) || highlightedAtOpen.has(id));

  useEffect(() => {
    onStampsSeen(personalStates.filter((state) => state.earned).map((state) => state.def.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalStates]);

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of records) {
      const code = e.origin?.countryCode;
      if (code && code !== 'other') map.set(code, (map.get(code) ?? 0) + 1);
    }
    return map;
  }, [records]);

  const blanks = Array.from(
    { length: Math.max(1, Math.min(4, 6 - countries.size)) },
    (_, i) => i
  );

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
            Marcos que contam fichas, sem prazo, sem pressa e sem precisar ir a lugar nenhum.
          </p>
        </div>
        <ModeToggle current={mode} onChange={setMode} />
      </div>

      <div className="passport-book">
        <div className="book-spread">
          <div className="book-page">
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
              {[...countries.entries()].map(([code, n], i) => (
                <CountryStamp
                  key={code}
                  code={code}
                  count={n}
                  index={i}
                  onOpen={(c) => onOpenCountry(c, mode)}
                />
              ))}
              {blanks.map((i) => (
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
            <span className="page-number">01 / ORIGENS</span>
          </div>

          <div className="book-page">
            <div className="mono muted" style={{ fontSize: 8 }}>
              {demo ? 'AS MARCAS ABAIXO SÃO APENAS EXEMPLOS' : 'MARCAS DO SEU JEITO DE ANOTAR'}
            </div>
            <h2>Do seu jeito.</h2>
            <p className="muted">O que vale aqui é observar, registrar e revisitar.</p>
            <div className="journey-list">
              {legacy.map(({ def, earned: isEarned }) => {
                return (
                  <div key={def.id} className={`journey-item ${isEarned ? '' : 'locked'}`}>
                    <span className="journey-seal">
                      <Icon name={isEarned ? LEGACY_ICONS[def.id] : 'lock'} />
                    </span>
                    <div>
                      <h3>{def.title}</h3>
                      <p>{def.description}</p>
                      <small>
                        {demo
                          ? isEarned
                            ? 'EXEMPLO DE CARIMBO'
                            : 'EXEMPLO DE ESPAÇO ABERTO'
                          : isEarned
                            ? 'REGISTRADO NO SEU CADERNO'
                            : 'QUANDO FIZER SENTIDO PARA VOCÊ'}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
            <span className="page-number">02 / PEQUENAS CONQUISTAS</span>
          </div>
        </div>
      </div>

      <div className="passport-book milestones-book">
        <div className="book-spread single">
          <div className="book-page">
            <div className="mono muted" style={{ fontSize: 8 }}>
              {demo ? 'CARIMBOS ILUSTRATIVOS / COLEÇÃO DE EXEMPLO' : 'MARCOS DO CADERNO / CONTAM FICHAS, NUNCA DIAS'}
            </div>
            <h2>Marcos do caderno.</h2>
            <p className="muted">
              {demo
                ? 'Selos de exemplo, tirados das seis fichas fictícias.'
                : `${summary.earned} de ${summary.total} marcos, todos tirados das fichas que você guardou.`}
            </p>
            <MilestonesSection
              key={mode}
              states={states}
              demo={demo}
              isNew={isNew}
              onOpenEntry={onOpenEntry}
            />
            <span className="page-number">03 / MARCOS</span>
          </div>
        </div>
      </div>

      <div className="passport-bottom">
        <div className="note-horizontal">
          <Icon name="book" />
          <div>
            <h3>A experiência é sua. O ritmo também.</h3>
            <p>
              Os marcos contam fichas guardadas, nunca dias seguidos. Sem ranking, sem prazo e sem
              incentivo a beber mais. Relembrar uma página também faz parte.
            </p>
          </div>
        </div>
        <div className="journey-stat">
          <strong>{pad(summary.earned)}</strong>
          <p>
            de {summary.total} marcos.{' '}
            {demo
              ? 'Marcas ilustrativas para você visualizar a proposta.'
              : 'Todas nascidas das suas fichas, no seu ritmo.'}
          </p>
        </div>
      </div>

      <div className="demo-info">
        <Icon name="info" />
        <p>
          {demo
            ? 'Este passaporte usa dados fictícios. Selecione “Minhas anotações” para ver apenas o que você registrou.'
            : 'Carimbo de origem significa que um país está nas suas anotações, não que você o visitou. Os marcos contam fichas, não garrafas, e os exemplos nunca geram conquistas pessoais.'}
        </p>
      </div>
    </section>
  );
};
