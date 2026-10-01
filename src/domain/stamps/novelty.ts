import type { StampDef, StampState } from './rules';

/** Marcos que a mudança de fichas acabou de ganhar e que a pessoa ainda não viu anunciados. */
export function newlyEarned(
  before: readonly StampState[],
  after: readonly StampState[],
  seen: Iterable<string>
): StampDef[] {
  const had = new Set(before.filter((state) => state.earned).map((state) => state.def.id));
  const known = new Set(seen);
  return after
    .filter((state) => state.earned && !had.has(state.def.id) && !known.has(state.def.id))
    .map((state) => state.def);
}

/** "Novo carimbo: Curioso de Chardonnay", "Novos carimbos: A e B", "Novos carimbos: A, B e mais 2". */
export function stampNotice(defs: readonly StampDef[]): string | null {
  if (defs.length === 0) return null;
  const titles = defs.map((def) => def.title);
  if (titles.length === 1) return `Novo carimbo no passaporte: ${titles[0]}`;
  if (titles.length === 2) return `Novos carimbos: ${titles[0]} e ${titles[1]}`;
  return `Novos carimbos: ${titles[0]}, ${titles[1]} e mais ${titles.length - 2}`;
}
