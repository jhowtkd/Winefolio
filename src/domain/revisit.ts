import type { WineEntry } from './wine-entry';

/** Campos de controle: mudar só eles não é voltar à ficha para escrever. */
const BOOKKEEPING = new Set([
  'revision',
  'atualizadoEm',
  'criadoEm',
  'favorite',
  'provenance',
  'evidence',
  'photoId',
  'importMetadata',
  'kind',
  'sourceFormat',
  '_demo',
]);

/** JSON com chaves ordenadas e sem `undefined`, para comparar conteúdo e não ordem de chaves. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>)
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function content(entry: WineEntry): string {
  const rest = Object.fromEntries(Object.entries(entry).filter(([key]) => !BOOKKEEPING.has(key)));
  return canonical(rest);
}

/** A pessoa mudou o que a ficha diz (não só favorito, revisão ou confirmação da IA). */
export function contentChanged(previous: WineEntry, next: WineEntry): boolean {
  return content(previous) !== content(next);
}

/**
 * Marca a primeira volta a uma ficha já salva. Ficha nova e ficha de exemplo ficam como estão;
 * a data da primeira revisita não muda nas seguintes.
 */
export function withRevisit(previous: WineEntry | null | undefined, next: WineEntry, now: number): WineEntry {
  if (!previous || next.kind === 'demo' || next._demo) return next;
  const first = previous.evidence?.revisitedAt ?? next.evidence?.revisitedAt ?? null;
  const revisitedAt = first ?? (contentChanged(previous, next) ? now : null);
  if (revisitedAt === (next.evidence?.revisitedAt ?? null)) return next;
  return { ...next, evidence: { ...next.evidence, revisitedAt } };
}
