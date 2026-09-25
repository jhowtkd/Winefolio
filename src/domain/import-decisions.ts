import type { EntryDraft, StoreSnapshot, WineEntry } from './wine-entry';
import { createEntry } from './wine-factory';
import { WineEntrySchema } from './wine-schema';
import { needsUpgrade, upgradeToV3 } from './asi-convert';

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
 * não podem se perder na restauração. Ficha anterior à grade ASI (formato 2) é
 * convertida antes. Devolve `null` quando não é uma ficha.
 */
export function normalizeImportedEntry(raw: unknown): WineEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof (raw as Record<string, any>).id !== 'string' || !(raw as Record<string, any>).id) return null;
  const r = needsUpgrade(raw) ? upgradeToV3(raw as Record<string, any>) : (raw as Record<string, any>);

  const base = createEntry(r.id, new Date(typeof r.criadoEm === 'number' ? r.criadoEm : Date.now()));
  const merged: Record<string, any> = {
    ...base,
    ...r,
    visual: { ...base.visual, ...r.visual },
    olfato: { ...base.olfato, ...r.olfato },
    paladar: { ...base.paladar, ...r.paladar },
    conclusao: { ...base.conclusao, ...r.conclusao },
    servico: { ...base.servico, ...r.servico },
    legacyNotes: r.legacyNotes ?? base.legacyNotes,
    origin: { ...base.origin, ...r.origin },
    evidence: { ...base.evidence, ...r.evidence },
    provenance: r.provenance ?? base.provenance,
    importMetadata: r.importMetadata ?? base.importMetadata,
    aromaTags: Array.isArray(r.aromaTags) ? r.aromaTags : base.aromaTags,
  };
  if (merged.tags === null) delete merged.tags;
  if (merged.visual.corHex === null) delete merged.visual.corHex;

  const parsed = WineEntrySchema.safeParse(merged);
  return parsed.success ? (parsed.data as WineEntry) : null;
}

/** O rascunho de um backup passa pela mesma normalização das fichas. */
export function normalizeImportedDraft(raw: unknown): EntryDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const draft = raw as Record<string, any>;
  const entry = normalizeImportedEntry(draft.entry);
  if (!entry) return null;
  return {
    id: 'active',
    entry,
    editingId: typeof draft.editingId === 'string' ? draft.editingId : null,
    baseRevision: typeof draft.baseRevision === 'number' ? draft.baseRevision : null,
    updatedAt: typeof draft.updatedAt === 'number' ? draft.updatedAt : Date.now(),
  };
}
