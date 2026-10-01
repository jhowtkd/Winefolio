import type { WineEntry } from '../wine-entry';
import { STAMPS } from './catalog';
import { countryOf, grapesOf, regionsOf } from './normalize';
import { createRuleMemo, runRule, type Ctx, type StampDef, type StampState } from './rules';

/** `personal`: só fichas da pessoa. `demo`: só as fichas de exemplo, para os carimbos ilustrativos. */
export type StampSource = 'personal' | 'demo';

export interface EvaluateOptions {
  source?: StampSource;
}

export function isDemoEntry(entry: WineEntry): boolean {
  return entry.kind === 'demo' || Boolean(entry._demo);
}

/** Ordem de degustação; desempate pela criação e pelo id, para o resultado não depender da entrada. */
export function chronological(a: WineEntry, b: WineEntry): number {
  const dateA = a.dataDegustacao || '';
  const dateB = b.dataDegustacao || '';
  if (dateA !== dateB) return dateA < dateB ? -1 : 1;
  if (a.criadoEm !== b.criadoEm) return (a.criadoEm || 0) - (b.criadoEm || 0);
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function buildCtx(entries: readonly WineEntry[], source: StampSource = 'personal'): Ctx {
  const wanted = entries.filter((entry) => isDemoEntry(entry) === (source === 'demo')).sort(chronological);
  return {
    entries: wanted,
    byId: new Map(wanted.map((entry) => [entry.id, entry])),
    grapes: new Map(wanted.map((entry) => [entry.id, grapesOf(entry)])),
    regions: new Map(wanted.map((entry) => [entry.id, regionsOf(entry)])),
    countries: new Map(wanted.map((entry) => [entry.id, countryOf(entry)])),
  };
}

/** Estado de cada marco a partir das fichas. Função pura: mesmas fichas, mesmo resultado. */
export function evaluate(
  defs: readonly StampDef[],
  entries: readonly WineEntry[],
  options: EvaluateOptions = {}
): StampState[] {
  const ctx = buildCtx(entries, options.source);
  const memo = createRuleMemo();
  return defs.map((def) => {
    const { current, target, crossing } = runRule(def.rule, ctx, memo);
    const earned = current >= target;
    return {
      def,
      earned,
      current,
      target,
      earnedAt: earned ? crossing?.dataDegustacao || null : null,
      earnedByEntryId: earned ? (crossing?.id ?? null) : null,
    };
  });
}

/** Todos os marcos do catálogo. */
export function evaluateStamps(entries: readonly WineEntry[], options: EvaluateOptions = {}): StampState[] {
  return evaluate(STAMPS, entries, options);
}
