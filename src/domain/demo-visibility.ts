import type { WineEntry } from './wine-entry';

export function visibleEntries(entries: WineEntry[], showDemo: boolean): WineEntry[] {
  if (showDemo) return entries;
  return entries.filter((entry) => entry.kind !== 'demo');
}

export function applyDemoFavorites(
  entries: WineEntry[],
  favorites: Record<string, boolean>
): WineEntry[] {
  return entries.map((entry) => {
    if (entry.kind !== 'demo') return entry;
    if (!Object.prototype.hasOwnProperty.call(favorites, entry.id)) return entry;
    const favorite = Boolean(favorites[entry.id]);
    if (entry.favorite === favorite) return entry;
    return { ...entry, favorite };
  });
}
