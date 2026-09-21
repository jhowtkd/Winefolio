import React, { useMemo, useState } from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { countryName } from '../../domain/countries';
import { CountryStamp } from '../../components/proto/CountryStamp';
import { Icon } from '../../components/proto/Sprite';
import { ModeToggle, pad } from '../../components/proto/bits';

type Mode = 'mine' | 'demo';

interface PassportPageProps {
  entries: WineEntry[];
  demoEntries: WineEntry[];
  defaultMode: Mode;
  onOpenCountry: (code: string, mode: Mode) => void;
}

interface Milestone {
  key: 'first' | 'vocabulary' | 'revisited' | 'origin';
  glyph: string;
  title: string;
  description: string;
}

const MILESTONES: Milestone[] = [
  ['first', 'book', 'Primeira página', 'Uma impressão pessoal guardada, do seu jeito.'],
  ['vocabulary', 'leaf', 'Meu vocabulário', 'Um aroma descrito com as suas próprias referências.'],
  ['revisited', 'edit', 'Memória revisitada', 'Uma nova observação acrescentada a uma ficha sua.'],
  ['origin', 'passport', 'Origem registrada', 'O país de um rótulo confirmado no caderno.'],
].map(([key, glyph, title, description]) => ({
  key: key as Milestone['key'],
  glyph: glyph as string,
  title: title as string,
  description: description as string,
}));

/** Passaporte do paladar: carimbos de origem e pequenas conquistas, no padrão do protótipo. */
export const PassportPage: React.FC<PassportPageProps> = ({
  entries,
  demoEntries,
  defaultMode,
  onOpenCountry,
}) => {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const demo = mode === 'demo';
  const records = demo ? demoEntries : entries;

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of records) {
      const code = e.origin?.countryCode;
      if (code && code !== 'other') map.set(code, (map.get(code) ?? 0) + 1);
    }
    return map;
  }, [records]);

  const earned = {
    first: records.some((e) => e.conclusao?.impressaoFinal?.trim()),
    vocabulary: records.some((e) => e.aromaTags?.length),
    revisited: records.some((e) => e.evidence?.revisitedAt),
    origin: countries.size > 0,
  };
  const earnedCount = Object.values(earned).filter(Boolean).length;
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
            Sem metas, sem pressa, sem precisar ir a lugar nenhum.
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
              {demo ? 'AS MARCAS ABAIXO SÃO APENAS EXEMPLOS' : 'CONQUISTAS SEM CONTAGEM DE CONSUMO'}
            </div>
            <h2>Do seu jeito.</h2>
            <p className="muted">O que vale aqui é observar, registrar e revisitar.</p>
            <div className="journey-list">
              {MILESTONES.map((m) => {
                const isEarned = earned[m.key];
                return (
                  <div key={m.key} className={`journey-item ${isEarned ? '' : 'locked'}`}>
                    <span className="journey-seal">
                      <Icon name={isEarned ? m.glyph : 'lock'} />
                    </span>
                    <div>
                      <h3>{m.title}</h3>
                      <p>{m.description}</p>
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
