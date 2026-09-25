import type { EntryDraft, StoreSnapshot, WineEntry } from './wine-entry';
import { createEntry } from './wine-factory';
import { WineEntrySchema } from './wine-schema';

export type ImportChoice = 'keep-existing' | 'replace';

export interface ImportDecisions {
  records: Record<string, ImportChoice>;
  draft: ImportChoice;
  preferences: ImportChoice;
}

interface PreviewShape {
  conflicts: Array<{ id: string }>;
  duplicates: string[];
  draft: EntryDraft | null;
}

/** Por padrão nada do que a pessoa já tem é trocado pelo backup. */
export function defaultImportDecisions(preview: PreviewShape, current: StoreSnapshot): ImportDecisions {
  const records: Record<string, ImportChoice> = {};
  for (const conflict of preview.conflicts) records[conflict.id] = 'keep-existing';
  for (const id of preview.duplicates) records[id] = 'keep-existing';
  return {
    records,
    draft: preview.draft && !current.draft ? 'replace' : 'keep-existing',
    preferences: 'keep-existing',
  };
}

/**
 * Completa uma ficha vinda de backup com os padrões de `createEntry` e valida.
 * O app pode gravar fichas sem `origin` ou com `null` em campo opcional; elas
 * não podem se perder na restauração. Devolve `null` quando não é uma ficha.
 */
export function normalizeImportedEntry(raw: unknown): WineEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, any>;
  if (typeof r.id !== 'string' || !r.id) return null;

  const base = createEntry(r.id, new Date(typeof r.criadoEm === 'number' ? r.criadoEm : Date.now()));
  const merged: Record<string, any> = {
    ...base,
    ...r,
    visual: { ...base.visual, ...r.visual },
    olfato: { ...base.olfato, ...r.olfato },
    paladar: { ...base.paladar, ...r.paladar },
    conclusao: { ...base.conclusao, ...r.conclusao },
    origin: { ...base.origin, ...r.origin },
    evidence: { ...base.evidence, ...r.evidence },
    provenance: r.provenance ?? base.provenance,
    importMetadata: r.importMetadata ?? base.importMetadata,
    aromaTags: Array.isArray(r.aromaTags) ? r.aromaTags : base.aromaTags,
  };
  for (const key of ['temperaturaServico', 'decantacao', 'tags']) {
    if (merged[key] === null) delete merged[key];
  }
  for (const key of ['corHex', 'perlage']) {
    if (merged.visual[key] === null) delete merged.visual[key];
  }

  const parsed = WineEntrySchema.safeParse(merged);
  return parsed.success ? (parsed.data as WineEntry) : null;
}
