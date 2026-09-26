import type { WineEntry } from '../wine-entry';
import type { GrapeId } from './grape-catalog';
import type { RegionId } from './region-catalog';

export type Family =
  | 'uva'
  | 'regiao'
  | 'pais'
  | 'estilo'
  | 'critica'
  | 'tecnica'
  | 'volume'
  | 'harmonizacao'
  | 'secreto'
  | 'legado';
export type Tier = 1 | 2 | 3; // bronze, prata, ouro -> moldura
export type Tone = 'wine' | 'sage' | 'terracotta' | 'kraft';

/** Pré-calculado uma vez por avaliação. */
export interface Ctx {
  /** Fichas que contam, em ordem cronológica. */
  entries: readonly WineEntry[];
  byId: ReadonlyMap<string, WineEntry>;
  grapes: ReadonlyMap<string, readonly GrapeId[]>;
  regions: ReadonlyMap<string, readonly RegionId[]>;
  countries: ReadonlyMap<string, string | null>;
}

export type Rule =
  | { kind: 'count'; where: (e: WineEntry, ctx: Ctx) => boolean; min: number }
  | { kind: 'distinct'; of: (e: WineEntry, ctx: Ctx) => readonly string[]; min: number }
  | { kind: 'coverAll'; of: (e: WineEntry, ctx: Ctx) => readonly string[]; required: readonly string[] }
  | { kind: 'custom'; target: number; progress: (ctx: Ctx) => { current: number; unlockedBy?: string } };

export interface StampDef {
  /** Estável: 'uva.chardonnay.2', 'volume.100'. */
  id: string;
  family: Family;
  tier: Tier;
  /** "Explorador dos Chardonnays". */
  title: string;
  /** Texto curto do arco: "10 FICHAS DE CHARDONNAY". */
  motto: string;
  /** Frase da lista. */
  description: string;
  /** Nome em `stamp-art/glyphs.ts`. */
  glyph: string;
  tone: Tone;
  /** Uva ou região dos marcos paramétricos. */
  subject?: string;
  /** Valor facial quando não é o alvo da regra. */
  face?: string;
  /** Secreto: aparece como "?" até ser ganho. */
  hidden?: boolean;
  rule: Rule;
}

export interface StampState {
  def: StampDef;
  earned: boolean;
  current: number;
  target: number;
  /** `dataDegustacao` da ficha que cruzou o limite. */
  earnedAt: string | null;
  earnedByEntryId: string | null;
}

export interface RuleResult {
  current: number;
  target: number;
  /** Ficha que cruzou o limite, ou null se o alvo não foi alcançado. */
  crossing: WineEntry | null;
}

/** Passadas compartilhadas entre os níveis de um mesmo assunto (mesma função `where` ou `of`). */
export interface RuleMemo {
  filtered: WeakMap<object, WineEntry[]>;
  timelines: WeakMap<object, WineEntry[]>;
}

export function createRuleMemo(): RuleMemo {
  return { filtered: new WeakMap(), timelines: new WeakMap() };
}

export function ruleTarget(rule: Rule): number {
  switch (rule.kind) {
    case 'count':
    case 'distinct':
      return rule.min;
    case 'coverAll':
      return rule.required.length;
    case 'custom':
      return rule.target;
  }
}

/** Número impresso no selo. */
export function faceValue(def: StampDef): string {
  return def.face ?? String(ruleTarget(def.rule));
}

/** Fichas em que cada valor novo apareceu pela primeira vez, na ordem das fichas. */
function timeline(of: (e: WineEntry, ctx: Ctx) => readonly string[], ctx: Ctx, memo: RuleMemo): WineEntry[] {
  const cached = memo.timelines.get(of);
  if (cached) return cached;
  const seen = new Set<string>();
  const firsts: WineEntry[] = [];
  for (const entry of ctx.entries) {
    for (const value of of(entry, ctx)) {
      if (seen.has(value)) continue;
      seen.add(value);
      firsts.push(entry);
    }
  }
  memo.timelines.set(of, firsts);
  return firsts;
}

export function runRule(rule: Rule, ctx: Ctx, memo: RuleMemo = createRuleMemo()): RuleResult {
  switch (rule.kind) {
    case 'count': {
      let list = memo.filtered.get(rule.where);
      if (!list) {
        list = ctx.entries.filter((entry) => rule.where(entry, ctx));
        memo.filtered.set(rule.where, list);
      }
      return { current: list.length, target: rule.min, crossing: list[rule.min - 1] ?? null };
    }
    case 'distinct': {
      const firsts = timeline(rule.of, ctx, memo);
      return { current: firsts.length, target: rule.min, crossing: firsts[rule.min - 1] ?? null };
    }
    case 'coverAll': {
      const required = new Set(rule.required);
      const seen = new Set<string>();
      for (const entry of ctx.entries) {
        for (const value of rule.of(entry, ctx)) {
          if (required.has(value)) seen.add(value);
        }
        if (seen.size === required.size) return { current: seen.size, target: required.size, crossing: entry };
      }
      return { current: seen.size, target: required.size, crossing: null };
    }
    case 'custom': {
      const { current, unlockedBy } = rule.progress(ctx);
      const crossing = current >= rule.target && unlockedBy ? (ctx.byId.get(unlockedBy) ?? null) : null;
      return { current, target: rule.target, crossing };
    }
  }
}
