import type { WineEntry, WineStyle, WineType } from './wine-entry';
import { inferCountryCode } from './countries.js';

export interface LabelAnalysis {
  produtor?: string;
  vinho?: string;
  safra?: string;
  uvas?: string;
  regiaoPais?: string;
  tipo?: string;
  estilo?: string;
  alcool?: string;
  temperaturaServico?: string;
  decantacao?: string;
  potencialGuarda?: string;
  aromasSugeridos?: string;
  harmonizacaoSugerida?: string;
  qualidadeEstimada?: string;
  corHexSugerida?: string;
  resumo?: string;
}

function keep(current: string | undefined, incoming: string | undefined): string {
  if ((current || '').trim()) return current || '';
  return (incoming || '').trim();
}

function asType(value: string | undefined): WineType | null {
  if (value === 'licoroso') return 'fortificado';
  if (value === 'tranquilo' || value === 'espumante' || value === 'sobremesa' || value === 'fortificado') {
    return value;
  }
  return null;
}

function asStyle(value: string | undefined): WineStyle | null {
  if (value === 'branco' || value === 'tinto' || value === 'rose') return value;
  return null;
}

/** Campos que a leitura de rótulo pode preencher. Opinião (qualidade, impressão final) fica de fora. */
export const AI_FILLED_PATHS = [
  'produtor',
  'vinho',
  'safra',
  'uvas',
  'regiaoPais',
  'tipo',
  'estilo',
  'temperaturaServico',
  'decantacao',
  'visual.corHex',
  'olfato.aromas',
  'paladar.alcool',
  'conclusao.guarda',
  'conclusao.harmonizacao',
] as const;

/** Lê o campo tratando `undefined` e `null` como texto vazio. */
function readPath(entry: WineEntry, path: string): unknown {
  const value = path.split('.').reduce<any>((current, key) => current?.[key], entry);
  return value ?? '';
}

function markChanged(before: WineEntry, after: WineEntry): WineEntry {
  const provenance = { ...after.provenance };
  for (const path of AI_FILLED_PATHS) {
    const value = readPath(after, path);
    if (value !== '' && value !== readPath(before, path)) provenance[path] = 'ai-unverified';
  }
  return { ...after, provenance };
}

/** O que a pessoa mudou depois da leitura deixa de ser sugestão da IA. */
export function settleAiProvenance(entry: WineEntry, aiSnapshot: WineEntry): WineEntry {
  const provenance = { ...entry.provenance };
  for (const path of AI_FILLED_PATHS) {
    if (provenance[path] === 'ai-unverified' && readPath(entry, path) !== readPath(aiSnapshot, path)) {
      provenance[path] = 'user';
    }
  }
  return { ...entry, provenance };
}

export function aiSuggestedFields(entry: WineEntry): string[] {
  return AI_FILLED_PATHS.filter((path) => entry.provenance?.[path] === 'ai-unverified');
}

export function applyLabelAnalysis(entry: WineEntry, analysis: LabelAnalysis): WineEntry {
  const regiaoPais = keep(entry.regiaoPais, analysis.regiaoPais);
  const aromas = keep(entry.olfato.aromas, analysis.aromasSugeridos);
  const aromaTags =
    entry.aromaTags.length > 0
      ? entry.aromaTags
      : aromas
          .split(/[,;]/)
          .map((tag) => tag.trim())
          .filter(Boolean);
  const tipo = asType(analysis.tipo) ?? entry.tipo;
  const estilo = asStyle(analysis.estilo) ?? entry.estilo;
  const next: WineEntry = {
    ...entry,
    produtor: keep(entry.produtor, analysis.produtor),
    vinho: keep(entry.vinho, analysis.vinho),
    safra: keep(entry.safra, analysis.safra),
    uvas: keep(entry.uvas, analysis.uvas),
    regiaoPais,
    tipo,
    estilo: tipo === 'espumante' ? null : estilo,
    temperaturaServico: keep(entry.temperaturaServico, analysis.temperaturaServico),
    decantacao: keep(entry.decantacao, analysis.decantacao),
    origin: {
      region: regiaoPais,
      countryCode: inferCountryCode(regiaoPais) ?? entry.origin?.countryCode ?? null,
    },
    aromaTags,
    visual: { ...entry.visual, corHex: keep(entry.visual.corHex, analysis.corHexSugerida) || undefined },
    olfato: { ...entry.olfato, aromas },
    paladar: { ...entry.paladar, alcool: keep(entry.paladar.alcool, analysis.alcool) },
    conclusao: {
      ...entry.conclusao,
      guarda: keep(entry.conclusao.guarda, analysis.potencialGuarda),
      harmonizacao: keep(entry.conclusao.harmonizacao, analysis.harmonizacaoSugerida),
    },
  };
  return markChanged(entry, next);
}
