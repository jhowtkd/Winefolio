import type { WineEntry } from './wine-entry';

/**
 * Filtra entradas de vinho por nome do vinho, produtor ou safra.
 * Suporta múltiplos termos de busca (ex: "vento 2022").
 */
export function filterByWineProducerOrVintage(
  entries: WineEntry[],
  rawQuery: string
): WineEntry[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return entries;

  const tokens = query.split(/\s+/).filter(Boolean);

  return entries.filter((entry) => {
    const vinho = (entry.vinho || '').toLowerCase();
    const produtor = (entry.produtor || '').toLowerCase();
    const safra = (entry.safra || '').toLowerCase();

    // Combina os 3 campos principais solicitados
    const searchString = `${vinho} ${produtor} ${safra}`;

    return tokens.every((token) => searchString.includes(token));
  });
}
