import React, { useState } from 'react';
import { ModalDialog } from '../../components/proto/ModalDialog';
import type { ImportPreview, ImportDecisions } from '../../repositories/transfer';
import type { WineEntry } from '../../domain/wine-entry';

interface ImportPreviewDialogProps {
  preview: ImportPreview;
  defaults: ImportDecisions;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (decisions: ImportDecisions) => void;
}

function label(entry: WineEntry): string {
  const name = entry.vinho || entry.produtor || 'Página sem título';
  return entry.safra ? `${name} · ${entry.safra}` : name;
}

function updatedAt(entry: WineEntry): string {
  return new Date(entry.atualizadoEm).toLocaleDateString('pt-BR');
}

/** Mostra o que a importação vai fazer antes de gravar qualquer coisa. */
export const ImportPreviewDialog: React.FC<ImportPreviewDialogProps> = ({
  preview,
  defaults,
  busy,
  onCancel,
  onConfirm,
}) => {
  const [decisions, setDecisions] = useState<ImportDecisions>(defaults);

  const fresh = preview.entries.length - preview.duplicates.length - preview.conflicts.length;
  const replaced = preview.conflicts.filter((c) => decisions.records[c.id] === 'replace').length;
  const toWrite = fresh + replaced;

  const choose = (id: string, choice: 'keep-existing' | 'replace') =>
    setDecisions((prev) => ({ ...prev, records: { ...prev.records, [id]: choice } }));

  return (
    <ModalDialog
      label="Winefolio / restaurar backup"
      closeLabel="Cancelar importação"
      onClose={onCancel}
      ariaLabelledBy="import-preview-title"
      footer={
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || (toWrite === 0 && decisions.preferences === 'keep-existing' && decisions.draft === 'keep-existing')}
            onClick={() => onConfirm(decisions)}
          >
            {busy ? 'Importando...' : `Importar ${toWrite} ${toWrite === 1 ? 'ficha' : 'fichas'}`}
          </button>
        </div>
      }
    >
      <h2 id="import-preview-title" className="font-serif text-2xl mb-3">
        O que tem neste backup
      </h2>
      <p className="text-sm" data-testid="import-summary">
        {fresh} {fresh === 1 ? 'nova' : 'novas'} · {preview.duplicates.length}{' '}
        {preview.duplicates.length === 1 ? 'igual' : 'iguais'} (ignoradas) ·{' '}
        {preview.conflicts.length} em conflito · {preview.warnings.length}{' '}
        {preview.warnings.length === 1 ? 'aviso' : 'avisos'}
      </p>

      {preview.conflicts.length > 0 && (
        <div className="mt-5">
          <h3 className="font-sans text-sm font-semibold mb-2">
            Fichas que existem dos dois lados e estão diferentes
          </h3>
          <ul className="space-y-3">
            {preview.conflicts.map((conflict) => (
              <li key={conflict.id} className="border-b border-dashed border-[var(--line)] pb-3">
                <fieldset>
                  <legend className="text-sm font-semibold">{label(conflict.existing)}</legend>
                  <label className="flex items-center gap-2 text-xs mt-1">
                    <input
                      type="radio"
                      name={`conflict-${conflict.id}`}
                      checked={decisions.records[conflict.id] !== 'replace'}
                      onChange={() => choose(conflict.id, 'keep-existing')}
                    />
                    Manter a minha (atualizada em {updatedAt(conflict.existing)})
                  </label>
                  <label className="flex items-center gap-2 text-xs mt-1">
                    <input
                      type="radio"
                      name={`conflict-${conflict.id}`}
                      checked={decisions.records[conflict.id] === 'replace'}
                      onChange={() => choose(conflict.id, 'replace')}
                    />
                    Usar a do backup: {label(conflict.incoming)} (atualizada em{' '}
                    {updatedAt(conflict.incoming)})
                  </label>
                </fieldset>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(preview.preferences || preview.draft) && (
        <div className="mt-5 space-y-2">
          {preview.preferences && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={decisions.preferences === 'replace'}
                onChange={(e) =>
                  setDecisions((prev) => ({ ...prev, preferences: e.target.checked ? 'replace' : 'keep-existing' }))
                }
              />
              Substituir também as preferências (tema, texturas, exemplos)
            </label>
          )}
          {preview.draft && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={decisions.draft === 'replace'}
                onChange={(e) =>
                  setDecisions((prev) => ({ ...prev, draft: e.target.checked ? 'replace' : 'keep-existing' }))
                }
              />
              Restaurar o rascunho do backup
              {defaults.draft === 'keep-existing' ? ' (troca o rascunho que está aberto aqui)' : ''}
            </label>
          )}
        </div>
      )}

      {preview.warnings.length > 0 && (
        <details className="mt-5 text-xs">
          <summary className="cursor-pointer">Ver avisos ({preview.warnings.length})</summary>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            {preview.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
    </ModalDialog>
  );
};
