import type { Family, StampState } from './rules';

export type TabFamily = Exclude<Family, 'legado'>;

/** Abas da página de marcos. Os legados ficam na página 02. */
export const FAMILY_TABS: ReadonlyArray<{ family: TabFamily; label: string }> = [
  { family: 'uva', label: 'Uvas' },
  { family: 'regiao', label: 'Regiões' },
  { family: 'pais', label: 'Países' },
  { family: 'estilo', label: 'Estilos' },
  { family: 'critica', label: 'Crítica' },
  { family: 'tecnica', label: 'Técnica' },
  { family: 'volume', label: 'Volume' },
  { family: 'harmonizacao', label: 'Mesa' },
  { family: 'secreto', label: 'Secretos' },
];

function byRecent(a: StampState, b: StampState): number {
  const dateA = a.earnedAt ?? '';
  const dateB = b.earnedAt ?? '';
  if (dateA !== dateB) return dateA < dateB ? 1 : -1;
  return b.def.tier - a.def.tier;
}

function byCloseness(a: StampState, b: StampState): number {
  const ratio = (s: StampState) => (s.target ? Math.min(1, s.current / s.target) : 0);
  if (ratio(a) !== ratio(b)) return ratio(b) - ratio(a);
  return a.def.tier - b.def.tier;
}

/**
 * Marcos de uma aba: ganhos primeiro (mais recentes antes), depois bloqueados pelo quanto falta.
 * Nas famílias paramétricas, uva ou região sem ficha não aparece, e só o próximo nível bloqueado entra.
 */
export function visibleStamps(states: readonly StampState[], family: Family): StampState[] {
  const inFamily = states.filter((state) => state.def.family === family);
  const bySubject = new Map<string, StampState[]>();
  const shown: StampState[] = [];
  for (const state of inFamily) {
    if (!state.def.subject) {
      shown.push(state);
      continue;
    }
    const tiers = bySubject.get(state.def.subject) ?? [];
    tiers.push(state);
    bySubject.set(state.def.subject, tiers);
  }
  for (const tiers of bySubject.values()) {
    if (!tiers.some((state) => state.current > 0)) continue;
    const sorted = [...tiers].sort((a, b) => a.def.tier - b.def.tier);
    shown.push(...sorted.filter((state) => state.earned));
    const next = sorted.find((state) => !state.earned);
    if (next) shown.push(next);
  }
  const earned = shown.filter((state) => state.earned).sort(byRecent);
  const locked = shown.filter((state) => !state.earned).sort(byCloseness);
  return [...earned, ...locked];
}

export function stampSummary(states: readonly StampState[]): { earned: number; total: number } {
  return { earned: states.filter((state) => state.earned).length, total: states.length };
}
