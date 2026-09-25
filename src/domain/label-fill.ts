import type { WineEntry } from './wine-entry';
import { asWineStyle, asWineType, convertAlcohol, parseAgeing, parseDecant, parseTemperature } from './asi-convert';
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

/** Campos que a leitura de rótulo pode preencher. Opinião (qualidade, impressão final) fica de fora. */
export const AI_FILLED_PATHS = [
  'produtor',
  'vinho',
  'safra',
  'uvas',
  'regiaoPais',
  'tipo',
  'estilo',
  'servico.temperature',
  'servico.decant',
  'visual.corHex',
  'olfato.aromas',
  'paladar.abv',
  'conclusao.ageing',
  'conclusao.harmonizacao',
] as const;

/** Valor do campo junto com a nota fora da grade, para comparar antes e depois. */
function readPath(entry: WineEntry, path: string): string {
  const value = path.split('.').reduce<any>((current, key) => current?.[key], entry);
  return JSON.stringify([value ?? '', entry.legacyNotes?.[path] ?? '']);
}

const EMPTY = JSON.stringify(['', '']);

function markChanged(before: WineEntry, after: WineEntry): WineEntry {
  const provenance = { ...after.provenance };
  for (const path of AI_FILLED_PATHS) {
    const value = readPath(after, path);
    if (value !== EMPTY && value !== readPath(before, path)) provenance[path] = 'ai-unverified';
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

/**
 * Preenche só campo vazio. O texto da IA passa pela mesma conversão das fichas antigas:
 * o que não cabe na grade ASI fica como nota do campo.
 */
function fillCoded<T>(
  current: T | null,
  path: string,
  notes: Record<string, string>,
  incoming: string | undefined,
  convert: (text: string) => { value: T; lossless: boolean } | null
): T | null {
  const text = (incoming || '').trim();
  if (current !== null || notes[path] || !text) return current;
  const converted = convert(text);
  if (!converted || !converted.lossless) notes[path] = text;
  return converted ? converted.value : null;
}

export function applyLabelAnalysis(entry: WineEntry, analysis: LabelAnalysis): WineEntry {
  const regiaoPais = keep(entry.regiaoPais, analysis.regiaoPais);
  const aromas = keep(entry.olfato.aromas, analysis.aromasSugeridos);
  const aromaTags =
    entry.aromaTags.length > 0
      ? entry.aromaTags
      : aromas
          .split(/[,;/]/)
          .map((tag) => tag.trim())
          .filter(Boolean);
  const style = asWineStyle(analysis.estilo);
  const notes = { ...entry.legacyNotes };

  const abv = entry.paladar.abv.trim() ? entry.paladar.abv : (convertAlcohol(analysis.alcool || '')?.value.abv ?? '');

  const next: WineEntry = {
    ...entry,
    produtor: keep(entry.produtor, analysis.produtor),
    vinho: keep(entry.vinho, analysis.vinho),
    safra: keep(entry.safra, analysis.safra),
    uvas: keep(entry.uvas, analysis.uvas),
    regiaoPais,
    tipo: asWineType(analysis.tipo) ?? entry.tipo,
    estilo: style?.estilo ?? entry.estilo,
    // O Gemini só responde tinto, branco ou rosé. "branco" não desfaz o laranja que a
    // pessoa marcou; só um estilo que não é branco tira o contato com as cascas.
    skinContact: style?.skinContact || (style && style.estilo !== 'branco' ? false : entry.skinContact),
    origin: {
      region: regiaoPais,
      countryCode: inferCountryCode(regiaoPais) ?? entry.origin?.countryCode ?? null,
    },
    aromaTags,
    visual: { ...entry.visual, corHex: keep(entry.visual.corHex, analysis.corHexSugerida) || undefined },
    olfato: { ...entry.olfato, aromas },
    paladar: { ...entry.paladar, abv },
    conclusao: {
      ...entry.conclusao,
      ageing: fillCoded(entry.conclusao.ageing, 'conclusao.ageing', notes, analysis.potencialGuarda, parseAgeing),
      harmonizacao: keep(entry.conclusao.harmonizacao, analysis.harmonizacaoSugerida),
    },
    servico: {
      ...entry.servico,
      temperature: fillCoded(
        entry.servico.temperature,
        'servico.temperature',
        notes,
        analysis.temperaturaServico,
        parseTemperature
      ),
      decant: fillCoded(entry.servico.decant, 'servico.decant', notes, analysis.decantacao, parseDecant),
    },
    legacyNotes: notes,
  };
  return markChanged(entry, next);
}
