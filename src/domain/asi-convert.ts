/**
 * Converte texto livre (fichas anteriores à grade ASI, backups antigos, leitura de
 * rótulo) em códigos da grade.
 *
 * Regra: só converte o que tem equivalente claro. O texto que não converte, ou que
 * converte perdendo detalhe, vai para `legacyNotes` no caminho do campo novo. Nada
 * é apagado e nada é inventado.
 */
import type {
  Level3,
  ServicoAnalysis,
  TemperatureRange,
  VisualAnalysis,
  WineEntry,
} from './wine-entry';
import {
  CORE_COLOURS,
  WINE_TYPES,
  type Ageing,
  type CoreColour,
  type WineStyle,
  type WineType,
} from './asi-vocabulary';
import { createEntry } from './wine-factory';

/** Resultado de uma conversão. `lossless: false` guarda também o texto original. */
interface Converted<T> {
  value: T;
  lossless: boolean;
}

const ok = <T>(value: T): Converted<T> => ({ value, lossless: true });
const partial = <T>(value: T): Converted<T> => ({ value, lossless: false });

/** Minúsculas, sem acento e sem espaço sobrando. */
export function normalizeTerm(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Traço, travessão e hífen sozinhos eram usados como "não se aplica". */
function isBlank(text: string | undefined | null): boolean {
  return !text || /^[\s\-–—]*$/.test(text);
}

function lookup<T>(table: Record<string, T>, text: string): Converted<T> | null {
  const value = table[normalizeTerm(text)];
  return value === undefined ? null : ok(value);
}

// Tabelas das opções antigas de `sommelierData.ts`

const APPEARANCE_INTENSITY: Record<string, Level3> = {
  baixa: 'low',
  media: 'medium',
  alta: 'high',
  profunda: 'high',
};

const NOSE_INTENSITY: Record<string, Level3> = {
  baixa: 'low',
  media: 'medium',
  alta: 'high',
  pronunciada: 'high',
};

const ACIDITY: Record<string, Level3> = {
  baixa: 'low',
  media: 'medium',
  alta: 'high',
  'muito alta': 'high',
};

const BODY: Record<string, 'light' | 'medium' | 'full'> = {
  leve: 'light',
  medio: 'medium',
  encorpado: 'full',
};

const SWEETNESS: Record<string, 'dry' | 'medium-dry' | 'sweet'> = {
  seco: 'dry',
  'meio-seco': 'medium-dry',
  'meio seco': 'medium-dry',
  doce: 'sweet',
};

const CONDITION: Record<string, 'clean' | 'faulty'> = {
  'limpo / correto': 'clean',
  limpo: 'clean',
  correto: 'clean',
  defeituoso: 'faulty',
};

const NOSE_MATURITY: Record<string, 'youthful' | 'maturing' | 'mature' | 'past-peak'> = {
  primario: 'youthful',
  'em evolucao': 'maturing',
  'maduro / terciario': 'mature',
  maduro: 'mature',
  terciario: 'mature',
  'em declinio': 'past-peak',
};

const COLOURS: Record<string, CoreColour> = {
  'amarelo-esverdeado': 'lemon-green',
  'amarelo esverdeado': 'lemon-green',
  palha: 'straw',
  'amarelo palha': 'straw',
  'amarelo-palha': 'straw',
  'amarelo dourado': 'golden',
  'amarelo-dourado': 'golden',
  dourado: 'golden',
  ambar: 'amber',
  'casca de cebola': 'onionskin',
  'rosa salmao': 'salmon',
  salmao: 'salmon',
  'purpura / violaceo': 'purple',
  purpura: 'purple',
  violaceo: 'purple',
  rubi: 'ruby',
  granada: 'garnet',
  'alaranjado / tijolo': 'tawny',
  atijolado: 'tawny',
  tijolo: 'tawny',
};

// Conversões por campo

export function convertAppearanceIntensity(text: string) {
  return lookup(APPEARANCE_INTENSITY, text);
}

export function convertNoseIntensity(text: string) {
  return lookup(NOSE_INTENSITY, text);
}

export function convertAcidity(text: string) {
  return lookup(ACIDITY, text);
}

export function convertBody(text: string) {
  return lookup(BODY, text);
}

/** "Suave" fica de fora: no Brasil é faixa legal de açúcar, não termo sensorial da ASI. */
export function convertSweetness(text: string) {
  return lookup(SWEETNESS, text);
}

export function convertCondition(text: string) {
  return lookup(CONDITION, text);
}

export function convertNoseMaturity(text: string) {
  return lookup(NOSE_MATURITY, text);
}

export function convertClarity(text: string): Converted<Pick<VisualAnalysis, 'clarity' | 'brightness'>> | null {
  const term = normalizeTerm(text);
  if (term === 'limpido') return ok({ clarity: 'clear', brightness: null });
  if (term === 'brilhante') return ok({ clarity: 'clear', brightness: 'bright' });
  if (term === 'turvo') return ok({ clarity: 'cloudy', brightness: null });
  return null;
}

/** A cor precisa existir na escala do estilo. Sem estilo, qualquer escala serve. */
export function convertColour(text: string, style: WineStyle | null): Converted<CoreColour> | null {
  const found = lookup(COLOURS, text);
  if (!found) return null;
  if (style && !CORE_COLOURS[style].some((c) => c.code === found.value)) return null;
  return found;
}

/** "Alto e sedoso" vira nível alto e tanino sedoso. Qualquer pedaço desconhecido desfaz tudo. */
export function convertTannin(
  text: string
): Converted<{ level: Level3 | null; quality: Array<'silky'> }> | null {
  const term = normalizeTerm(text);
  if (term === 'nulo / nao tem' || term === 'nulo' || term === 'nao tem') {
    return ok({ level: null, quality: [] });
  }
  const levels: Record<string, Level3> = { baixo: 'low', medio: 'medium', alto: 'high' };
  let level: Level3 | null = null;
  const quality: Array<'silky'> = [];
  for (const part of term.split(/\s+e\s+|,/).map((p) => p.trim()).filter(Boolean)) {
    if (levels[part] && level === null) level = levels[part];
    else if (part === 'sedoso' || part === 'sedosos') quality.push('silky');
    else return null;
  }
  return level === null && quality.length === 0 ? null : ok({ level, quality });
}

/** "Curta (1-3s)" vira curto. */
export function convertFinish(text: string): Converted<'short' | 'medium' | 'long'> | null {
  const match = normalizeTerm(text).match(/^(curta|media|longa)(\s*\([^)]*\))?$/);
  if (!match) return null;
  return ok(({ curta: 'short', media: 'medium', longa: 'long' } as const)[match[1] as 'curta' | 'media' | 'longa']);
}

