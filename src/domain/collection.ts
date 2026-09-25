import type { WineEntry } from './wine-entry';
import { countryName } from './countries';

export type CollectionTab = 'all' | 'favorites' | 'sparkling';
export type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'name-asc' | 'vintage-desc';

export interface FilterOptions {
  query?: string;
  tab?: CollectionTab;
  style?: string; // 'all' | 'tinto' | 'branco' | 'rose' | 'espumante'
  country?: string;
  vintage?: string;
  rating?: 'all' | 1 | 2 | 3 | 4 | 5;
  tag?: string;
  sortBy?: SortOption;
}

export interface CollectionStats {
  total: number;
  favorites: number;
  countriesCount: number;
  distinctGrapesCount: number;
  topStyle: string;
  averageRating: number | null;
}

export function filterAndSortEntries(entries: WineEntry[], options: FilterOptions = {}): WineEntry[] {
  const {
    query = '',
    tab = 'all',
    style = 'all',
    country = 'all',
    vintage = 'all',
    rating = 'all',
    tag = '',
    sortBy = 'date-desc',
  } = options;

  const q = query.trim().toLowerCase();

  const filtered = entries.filter((entry) => {
    // Aba
    if (tab === 'favorites' && !entry.favorite) return false;
    if (tab === 'sparkling' && entry.tipo !== 'espumante') return false;

    // Estilo / Tipo
    if (style !== 'all') {
      if (style === 'espumante') {
        if (entry.tipo !== 'espumante') return false;
      } else {
        if (entry.estilo !== style) return false;
      }
    }

    // País
    if (country !== 'all') {
      const code = entry.origin?.countryCode || '';
      if (code !== country) return false;
    }

    // Safra
    if (vintage !== 'all') {
      if ((entry.safra || '').trim() !== vintage) return false;
    }

    // Nota
    if (rating !== 'all') {
      if (entry.conclusao?.avaliacaoEstrelas !== rating) return false;
    }

    // Tag
    if (tag.trim()) {
      const wanted = tag.trim().toLowerCase();
      const tags = (entry.tags || []).map((t) => t.toLowerCase());
      if (!tags.includes(wanted)) return false;
    }

    // Texto de busca
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      const haystack = [
        entry.vinho,
        entry.produtor,
        entry.uvas,
        entry.regiaoPais,
        entry.safra,
        entry.origin?.region,
        entry.conclusao?.impressaoFinal,
        entry.occasion,
        entry.origin?.countryCode ? countryName(entry.origin.countryCode) : '',
        ...(entry.aromaTags || []),
        ...(entry.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!tokens.every((token) => haystack.includes(token))) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return (a.dataDegustacao || '').localeCompare(b.dataDegustacao || '');
      case 'date-desc':
        return (b.dataDegustacao || '').localeCompare(a.dataDegustacao || '');
      case 'rating-desc': {
        const ra = a.conclusao?.avaliacaoEstrelas ?? -1;
        const rb = b.conclusao?.avaliacaoEstrelas ?? -1;
        if (rb !== ra) return rb - ra;
        return (b.dataDegustacao || '').localeCompare(a.dataDegustacao || '');
      }
      case 'name-asc':
        return (a.vinho || a.produtor || '').localeCompare(b.vinho || b.produtor || '');
      case 'vintage-desc':
        return (b.safra || '').localeCompare(a.safra || '');
      default:
        return (b.dataDegustacao || '').localeCompare(a.dataDegustacao || '');
    }
  });
}

export function getCollectionStats(entries: WineEntry[]): CollectionStats {
  const total = entries.length;
  const favorites = entries.filter((e) => e.favorite).length;

  const countries = new Set<string>();
  const grapes = new Set<string>();
  const stylesCount: Record<string, number> = {};
  let ratingSum = 0;
  let ratingCount = 0;

  for (const entry of entries) {
    if (entry.origin?.countryCode) {
      countries.add(entry.origin.countryCode);
    }
    if (entry.uvas) {
      entry.uvas
        .split(/[,;/+]/)
        .map((g) => g.trim())
        .filter(Boolean)
        .forEach((g) => grapes.add(g.toLowerCase()));
    }

    const key = entry.tipo === 'espumante' ? 'Espumante' : entry.estilo ? entry.estilo : 'Outro';
    stylesCount[key] = (stylesCount[key] || 0) + 1;

    if (entry.conclusao?.avaliacaoEstrelas) {
      ratingSum += entry.conclusao.avaliacaoEstrelas;
      ratingCount++;
    }
  }

  let topStyle = 'Nenhum';
  let maxCount = 0;
  for (const [st, count] of Object.entries(stylesCount)) {
    if (count > maxCount) {
      maxCount = count;
      topStyle = st;
    }
  }

  return {
    total,
    favorites,
    countriesCount: countries.size,
    distinctGrapesCount: grapes.size,
    topStyle,
    averageRating: ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : null,
  };
}

export function getAromaFrequencies(entries: WineEntry[]): Array<{ aroma: string; count: number }> {
  const counts: Record<string, number> = {};

  for (const entry of entries) {
    for (const aroma of entry.aromaTags || []) {
      const clean = aroma.trim();
      if (clean) {
        counts[clean] = (counts[clean] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([aroma, count]) => ({ aroma, count }))
    .sort((a, b) => b.count - a.count);
}
