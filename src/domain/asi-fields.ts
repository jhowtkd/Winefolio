/**
 * Os campos da ficha na ordem da grade ASI, com nível (Iniciante ou Avançado) e
 * regra de quando se aplicam. O editor, a ficha de leitura e a regra de
 * visibilidade leem esta lista.
 */
import type { SheetLevel, WineEntry, WineStyle, WineType } from './wine-entry';
import {
  ACIDITY,
  AGEING,
  ALCOHOL,
  APPEARANCE_INTENSITY,
  ASI_QUALITY,
  BODY,
  BRIGHTNESS,
  CLARITY,
  CLIMATE,
  CLIMATE_TYPE,
  CONDITION,
  CORE_COLOURS,
  DECANT,
  DISH_STYLE,
  FAULTS,
  findCoreColour,
  FINISH,
  FLAVOUR_INTENSITY,
  GLASS,
  NOSE_FAULTS,
  NOSE_INTENSITY,
  NOSE_MATURITY,
  OAK,
  OBSERVATIONS,
  PAIRING_COMPONENTS,
  PALATE_MATURITY,
  RIM_VARIATION,
  SPARKLE,
  SUBSTYLES,
  SWEETNESS,
  TANNIN_LEVEL,
  TANNIN_QUALITY,
  TEXTURE,
  VINIFICATION,
  vinificationFor,
  VISCOSITY,
  type AsiOption,
} from './asi-vocabulary';

export type SheetSection = 'geral' | 'visual' | 'olfato' | 'paladar' | 'conclusao' | 'servico';

export type FieldKind =
  | 'single'
  | 'multi'
  | 'select'
  | 'toggle'
  | 'text'
  | 'longtext'
  | 'temperature'
  | 'colour'
  | 'aromas'
  | 'stars';

export interface AsiFieldDef {
  path: string;
  section: SheetSection;
  pt: string;
  /** Termo da grade ASI. Campo sem termo não é da grade (ex.: preço). */
  en?: string;
  tier: SheetLevel;
  kind: FieldKind;
  /** Opções, que podem depender da ficha (ex.: vinificação pelo tipo). */
  options?: (entry: WineEntry) => readonly AsiOption[];
  /** Quando o campo faz sentido. Campo preenchido aparece mesmo fora da regra. */
  applies?: (entry: WineEntry) => boolean;
  placeholder?: string;
}

const list = (options: readonly AsiOption[]) => () => options;
const hasTannin = (entry: WineEntry) => entry.estilo !== 'branco' || entry.skinContact;

