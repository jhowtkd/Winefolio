import type { WineEntry } from './wine-entry';

export interface NamedCount {
  name: string;
  count: number;
}

export interface RatingBucket {
  stars: 1 | 2 | 3 | 4 | 5;
  count: number;
}

export interface MonthBucket {
  key: string;
  label: string;
  count: number;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function styleLabel(entry: Pick<WineEntry, 'tipo' | 'estilo'>): string {
  if (entry.tipo === 'espumante') return 'Espumante';
  if (entry.tipo === 'sobremesa') return 'Sobremesa';
  if (entry.tipo === 'fortificado') return 'Fortificado';
  if (entry.tipo === 'mistela') return 'Mistela';
  if (entry.tipo === 'aromatizado') return 'Aromatizado';
  if (entry.estilo === 'tinto') return 'Tinto';
  if (entry.estilo === 'branco') return 'Branco';
  if (entry.estilo === 'rose') return 'Rosé';
  return 'Sem estilo';
}

export function ratingDistribution(entries: WineEntry[]): RatingBucket[] {
  return ([1, 2, 3, 4, 5] as const).map((stars) => ({
    stars,
    count: entries.filter((entry) => entry.conclusao?.avaliacaoEstrelas === stars).length,
  }));
}

export function styleBreakdown(entries: WineEntry[]): NamedCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const name = styleLabel(entry);
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function grapeBreakdown(entries: WineEntry[], limit = 8): NamedCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const seen = new Set<string>();
    for (const raw of (entry.uvas || '').split(/[,;/+]/)) {
      const grape = raw.trim();
      if (!grape) continue;
      const key = grape.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const label = grape.replace(/\s+/g, ' ');
      counts.set(label, (counts.get(label) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function countryBreakdown(entries: WineEntry[]): NamedCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const name = entry.origin?.countryCode?.trim() || 'Sem país';
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function tastingsByMonth(entries: WineEntry[], monthCount = 6, now = new Date()): MonthBucket[] {
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  const buckets: MonthBucket[] = [];
  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ key, label: MONTHS[date.getMonth()], count: 0 });
  }
  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));
  for (const entry of entries) {
    const key = (entry.dataDegustacao || '').slice(0, 7);
    const index = indexByKey.get(key);
    if (index !== undefined) buckets[index].count += 1;
  }
  return buckets;
}
