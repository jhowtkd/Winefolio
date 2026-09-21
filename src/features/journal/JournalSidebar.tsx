import React from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { pad } from '../../components/proto/bits';
import { Icon } from '../../components/proto/Sprite';

interface JournalSidebarProps {
  entries: WineEntry[];
  ownCount: number;
  showDemo: boolean;
  onNewEntry: () => void;
}

/** Coluna lateral do caderno: nota de margem, recibo e rabisco — igual ao protótipo. */
export const JournalSidebar: React.FC<JournalSidebarProps> = ({
  entries,
  ownCount,
  showDemo,
  onNewEntry,
}) => {
  const countries = new Set(
    entries.map((e) => e.origin?.countryCode).filter(Boolean) as string[]
  ).size;
  const favorites = entries.filter((e) => e.favorite).length;
  const caption = showDemo
    ? ownCount > 0
      ? 'EXEMPLOS + SUAS PÁGINAS'
      : 'COLEÇÃO DEMONSTRATIVA'
    : 'SUAS ANOTAÇÕES';

  return (
    <aside className="side-column" aria-label="Notas do caderno">
      <div className="side-note">
        <div className="mono">Um lembrete, de leve</div>
        <h3>
          Não precisa entender
          <br />
          de tudo. Só prestar
          <br />
          atenção.
        </h3>
        <p>Uma cor, um aroma, uma boa conversa. Comece pelo que você lembra.</p>
        <button type="button" className="text-btn" onClick={onNewEntry}>
          Fazer uma anotação <Icon name="edit" />
        </button>
      </div>
      <div className="receipt">
        <div className="mono">Winefolio / arquivo pessoal</div>
        <h3>
          Pequeno inventário
          <br />
          de boas memórias.
        </h3>
        <div className="receipt-rule" />
        <div className="receipt-row">
          <span>RÓTULOS</span>
          <strong>{pad(entries.length)}</strong>
        </div>
        <div className="receipt-row">
          <span>ORIGENS</span>
          <strong>{pad(countries)}</strong>
        </div>
        <div className="receipt-row">
          <span>FAVORITOS</span>
          <strong>{pad(favorites)}</strong>
        </div>
        <div className="receipt-rule" />
        <p>
          Não é sobre quantos.
          <br />É sobre o que ficou.
        </p>
        <div className="barcode" aria-hidden="true" />
        <div className="mono" style={{ fontSize: 7, letterSpacing: 1.6 }}>
          {caption}
        </div>
      </div>
      <div className="sidebar-signoff hand">Seu ritmo. Seu repertório.</div>
      <svg className="side-mini" viewBox="0 0 110 85" aria-hidden="true">
        <use href="#doodle-glass" />
      </svg>
    </aside>
  );
};
