import type { WineEntry, WineStyle, WineType } from './wine-entry';

export interface CellarBottle {
  key: string;
  vinho: string;
  produtor: string;
  safra: string;
  estilo: WineStyle | null;
  tipo: WineType | null;
  skinContact?: boolean;
  countryCode: string | null;
  region: string;
  corHex?: string;
  tastingCount: number;
  averageRating: number | null;
  favorite: boolean;
  lastTasted: string;
  latestEntryId: string;
}

function normalize(value: string | undefined): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function cellarIdentity(entry: WineEntry): string {
  const producer = normalize(entry.produtor);
  const wine = normalize(entry.vinho);
  const vintage = normalize(entry.safra);
  if (!producer && !wine) return `id:${entry.id}`;
  return `${producer}|${wine}|${vintage}`;
}

function ratingOf(entry: WineEntry): number | null {
  const rating = entry.conclusao?.avaliacaoEstrelas;
  return typeof rating === 'number' ? rating : null;
}

export function groupIntoCellar(entries: WineEntry[]): CellarBottle[] {
  const groups = new Map<string, WineEntry[]>();

  for (const entry of entries) {
    const key = cellarIdentity(entry);
    const bucket = groups.get(key);
    if (bucket) bucket.push(entry);
    else groups.set(key, [entry]);
  }

  const bottles: CellarBottle[] = [];

  for (const [key, tastings] of groups) {
    const ordered = [...tastings].sort((a, b) => {
      const byDate = (b.dataDegustacao || '').localeCompare(a.dataDegustacao || '');
      if (byDate !== 0) return byDate;
      return b.atualizadoEm - a.atualizadoEm;
    });
    const latest = ordered[0];
    const ratings = ordered.map(ratingOf).filter((value): value is number => value !== null);
    const average =
      ratings.length > 0
        ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1))
        : null;

    bottles.push({
      key,
      vinho: latest.vinho,
      produtor: latest.produtor,
      safra: latest.safra,
      estilo: latest.estilo,
      tipo: latest.tipo,
      skinContact: latest.skinContact,
      countryCode: latest.origin?.countryCode ?? null,
      region: latest.origin?.region || latest.regiaoPais,
      corHex: latest.visual?.corHex,
      tastingCount: ordered.length,
      averageRating: average,
      favorite: ordered.some((entry) => entry.favorite),
      lastTasted: latest.dataDegustacao || '',
      latestEntryId: latest.id,
    });
  }

  return bottles.sort((a, b) => {
    const byDate = b.lastTasted.localeCompare(a.lastTasted);
    if (byDate !== 0) return byDate;
    return (a.vinho || a.produtor).localeCompare(b.vinho || b.produtor);
  });
}
