import type { WineEntry } from '../wine-entry';
import { inferCountryCode } from '../countries';
import { GRAPES, type Alias, type GrapeId } from './grape-catalog';
import { REGIONS, type Region, type RegionId } from './region-catalog';

/** Minúsculas, sem acento, pontuação vira espaço. Base de toda comparação de texto livre. */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** A leitura de rótulo marca o campo como não revisado até a pessoa editar ou confirmar. */
export function trusted(entry: WineEntry, path: string): boolean {
  return entry.provenance?.[path] !== 'ai-unverified';
}

// "85,5%" tem vírgula, então o percentual sai antes de quebrar a lista.
const PERCENT = /\d+(?:[.,]\d+)?\s*%/g;
const GRAPE_SEPARATORS = /[,;/+&]|\s+e\s+/i;

/** Pedaços de `uvas` já dobrados: "Chardonnay 85%, Pinot Noir 15%" vira ["chardonnay", "pinot noir"]. */
export function splitGrapeText(uvas: string): string[] {
  return (uvas || '')
    .replace(PERCENT, ' ')
    .split(GRAPE_SEPARATORS)
    .map(fold)
    .filter((piece) => /\p{L}/u.test(piece));
}

interface AliasHit {
  id: string;
  when?: (entry: WineEntry) => boolean;
}

interface CatalogItem {
  id: string;
  label: string;
  aliases: readonly Alias[];
}

/** Tabela de sinônimos dobrados de um catálogo: nome, id e sinônimos apontando para o id. */
export function aliasTable(items: readonly CatalogItem[]): Map<string, AliasHit[]> {
  const table = new Map<string, AliasHit[]>();
  const add = (text: string, hit: AliasHit) => {
    const key = fold(text);
    if (!key) return;
    const hits = table.get(key) ?? [];
    if (!hits.some((known) => known.id === hit.id && known.when === hit.when)) hits.push(hit);
    table.set(key, hits);
  };
  for (const item of items) {
    add(item.label, { id: item.id });
    add(item.id.replace(/-/g, ' '), { id: item.id });
    for (const alias of item.aliases) {
      if (typeof alias === 'string') add(alias, { id: item.id });
      else add(alias.text, { id: item.id, when: alias.when });
    }
  }
  return table;
}

type Matcher = (text: string, entry: WineEntry) => string[];

/**
 * Casa sinônimos com limite de palavra, do mais longo para o mais curto, da esquerda para a direita.
 * O trecho casado é consumido: "cabernet sauvignon" não rende também "sauvignon".
 */
function buildMatcher(items: readonly CatalogItem[]): Matcher {
  const table = aliasTable(items);
  const alternatives = [...table.keys()].sort((a, b) => b.length - a.length || a.localeCompare(b));
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives.join('|')})(?![\\p{L}\\p{N}])`, 'gu');
  return (text, entry) => {
    const ids: string[] = [];
    for (const match of fold(text).matchAll(pattern)) {
      for (const hit of table.get(match[0]) ?? []) {
        if (hit.when && !hit.when(entry)) continue;
        if (!ids.includes(hit.id)) ids.push(hit.id);
      }
    }
    return ids;
  };
}

const matchGrapes = buildMatcher(GRAPES);
const matchRegions = buildMatcher(REGIONS);
const REGION_PARENT = new Map<string, string>(
  (REGIONS as readonly Region[]).flatMap((region) => (region.parent ? [[region.id, region.parent] as const] : []))
);

/** Uvas do catálogo presentes na ficha, uma vez cada. */
export function grapesOf(entry: WineEntry): GrapeId[] {
  if (!trusted(entry, 'uvas')) return [];
  const ids: string[] = [];
  for (const piece of splitGrapeText(entry.uvas)) {
    for (const id of matchGrapes(piece, entry)) if (!ids.includes(id)) ids.push(id);
  }
  return ids as GrapeId[];
}

/**
 * Chaves para contar uvas distintas: id do catálogo quando casa (Shiraz e Syrah contam uma vez),
 * senão o próprio texto dobrado.
 */
export function grapeKeysOf(entry: WineEntry): string[] {
  if (!trusted(entry, 'uvas')) return [];
  const keys: string[] = [];
  for (const piece of splitGrapeText(entry.uvas)) {
    const ids = matchGrapes(piece, entry);
    for (const key of ids.length ? ids : [piece]) if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}

/** Regiões do catálogo, de `origin.region` e `regiaoPais`. O nome do vinho não entra. */
export function regionsOf(entry: WineEntry): RegionId[] {
  // A leitura de rótulo grava a mesma região nos dois campos; sem revisão, nenhum conta.
  if (!trusted(entry, 'regiaoPais')) return [];
  const ids: string[] = [];
  const add = (id: string) => {
    if (!ids.includes(id)) ids.push(id);
  };
  for (const text of [entry.origin?.region ?? '', entry.regiaoPais ?? '']) {
    for (const id of matchRegions(text, entry)) {
      add(id);
      let parent = REGION_PARENT.get(id);
      while (parent) {
        add(parent);
        parent = REGION_PARENT.get(parent);
      }
    }
  }
  return ids as RegionId[];
}

/**
 * País da ficha para os marcos. `origin.countryCode` não tem chave de provenance: a leitura de rótulo
 * deriva o país de `regiaoPais`. Se esse texto não foi revisado e o país é o que ele daria, não conta.
 */
export function countryOf(entry: WineEntry): string | null {
  const code = entry.origin?.countryCode;
  if (!code || code === 'other') return null;
  if (!trusted(entry, 'regiaoPais') && inferCountryCode(entry.regiaoPais ?? '') === code) return null;
  return code;
}