export const ASI_FIELDS: readonly AsiFieldDef[] = [
  // Geral: tipo e estilo ficam no formulário de identificação.
  {
    path: 'skinContact',
    section: 'geral',
    pt: 'Laranja (contato com cascas)',
    en: 'Skin contact',
    tier: 'avancado',
    kind: 'toggle',
    applies: (e) => e.estilo === 'branco',
  },
  {
    path: 'subestilo',
    section: 'geral',
    pt: 'Subestilo',
    en: 'Fortified style',
    tier: 'avancado',
    kind: 'select',
    options: list(SUBSTYLES),
    applies: (e) => e.tipo === 'fortificado',
  },

  // Visual
  { path: 'visual.coreColour', section: 'visual', pt: 'Cor', en: 'Core Colour', tier: 'iniciante', kind: 'colour' },
  { path: 'visual.intensity', section: 'visual', pt: 'Intensidade', en: 'Intensity', tier: 'avancado', kind: 'single', options: list(APPEARANCE_INTENSITY) },
  { path: 'visual.clarity', section: 'visual', pt: 'Limpidez', en: 'Clarity', tier: 'avancado', kind: 'single', options: list(CLARITY) },
  { path: 'visual.brightness', section: 'visual', pt: 'Brilho', en: 'Brightness', tier: 'avancado', kind: 'single', options: list(BRIGHTNESS) },
  { path: 'visual.rimVariation', section: 'visual', pt: 'Halo', en: 'Rim Variation', tier: 'avancado', kind: 'single', options: list(RIM_VARIATION) },
  { path: 'visual.viscosity', section: 'visual', pt: 'Viscosidade', en: 'Viscosity', tier: 'avancado', kind: 'single', options: list(VISCOSITY) },
  { path: 'visual.observations', section: 'visual', pt: 'Outras observações', en: 'Other observations', tier: 'avancado', kind: 'multi', options: list(OBSERVATIONS) },

  // Nariz
  { path: 'aromaTags', section: 'olfato', pt: 'Aromas', en: 'Aroma Descriptors', tier: 'iniciante', kind: 'aromas' },
  { path: 'olfato.condition', section: 'olfato', pt: 'Limpo ou defeituoso', en: 'Clean or Faulty', tier: 'avancado', kind: 'single', options: list(CONDITION) },
  {
    path: 'olfato.faults',
    section: 'olfato',
    pt: 'Defeitos',
    en: 'Faults',
    tier: 'avancado',
    kind: 'multi',
    options: list(NOSE_FAULTS),
    applies: (e) => e.olfato.condition === 'faulty',
  },
  { path: 'olfato.intensity', section: 'olfato', pt: 'Intensidade', en: 'Intensity', tier: 'avancado', kind: 'single', options: list(NOSE_INTENSITY) },
  { path: 'olfato.oak', section: 'olfato', pt: 'Madeira', en: 'Oak influence', tier: 'avancado', kind: 'single', options: list(OAK) },
  { path: 'olfato.maturity', section: 'olfato', pt: 'Maturidade', en: 'Maturity level', tier: 'avancado', kind: 'single', options: list(NOSE_MATURITY) },
  {
    path: 'olfato.aromas',
    section: 'olfato',
    pt: 'Descrição dos aromas',
    tier: 'avancado',
    kind: 'longtext',
    placeholder: 'Ex.: framboesa fresca, violeta, baunilha e um toque de pedra molhada',
  },

  // Boca
  { path: 'paladar.sweetness', section: 'paladar', pt: 'Doçura', en: 'Dry / Sweet', tier: 'iniciante', kind: 'single', options: list(SWEETNESS) },
  { path: 'paladar.body', section: 'paladar', pt: 'Corpo', en: 'Body', tier: 'iniciante', kind: 'single', options: list(BODY) },
  { path: 'paladar.condition', section: 'paladar', pt: 'Limpo ou defeituoso', en: 'Clean or faulty', tier: 'avancado', kind: 'single', options: list(CONDITION) },
  {
    path: 'paladar.faults',
    section: 'paladar',
    pt: 'Defeitos',
    en: 'Faults',
    tier: 'avancado',
    kind: 'multi',
    options: list(FAULTS),
    applies: (e) => e.paladar.condition === 'faulty',
  },
  {
    path: 'paladar.sparkle',
    section: 'paladar',
    pt: 'Borbulhas na boca',
    en: 'Still / Sparkling',
    tier: 'avancado',
    kind: 'single',
    options: list(SPARKLE),
    applies: (e) => e.tipo === 'espumante',
  },
  { path: 'paladar.texture', section: 'paladar', pt: 'Textura', en: 'Texture', tier: 'avancado', kind: 'multi', options: list(TEXTURE) },
  { path: 'paladar.acidity', section: 'paladar', pt: 'Acidez', en: 'Acidity', tier: 'avancado', kind: 'single', options: list(ACIDITY) },
  { path: 'paladar.flavourIntensity', section: 'paladar', pt: 'Intensidade de sabor', en: 'Intensity', tier: 'avancado', kind: 'single', options: list(FLAVOUR_INTENSITY) },
  { path: 'paladar.oak', section: 'paladar', pt: 'Madeira na boca', en: 'Confirming Oak', tier: 'avancado', kind: 'single', options: list(OAK) },
  { path: 'paladar.maturity', section: 'paladar', pt: 'Maturidade', en: 'Maturity / aging', tier: 'avancado', kind: 'single', options: list(PALATE_MATURITY) },
  {
    path: 'paladar.tanninLevel',
    section: 'paladar',
    pt: 'Taninos',
    en: 'Tannins',
    tier: 'avancado',
    kind: 'single',
    options: list(TANNIN_LEVEL),
    applies: hasTannin,
  },
  {
    path: 'paladar.tanninQuality',
    section: 'paladar',
    pt: 'Qualidade dos taninos',
    en: 'Tannin quality',
    tier: 'avancado',
    kind: 'multi',
    options: list(TANNIN_QUALITY),
    applies: hasTannin,
  },
  { path: 'paladar.alcohol', section: 'paladar', pt: 'Álcool', en: 'Alcohol', tier: 'avancado', kind: 'single', options: list(ALCOHOL) },
  { path: 'paladar.abv', section: 'paladar', pt: 'Teor no rótulo', en: 'ABV', tier: 'avancado', kind: 'text', placeholder: 'Ex.: 13,5%' },
  { path: 'paladar.finish', section: 'paladar', pt: 'Final', en: 'Finish / Length', tier: 'avancado', kind: 'single', options: list(FINISH) },
  {
    path: 'paladar.aromasBoca',
    section: 'paladar',
    pt: 'Sabores e sensações',
    en: 'Flavour descriptors',
    tier: 'avancado',
    kind: 'longtext',
    placeholder: 'Sabores na boca, salinidade, final tostado ou frutado...',
  },
  { path: 'paladar.retrogosto', section: 'paladar', pt: 'Retrogosto', tier: 'avancado', kind: 'text', placeholder: 'Ex.: mineral, cassis' },

  // Conclusões
  { path: 'conclusao.avaliacaoEstrelas', section: 'conclusao', pt: 'Sua nota', tier: 'iniciante', kind: 'stars' },
  { path: 'conclusao.asiQuality', section: 'conclusao', pt: 'Qualidade técnica', en: 'Quality', tier: 'avancado', kind: 'single', options: list(ASI_QUALITY) },
  { path: 'conclusao.ageing', section: 'conclusao', pt: 'Potencial de guarda', en: 'Ageing potential', tier: 'avancado', kind: 'single', options: list(AGEING) },
  {
    path: 'conclusao.vinification',
    section: 'conclusao',
    pt: 'Estilo de vinificação',
    en: 'Vinification style',
    tier: 'avancado',
    kind: 'multi',
    options: (e) => vinificationFor(e.tipo),
  },
  { path: 'conclusao.climate', section: 'conclusao', pt: 'Clima', en: 'Climate', tier: 'avancado', kind: 'single', options: list(CLIMATE) },
  { path: 'conclusao.climateType', section: 'conclusao', pt: 'Tipo de clima', en: 'Climate type', tier: 'avancado', kind: 'single', options: list(CLIMATE_TYPE) },
  { path: 'conclusao.preco', section: 'conclusao', pt: 'Preço', tier: 'avancado', kind: 'text', placeholder: 'Ex.: R$ 150' },
  {
    path: 'conclusao.harmonizacao',
    section: 'conclusao',
    pt: 'Harmonização',
    tier: 'iniciante',
    kind: 'text',
    placeholder: 'Ex.: queijo brie com mel, risoto de cogumelos',
  },
  { path: 'conclusao.impressaoFinal', section: 'conclusao', pt: 'Impressão final', tier: 'iniciante', kind: 'longtext' },

  // Serviço
  { path: 'servico.temperature', section: 'servico', pt: 'Temperatura', en: 'Temperature', tier: 'avancado', kind: 'temperature' },
  { path: 'servico.glass', section: 'servico', pt: 'Taça', en: 'Glass', tier: 'avancado', kind: 'single', options: list(GLASS) },
  { path: 'servico.decant', section: 'servico', pt: 'Decantar ou aerar', en: 'Decant / aerate', tier: 'avancado', kind: 'single', options: list(DECANT) },
  { path: 'servico.dishStyle', section: 'servico', pt: 'Estilo do prato', en: 'Dish style', tier: 'avancado', kind: 'single', options: list(DISH_STYLE) },
  {
    path: 'servico.pairingComponents',
    section: 'servico',
    pt: 'Componentes da harmonização',
    en: 'Pairing components',
    tier: 'avancado',
    kind: 'multi',
    options: list(PAIRING_COMPONENTS),
  },
];