/** Tira o teor do rótulo ("13,5%") e converte a palavra que sobrar. */
export function convertAlcohol(
  text: string
): Converted<{ level: 'low' | 'medium' | 'high' | null; abv: string }> | null {
  const percent = text.match(/(\d{1,2}(?:[.,]\d{1,2})?)\s*%/);
  const abv = percent ? `${percent[1].replace('.', ',')}%` : '';
  const rest = normalizeTerm(text.replace(/\(?\s*\d{1,2}(?:[.,]\d{1,2})?\s*%\s*\)?/, ''));
  if (!rest) return abv ? ok({ level: null, abv }) : null;
  const levels: Record<string, 'low' | 'medium' | 'high'> = {
    baixo: 'low',
    equilibrado: 'medium',
    medio: 'medium',
    alto: 'high',
    quente: 'high',
  };
  const level = levels[rest];
  if (level) return ok({ level, abv });
  return abv ? partial({ level: null, abv }) : null;
}

/** "16°C - 18°C" vira {16, 18}. Um número só vira faixa de um grau. */
export function parseTemperature(text: string): Converted<TemperatureRange> | null {
  const numbers = [...text.matchAll(/(\d{1,2})(?:[.,]\d)?/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n <= 30);
  if (numbers.length === 0) return null;
  const min = Math.min(...numbers.slice(0, 2));
  const max = Math.max(...numbers.slice(0, 2));
  return numbers.length > 2 ? partial({ min, max }) : ok({ min, max });
}

/**
 * "Não necessita" vira não decantar. Tempo de decanter ("1 hora", "45 min") vira aerar,
 * guardando o texto, porque o tempo se perde.
 */
export function parseDecant(text: string): Converted<ServicoAnalysis['decant']> | null {
  const term = normalizeTerm(text);
  if (/^(nao|dispensa|sem decant)/.test(term)) return ok('no');
  if (/sediment|borra|deposito/.test(term)) return partial('sediment');
  if (/aera/.test(term)) return partial('aerate');
  if (/\d+\s*(min|h\b|hora)/.test(term)) return partial('aerate');
  return null;
}

const AGEING_BANDS: Ageing[] = ['0-3', '3-6', '6-9', '9-12', '12-15'];

function bandFor(years: number): Ageing {
  if (years <= 0) return 'now';
  return AGEING_BANDS[Math.ceil(years / 3) - 1] ?? '15+';
}

/**
 * Potencial de guarda em faixas de 3 anos. "Pronto" vira consumo imediato. Uma faixa
 * que atravessa duas bandas ("5-10 anos") fica com a do limite maior e guarda o texto.
 */
export function parseAgeing(text: string): Converted<Ageing> | null {
  const term = normalizeTerm(text);
  if (/^(pronto|beber ja|beber agora|consumo imediato|imediato)$/.test(term)) return ok('now');
  const numbers = [...term.matchAll(/\d{1,2}/g)].map((m) => Number(m[0]));
  if (numbers.length === 0 || !/ano/.test(term)) return null;
  const top = bandFor(Math.max(...numbers));
  const bottom = bandFor(Math.max(Math.min(...numbers), 1));
  // "10+ anos" não tem teto: a faixa perde o sentido, então o texto fica guardado.
  const openEnded = /\+|mais de|acima de/.test(term) && top !== '15+';
  return top === bottom && numbers.length <= 2 && !openEnded ? ok(top) : partial(top);
}

export function asWineType(text: string | null | undefined): WineType | null {
  if (!text) return null;
  const term = normalizeTerm(text);
  if (term === 'licoroso') return 'fortificado';
  if (term === 'doce' || term === 'sobremesa') return 'sobremesa';
  return WINE_TYPES.find((t) => t.code === term)?.code ?? null;
}

/** "laranja" é branco com contato com as cascas. */
export function asWineStyle(text: string | null | undefined): { estilo: WineStyle; skinContact: boolean } | null {
  if (!text) return null;
  const term = normalizeTerm(text);
  if (term === 'laranja' || term === 'orange') return { estilo: 'branco', skinContact: true };
  if (term === 'branco' || term === 'tinto') return { estilo: term, skinContact: false };
  if (term === 'rose') return { estilo: 'rose', skinContact: false };
  return null;
}

// Conversão da ficha inteira

/** Caminho antigo → caminho novo, para `provenance` e para saber onde mostrar a nota. */
const RENAMED_PATHS: Record<string, string> = {
  'visual.limpidez': 'visual.clarity',
  'visual.intensidade': 'visual.intensity',
  'visual.corNucleoBorda': 'visual.coreColour',
  'olfato.condicao': 'olfato.condition',
  'olfato.intensidade': 'olfato.intensity',
  'olfato.desenvolvimento': 'olfato.maturity',
  'paladar.docura': 'paladar.sweetness',
  'paladar.acidez': 'paladar.acidity',
  'paladar.tanino': 'paladar.tanninLevel',
  'paladar.corpo': 'paladar.body',
  'paladar.alcool': 'paladar.abv',
  'paladar.persistencia': 'paladar.finish',
  'conclusao.qualidade': 'conclusao.asiQuality',
  'conclusao.guarda': 'conclusao.ageing',
  temperaturaServico: 'servico.temperature',
  decantacao: 'servico.decant',
};

const text = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

/**
 * Converte uma ficha no formato 2 (texto livre) para o formato 3 (grade ASI).
 * Devolve um objeto no formato 3 ainda não validado. Os campos que não são da
 * grade (identidade, fotos, datas, evidência) passam como estão.
 */
export function upgradeToV3(raw: Record<string, any>): Record<string, any> {
  const id = typeof raw.id === 'string' && raw.id ? raw.id : 'sem-id';
  const base = createEntry(id, new Date(typeof raw.criadoEm === 'number' ? raw.criadoEm : Date.now()));
  const notes: Record<string, string> = { ...(raw.legacyNotes ?? {}) };
  const note = (path: string, original: string) => {
    if (!isBlank(original) && !notes[path]) notes[path] = original.trim();
  };

  /** Aplica a conversão; guarda o texto quando não converte ou converte com perda. */
  function take<T>(path: string, original: unknown, convert: (t: string) => Converted<T> | null): T | undefined {
    const value = text(original);
    if (isBlank(value)) return undefined;
    const converted = convert(value);
    if (!converted) {
      note(path, value);
      return undefined;
    }
    if (!converted.lossless) note(path, value);
    return converted.value;
  }

  const style = asWineStyle(raw.estilo);
  const estilo: WineStyle | null = style?.estilo ?? null;
  if (raw.estilo && !style) note('estilo', text(raw.estilo));
  const tipo = asWineType(raw.tipo);
  if (raw.tipo && !tipo) note('tipo', text(raw.tipo));

  const v = raw.visual ?? {};
  const o = raw.olfato ?? {};
  const p = raw.paladar ?? {};
  const c = raw.conclusao ?? {};

  const visual = { ...base.visual };
  const clarity = take('visual.clarity', v.limpidez, convertClarity);
  if (clarity) Object.assign(visual, clarity);
  visual.intensity = take('visual.intensity', v.intensidade, convertAppearanceIntensity) ?? null;
  visual.coreColour = take('visual.coreColour', v.corNucleoBorda, (t) => convertColour(t, estilo)) ?? null;
  if (typeof v.corHex === 'string' && v.corHex) visual.corHex = v.corHex;
  note('visual.transparencia', text(v.transparencia));
  note('visual.perlage', text(v.perlage));

  const olfato = { ...base.olfato, aromas: text(o.aromas) };
  olfato.condition = take('olfato.condition', o.condicao, convertCondition) ?? null;
  olfato.intensity = take('olfato.intensity', o.intensidade, convertNoseIntensity) ?? null;
  olfato.maturity = take('olfato.maturity', o.desenvolvimento, convertNoseMaturity) ?? null;

  const paladar = {
    ...base.paladar,
    aromasBoca: text(p.aromasBoca),
    retrogosto: text(p.retrogosto),
  };
  paladar.sweetness = take('paladar.sweetness', p.docura, convertSweetness) ?? null;
  paladar.acidity = take('paladar.acidity', p.acidez, convertAcidity) ?? null;
  paladar.body = take('paladar.body', p.corpo, convertBody) ?? null;
  paladar.finish = take('paladar.finish', p.persistencia, convertFinish) ?? null;
  const tannin = take('paladar.tanninLevel', p.tanino, convertTannin);
  if (tannin) {
    paladar.tanninLevel = tannin.level;
    paladar.tanninQuality = tannin.quality;
  }
  const alcohol = take('paladar.alcohol', p.alcool, convertAlcohol);
  if (alcohol) {
    paladar.alcohol = alcohol.level;
    paladar.abv = alcohol.abv;
  }

  const conclusao = {
    ...base.conclusao,
    avaliacaoEstrelas: c.avaliacaoEstrelas ?? null,
    impressaoFinal: text(c.impressaoFinal),
    harmonizacao: text(c.harmonizacao),
    preco: text(c.preco),
  };
  // A escala antiga de qualidade tinha 5 níveis e não corresponde à da ASI.
  note('conclusao.asiQuality', text(c.qualidade));
  conclusao.ageing = take('conclusao.ageing', c.guarda, parseAgeing) ?? null;

  const servico = { ...base.servico };
  servico.temperature = take('servico.temperature', raw.temperaturaServico, parseTemperature) ?? null;
  servico.decant = take('servico.decant', raw.decantacao, parseDecant) ?? null;

  const provenance: Record<string, string> = {};
  for (const [path, source] of Object.entries(raw.provenance ?? {})) {
    provenance[RENAMED_PATHS[path] ?? path] = source as string;
  }

  const {
    temperaturaServico: _temperatura,
    decantacao: _decantacao,
    ...rest
  } = raw;

  return {
    ...rest,
    schemaVersion: 3,
    tipo,
    estilo,
    skinContact: style?.skinContact ?? false,
    subestilo: null,
    visual,
    olfato,
    paladar,
    conclusao,
    servico,
    provenance,
    legacyNotes: notes,
  };
}

/** Uma ficha gravada no formato 2, anterior à grade ASI. */
export function needsUpgrade(raw: unknown): boolean {
  return Boolean(raw && typeof raw === 'object' && (raw as { schemaVersion?: unknown }).schemaVersion === 2);
}

/** Tira a nota de um campo quando a pessoa escolhe um valor ASI para ele. */
export function clearLegacyNote(entry: WineEntry, path: string): WineEntry {
  if (!entry.legacyNotes?.[path]) return entry;
  const { [path]: _removed, ...legacyNotes } = entry.legacyNotes;
  return { ...entry, legacyNotes };
}

