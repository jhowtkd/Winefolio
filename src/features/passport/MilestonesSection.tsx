import React, { useEffect, useMemo, useState } from 'react';
import type { StampState } from '../../domain/stamps/rules';
import { FAMILY_TABS, visibleStamps, type TabFamily } from '../../domain/stamps/view';
import { MilestoneStamp } from '../../components/proto/MilestoneStamp';
import { ModalDialog } from '../../components/proto/ModalDialog';
import { shortDate } from '../../components/proto/bits';

interface MilestonesSectionProps {
  states: StampState[];
  demo: boolean;
  /** Ganho e ainda não visto quando a página abriu. */
  isNew: (id: string) => boolean;
  onOpenEntry: (id: string) => void;
}

const TIER_LABEL = { 1: 'BRONZE', 2: 'PRATA', 3: 'OURO' } as const;

function isSecret(state: StampState): boolean {
  return Boolean(state.def.hidden) && !state.earned;
}

/** PNGs gerados por `scripts/render-stamps.mjs`. Sem manifesto, o botão de baixar não aparece. */
function usePngIds(): ReadonlySet<string> {
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    let alive = true;
    fetch('/stamps/manifest.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (alive && Array.isArray(data?.ids)) setIds(new Set(data.ids));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return ids;
}

const MilestoneCard: React.FC<{ state: StampState; demo: boolean; isNew: boolean; onOpen: () => void }> = ({
  state,
  demo,
  isNew,
  onOpen,
}) => {
  const secret = isSecret(state);
  const progress = Math.min(state.current, state.target);
  return (
    <li>
      <button type="button" className={`milestone-card ${state.earned ? 'earned' : 'locked'}`} onClick={onOpen}>
        <span className="milestone-art">
          <MilestoneStamp def={state.def} status={state.earned ? 'earned' : 'locked'} />
          {isNew && <span className="milestone-new">NOVO</span>}
        </span>
        <span className="milestone-title">{secret ? 'Marco secreto' : state.def.title}</span>
        {state.earned ? (
          <span className="milestone-meta">{demo ? 'EXEMPLO' : shortDate(state.earnedAt)}</span>
        ) : secret ? (
          <span className="milestone-meta">SE REVELA AO SER GANHO</span>
        ) : (
          <>
            <span className="milestone-progress" aria-hidden="true">
              <span style={{ width: `${(progress / state.target) * 100}%` }} />
            </span>
            <span className="milestone-meta">
              {progress} DE {state.target}
            </span>
          </>
        )}
      </button>
    </li>
  );
};

const MilestoneDialog: React.FC<{
  state: StampState;
  demo: boolean;
  png: boolean;
  onClose: () => void;
  onOpenEntry: (id: string) => void;
}> = ({ state, demo, png, onClose, onOpenEntry }) => {
  const secret = isSecret(state);
  const family = FAMILY_TABS.find((tab) => tab.family === state.def.family)?.label ?? 'Passaporte';
  const entryId = state.earnedByEntryId;
  return (
    <ModalDialog label="Winefolio / marco do passaporte" closeLabel="Fechar marco" onClose={onClose} ariaLabelledBy="milestone-dialog-title">
      <div className="milestone-dialog">
        <div className="milestone-dialog-art">
          <MilestoneStamp def={state.def} status={state.earned ? 'earned' : 'locked'} earnedAt={state.earnedAt} postmark={state.earned} />
        </div>
        <div className="milestone-dialog-text">
          <div className="mono muted">
            {secret ? 'SECRETO' : `${family} · ${TIER_LABEL[state.def.tier]}`}
          </div>
          <h2 id="milestone-dialog-title">{secret ? 'Marco secreto' : state.def.title}</h2>
          <p>{secret ? 'Continue anotando do seu jeito. Ele se revela quando for ganho.' : state.def.description}</p>
          {state.earned ? (
            <p className="mono ink-wine">{demo ? 'CARIMBO ILUSTRATIVO' : `GANHO EM ${shortDate(state.earnedAt)}`}</p>
          ) : (
            !secret && (
              <p className="mono muted">
                {Math.min(state.current, state.target)} DE {state.target} · {state.def.motto}
              </p>
            )
          )}
          <div className="milestone-dialog-actions">
            {state.earned && !demo && entryId && (
              <button type="button" className="text-btn" onClick={() => onOpenEntry(entryId)}>
                Ver a ficha que desbloqueou
              </button>
            )}
            {state.earned && !demo && png && (
              <a className="text-btn" href={`/stamps/${state.def.id}.png`} download={`winefolio-${state.def.id}.png`}>
                Baixar PNG
              </a>
            )}
          </div>
        </div>
      </div>
    </ModalDialog>
  );
};

/** Página 03 do Passaporte: os marcos por família. */
export const MilestonesSection: React.FC<MilestonesSectionProps> = ({ states, demo, isNew, onOpenEntry }) => {
  const byFamily = useMemo(
    () => new Map(FAMILY_TABS.map((tab) => [tab.family, visibleStamps(states, tab.family)])),
    [states]
  );
  const hasNew = (family: TabFamily) => (byFamily.get(family) ?? []).some((s) => s.earned && isNew(s.def.id));
  const [tab, setTab] = useState<TabFamily>(
    () =>
      FAMILY_TABS.find((t) => hasNew(t.family))?.family ??
      FAMILY_TABS.find((t) => (byFamily.get(t.family) ?? []).some((s) => s.earned))?.family ??
      'volume'
  );
  const [selected, setSelected] = useState<StampState | null>(null);
  const pngIds = usePngIds();
  const shown = byFamily.get(tab) ?? [];

  return (
    <>
      <div className="filters milestone-tabs" role="group" aria-label="Famílias de marcos">
        {FAMILY_TABS.map((t) => {
          const earned = (byFamily.get(t.family) ?? []).filter((s) => s.earned).length;
          return (
            <button
              key={t.family}
              type="button"
              className={`filter ${tab === t.family ? 'active' : ''} ${hasNew(t.family) ? 'has-new' : ''}`}
              aria-pressed={tab === t.family}
              onClick={() => setTab(t.family)}
            >
              {t.label}
              {earned > 0 && <span className="milestone-count"> {earned}</span>}
            </button>
          );
        })}
      </div>

      {shown.length ? (
        <ul className="milestone-grid">
          {shown.map((state) => (
            <MilestoneCard
              key={state.def.id}
              state={state}
              demo={demo}
              isNew={state.earned && isNew(state.def.id)}
              onOpen={() => setSelected(state)}
            />
          ))}
        </ul>
      ) : (
        <p className="milestone-empty muted">
          {tab === 'uva'
            ? 'Cada uva aparece aqui depois da primeira ficha com ela.'
            : 'Cada região aparece aqui depois da primeira ficha de lá.'}
        </p>
      )}

      {selected && (
        <MilestoneDialog
          state={selected}
          demo={demo}
          png={pngIds.has(selected.def.id)}
          onClose={() => setSelected(null)}
          onOpenEntry={onOpenEntry}
        />
      )}
    </>
  );
};