/** Notas guardadas em caminhos que não viraram campo da grade. */
export const LEGACY_ONLY_LABELS: Record<string, { pt: string; section: SheetSection }> = {
  tipo: { pt: 'Tipo', section: 'geral' },
  estilo: { pt: 'Estilo', section: 'geral' },
  'visual.transparencia': { pt: 'Transparência', section: 'visual' },
  'visual.perlage': { pt: 'Perlage', section: 'visual' },
};

export const SHEET_SECTIONS: ReadonlyArray<{ key: SheetSection; pt: string; en: string }> = [
  { key: 'geral', pt: 'Geral', en: 'Identification' },
  { key: 'visual', pt: 'Visual', en: 'Appearance' },
  { key: 'olfato', pt: 'Nariz', en: 'Nose' },
  { key: 'paladar', pt: 'Boca', en: 'Taste' },
  { key: 'conclusao', pt: 'Conclusões', en: 'Conclusions' },
  { key: 'servico', pt: 'Serviço', en: 'Service & Food' },
];

const FIELD_BY_PATH = new Map(ASI_FIELDS.map((field) => [field.path, field]));

export function fieldAt(path: string): AsiFieldDef | undefined {
  return FIELD_BY_PATH.get(path);
}

export function getPath(entry: WineEntry, path: string): unknown {
  return path.split('.').reduce<any>((current, key) => current?.[key], entry);
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === false || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

export function isFilled(entry: WineEntry, path: string): boolean {
  return hasValue(getPath(entry, path)) || Boolean(entry.legacyNotes?.[path]);
}

/**
 * Campos que a grade completa exige: os que têm termo ASI. Ficam de fora o toggle (desligado é
 * resposta, não campo vazio) e as listas sem regra de aplicação (observações, textura, vinificação e
 * componentes podem não ter nada a anotar). Lista com regra, como defeitos, vale quando se aplica.
 */
const GRID_FIELDS = ASI_FIELDS.filter(
  (field) => field.en !== undefined && field.kind !== 'toggle' && !(field.kind === 'multi' && !field.applies)
);

/** Ficha com toda a grade ASI aplicável preenchida. `filled` deixa quem chama recusar campos. */
export function isGridComplete(
  entry: WineEntry,
  filled: (entry: WineEntry, path: string) => boolean = isFilled
): boolean {
  return GRID_FIELDS.every((field) => (field.applies && !field.applies(entry)) || filled(entry, field.path));
}

/**
 * Campo preenchido sempre aparece, mesmo fora do nível ou da regra, para nada
 * sumir da ficha. Vazio aparece se faz sentido e cabe no nível.
 */
export function isFieldVisible(
  entry: WineEntry,
  field: AsiFieldDef,
  advanced: boolean,
  keep?: ReadonlySet<string>
): boolean {
  if (isFilled(entry, field.path) || keep?.has(field.path)) return true;
  if (field.applies && !field.applies(entry)) return false;
  return field.tier === 'iniciante' || advanced;
}

/**
 * `keep`: campos que já tiveram valor nesta edição. Continuam à vista depois de
 * limpos, para a pessoa poder escolher de novo sem abrir a grade completa.
 */
export function visibleFields(
  entry: WineEntry,
  section: SheetSection,
  advanced: boolean,
  keep?: ReadonlySet<string>
): AsiFieldDef[] {
  return ASI_FIELDS.filter((field) => field.section === section && isFieldVisible(entry, field, advanced, keep));
}

/** Notas sem campo correspondente, mostradas no fim da seção. */
export function orphanNotes(entry: WineEntry, section: SheetSection): Array<{ path: string; pt: string; text: string }> {
  return Object.entries(entry.legacyNotes ?? {})
    .filter(([path]) => !FIELD_BY_PATH.has(path))
    .map(([path, text]) => ({ path, text, pt: LEGACY_ONLY_LABELS[path]?.pt ?? path, section: LEGACY_ONLY_LABELS[path]?.section ?? 'geral' }))
    .filter((note) => note.section === section)
    .map(({ path, pt, text }) => ({ path, pt, text }));
}

/** A seção aparece se algum campo dela aparece ou se guarda alguma nota. */
export function isSectionVisible(
  entry: WineEntry,
  section: SheetSection,
  advanced: boolean,
  keep?: ReadonlySet<string>
): boolean {
  if (section === 'geral') return true;
  return visibleFields(entry, section, advanced, keep).length > 0 || orphanNotes(entry, section).length > 0;
}

/**
 * Grava o valor no caminho sem mutar a ficha. Escolher um valor da grade tira a
 * nota antiga daquele campo: a pessoa já decidiu.
 */
export function setPath(entry: WineEntry, path: string, value: unknown): WineEntry {
  const keys = path.split('.');
  const write = (target: any, index: number): any => {
    const key = keys[index];
    if (index === keys.length - 1) return { ...target, [key]: value };
    return { ...target, [key]: write(target?.[key] ?? {}, index + 1) };
  };
  const next = write(entry, 0) as WineEntry;
  if (hasValue(value) && next.legacyNotes?.[path]) {
    const { [path]: _removed, ...legacyNotes } = next.legacyNotes;
    return { ...next, legacyNotes };
  }
  return next;
}

export interface DisplayTerm {
  pt: string;
  en?: string;
}

/** O valor do campo pronto para mostrar. `null` quando vazio. */
export function displayValue(entry: WineEntry, field: AsiFieldDef): DisplayTerm[] | null {
  const value = getPath(entry, field.path);
  if (!hasValue(value)) return null;

  switch (field.kind) {
    case 'single':
    case 'select':
    case 'multi': {
      const all = field.path === 'conclusao.vinification' ? VINIFICATION : field.options?.(entry) ?? [];
      const codes = Array.isArray(value) ? value : [value];
      return codes.map((code) => {
        const option = all.find((o) => o.code === code);
        return option ? { pt: option.pt, en: option.en } : { pt: String(code) };
      });
    }
    case 'colour': {
      const colour = findCoreColour(entry.estilo, String(value));
      return [colour ? { pt: colour.pt, en: colour.en } : { pt: String(value) }];
    }
    case 'toggle':
      return [{ pt: 'Sim', en: 'Yes' }];
    case 'temperature': {
      const { min, max } = value as { min: number; max: number };
      const n = (value: number) => String(value).replace('.', ',');
      return [{ pt: min === max ? `${n(min)} °C` : `${n(min)} a ${n(max)} °C` }];
    }
    case 'stars':
      return [{ pt: `${value} de 5` }];
    case 'aromas':
      return (value as string[]).map((descriptor) => ({ pt: descriptor }));
    default:
      return [{ pt: String(value) }];
  }
}

/**
 * Troca a cor principal. A cor ASI escolhida só fica se existir na escala do novo
 * estilo; "Marrom" existe no branco e no tinto com tons diferentes, então o hex que
 * veio da cor é recalculado. Um hex de outra origem (leitura de rótulo) fica.
 */
export function withStyle(entry: WineEntry, estilo: WineStyle | null): WineEntry {
  const code = entry.visual.coreColour;
  const previous = findCoreColour(entry.estilo, code);
  const next = estilo ? CORE_COLOURS[estilo].find((c) => c.code === code) : previous;
  const derivedHex = Boolean(previous && entry.visual.corHex === previous.hex);

  let visual = entry.visual;
  if (code && !next) {
    visual = { ...visual, coreColour: null, corHex: derivedHex ? undefined : visual.corHex };
  } else if (next && derivedHex) {
    visual = { ...visual, corHex: next.hex };
  }
  return { ...entry, estilo, skinContact: estilo === 'branco' ? entry.skinContact : false, visual };
}

/**
 * Troca o tipo. O subestilo só vale para fortificado, e o estilo de vinificação
 * só guarda os códigos que o novo tipo oferece (o editor não teria como tirá-los).
 */
export function withType(entry: WineEntry, tipo: WineType | null): WineEntry {
  const allowed = new Set(vinificationFor(tipo).map((option) => option.code));
  return {
    ...entry,
    tipo,
    subestilo: tipo === 'fortificado' ? entry.subestilo : null,
    conclusao: { ...entry.conclusao, vinification: entry.conclusao.vinification.filter((code) => allowed.has(code)) },
  };
}

/** A ficha já tem algo anotado, na identificação ou na grade. */
export function hasAnyContent(entry: WineEntry): boolean {
  return (
    Boolean(entry.produtor || entry.vinho || entry.uvas || entry.regiaoPais) ||
    ASI_FIELDS.some((field) => isFilled(entry, field.path))
  );
}
