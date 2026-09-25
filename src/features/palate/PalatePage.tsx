import React, { useMemo, useState } from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { Icon } from '../../components/proto/Sprite';
import { ModeToggle, pad } from '../../components/proto/bits';

type Mode = 'mine' | 'demo';

interface PalatePageProps {
  entries: WineEntry[];
  demoEntries: WineEntry[];
  defaultMode: Mode;
  onAromaSearch: (aroma: string, mode: Mode) => void;
  onRevisit: (entry: WineEntry | undefined, mode: Mode) => void;
}

const STYLE_LABELS: Array<[string, string]> = [
  ['tinto', 'Tintos'],
  ['branco', 'Brancos'],
  ['rose', 'Rosés'],
  ['espumante', 'Espumantes'],
  ['mistela', 'Mistelas'],
  ['aromatizado', 'Aromatizados'],
];

/** Barras que aparecem mesmo zeradas. Os tipos raros só aparecem quando existem. */
const ALWAYS_SHOWN = new Set(['tinto', 'branco', 'rose', 'espumante']);

function styleOf(e: WineEntry): string | null {
  if (e.tipo === 'espumante' || e.tipo === 'mistela' || e.tipo === 'aromatizado') return e.tipo;
  return e.estilo;
}

/** Meu paladar: recorte das anotações (métricas, barras de estilo, nuvem de aromas). */
export const PalatePage: React.FC<PalatePageProps> = ({
  entries,
  demoEntries,
  defaultMode,
  onAromaSearch,
  onRevisit,
}) => {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const demo = mode === 'demo';
  const records = demo ? demoEntries : entries;

  const rated = records.filter((e) => e.conclusao?.avaliacaoEstrelas);
  const avg = rated.length
    ? (rated.reduce((n, e) => n + (e.conclusao!.avaliacaoEstrelas ?? 0), 0) / rated.length)
        .toFixed(1)
        .replace('.', ',')
    : '—';
  const countries = new Set(
    records.map((e) => e.origin?.countryCode).filter((c) => c && c !== 'other')
  ).size;
  const aromas = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of records) {
      for (const a of e.aromaTags || []) map.set(a, (map.get(a) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [records]);
  const styles = STYLE_LABELS.map(([k, label]) => [
    k,
    label,
    records.filter((e) => styleOf(e) === k).length,
  ]).filter(([k, , n]) => ALWAYS_SHOWN.has(k as string) || (n as number) > 0) as Array<[string, string, number]>;
  const someUnstyled = records.some((e) => !styleOf(e));

  return (
    <section className="page-view" aria-labelledby="palate-title">
      <div className="page-heading">
        <div>
          <div className="mono ink-wine">Um olhar para as suas anotações</div>
          <h1 id="palate-title" tabIndex={-1}>
            O seu gosto
            <br />
            tem <em>história.</em>
          </h1>
          <p>
            Não é um diagnóstico do seu paladar.
            <br />É só um jeito de enxergar o que você vem registrando.
          </p>
        </div>
        <ModeToggle current={mode} onChange={setMode} />
      </div>

      <div className="palate-layout">
        <article className="paper-panel">
          <span className="tape" aria-hidden="true" />
          <div className="mono ink-wine">
            {demo ? 'RECORTE ILUSTRATIVO' : 'SEU RECORTE PESSOAL'}
          </div>
          <h2>O que aparece no caderno.</h2>
          <p>
            {demo
              ? 'Uma coleção fictícia para testar esta visualização.'
              : 'Os números consideram apenas suas páginas, sem os exemplos.'}
          </p>
          <div className="palate-metrics">
            <div>
              <strong>{pad(records.length)}</strong>
              <span>Anotações</span>
            </div>
            <div>
              <strong>{pad(countries)}</strong>
              <span>Origens</span>
            </div>
            <div>
              <strong>{avg}</strong>
              <span>
                Média de {rated.length} {rated.length === 1 ? 'nota' : 'notas'}
              </span>
            </div>
          </div>
          <div className="style-bars">
            {styles.map(([key, label, n]) => (
              <div className="style-bar" key={key}>
                <span>{label}</span>
                <div
                  className="bar-track"
                  role="img"
                  aria-label={`${n} ${label} em ${records.length} registros`}
                >
                  <div
                    className="bar-fill"
                    style={{ width: `${records.length ? (n / records.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="mono">{pad(n)}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22, fontSize: 10 }}>
            {someUnstyled ? 'Anotações sem estilo ficam fora das barras. ' : ''}
            Uma nota em branco nunca é tratada como zero.
          </p>
        </article>

        <article className="paper-panel">
          <div className="mono ink-wine">{demo ? 'PALAVRAS DO EXEMPLO' : 'SUAS REFERÊNCIAS'}</div>
          <h2>O que o nariz lembrou.</h2>
          <p>Palavras registradas, sem interpretações inventadas.</p>
          <div className="aroma-cloud">
            {aromas.length ? (
              aromas.map(([aroma, n]) => (
                <button
                  key={aroma}
                  type="button"
                  className="aroma-word"
                  aria-label={`Encontrar ${n} ${n === 1 ? 'anotação' : 'anotações'} com ${aroma}`}
                  onClick={() => onAromaSearch(aroma, mode)}
                >
                  {aroma}{' '}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9 }}>{n}</span>
                </button>
              ))
            ) : (
              <p className="muted" style={{ padding: '25px 0', fontSize: 12 }}>
                Os aromas que você registrar aparecerão aqui. Não precisa acertar um vocabulário
                técnico.
              </p>
            )}
          </div>
          <div className="palate-note">Seu jeito de descrever também conta.</div>
        </article>
      </div>

      <div className="revisit-panel">
        <div>
          <h2>Uma memória pode ganhar outra camada.</h2>
          <p>Volte a uma ficha. Talvez tenha um detalhe que você ainda queira guardar.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onRevisit(records[0], mode)}
        >
          Revisitar uma página <Icon name="arrow" />
        </button>
      </div>

      <div className="demo-info">
        <Icon name="info" />
        <p>
          {demo
            ? 'Todos os dados desta visualização são fictícios. Não representam seus hábitos ou preferências.'
            : 'Este resumo usa somente os campos preenchidos por você. Não há inferência por IA nem classificação de personalidade.'}
        </p>
      </div>
    </section>
  );
};
