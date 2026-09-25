import type {
  Ageing,
  ALCOHOL,
  ASI_QUALITY,
  BODY,
  BRIGHTNESS,
  CLARITY,
  CLIMATE,
  CLIMATE_TYPE,
  CodeOf,
  CONDITION,
  CoreColour,
  DECANT,
  DISH_STYLE,
  Fault,
  FINISH,
  GLASS,
  NOSE_MATURITY,
  OAK,
  OBSERVATIONS,
  PAIRING_COMPONENTS,
  PALATE_MATURITY,
  RIM_VARIATION,
  SPARKLE,
  Substyle,
  SWEETNESS,
  TANNIN_QUALITY,
  TEXTURE,
  Vinification,
  WineStyle,
  WineType,
} from './asi-vocabulary';

export type Rating = 1 | 2 | 3 | 4 | 5 | null;
export type RecordKind = 'personal' | 'legacy' | 'demo';
export type DataSource = 'user' | 'imported-user' | 'legacy-unknown' | 'ai-unverified' | 'demo';

export interface Evidence {
  noteAuthoredAt: number | null;
  aromasAuthoredAt: number | null;
  originConfirmedAt: number | null;
  revisitedAt: number | null;
}

export type { WineType, WineStyle } from './asi-vocabulary';

export type Level3 = 'low' | 'medium' | 'high';

/** Exame visual (Appearance). */
export interface VisualAnalysis {
  coreColour: CoreColour | null;
  /** Cor da taça ilustrada. Vem da cor escolhida ou da leitura de rótulo. */
  corHex?: string;
  intensity: Level3 | null;
  clarity: CodeOf<typeof CLARITY> | null;
  brightness: CodeOf<typeof BRIGHTNESS> | null;
  rimVariation: CodeOf<typeof RIM_VARIATION> | null;
  viscosity: Level3 | null;
  observations: CodeOf<typeof OBSERVATIONS>[];
}

/** Exame olfativo (Nose). */
export interface OlfatoAnalysis {
  condition: CodeOf<typeof CONDITION> | null;
  faults: Fault[];
  intensity: Level3 | null;
  oak: CodeOf<typeof OAK> | null;
  maturity: CodeOf<typeof NOSE_MATURITY> | null;
  /** Descrição livre dos aromas. Os descritores ficam em `aromaTags`. */
  aromas: string;
}

/** Exame gustativo (Taste). */
export interface PaladarAnalysis {
  condition: CodeOf<typeof CONDITION> | null;
  faults: Fault[];
  sweetness: CodeOf<typeof SWEETNESS> | null;
  sparkle: CodeOf<typeof SPARKLE> | null;
  body: CodeOf<typeof BODY> | null;
  texture: CodeOf<typeof TEXTURE>[];
  acidity: Level3 | null;
  flavourIntensity: Level3 | null;
  oak: CodeOf<typeof OAK> | null;
  maturity: CodeOf<typeof PALATE_MATURITY> | null;
  tanninLevel: Level3 | null;
  tanninQuality: CodeOf<typeof TANNIN_QUALITY>[];
  alcohol: CodeOf<typeof ALCOHOL> | null;
  /** Teor alcoólico do rótulo, ex.: "13,5%". */
  abv: string;
  finish: CodeOf<typeof FINISH> | null;
  aromasBoca: string;
  retrogosto: string;
}

/** Conclusões. As estrelas são o gosto pessoal; `asiQuality` é o julgamento técnico. */
export interface ConclusaoAnalysis {
  avaliacaoEstrelas: Rating;
  impressaoFinal: string;
  harmonizacao: string;
  preco: string;
  asiQuality: CodeOf<typeof ASI_QUALITY> | null;
  ageing: Ageing | null;
  vinification: Vinification[];
  climate: CodeOf<typeof CLIMATE> | null;
  climateType: CodeOf<typeof CLIMATE_TYPE> | null;
}

export interface TemperatureRange {
  min: number;
  max: number;
}

/** Serviço e harmonização (Service & Food). */
export interface ServicoAnalysis {
  temperature: TemperatureRange | null;
  glass: CodeOf<typeof GLASS> | null;
  decant: CodeOf<typeof DECANT> | null;
  dishStyle: CodeOf<typeof DISH_STYLE> | null;
  pairingComponents: CodeOf<typeof PAIRING_COMPONENTS>[];
}

export interface WineEntry {
  id: string;
  schemaVersion: 3;
  revision: number;
  produtor: string;
  vinho: string;
  safra: string;
  uvas: string;
  regiaoPais: string;
  tipo: WineType | null;
  /** Cor principal (Main Colour). Vale também para espumante. */
  estilo: WineStyle | null;
  /** Branco com maceração nas cascas (vinho laranja). */
  skinContact: boolean;
  /** Subestilo de fortificado (Porto Tawny, Jerez Fino...). */
  subestilo: Substyle | null;
  visual: VisualAnalysis;
  olfato: OlfatoAnalysis;
  paladar: PaladarAnalysis;
  conclusao: ConclusaoAnalysis;
  servico: ServicoAnalysis;
  /**
   * Texto que não tem equivalente na grade ASI, por caminho do campo (ex.:
   * `'paladar.acidity': 'Média+'`). Vem das fichas anteriores à grade e da leitura
   * de rótulo. Sai quando a pessoa escolhe um valor ASI para o campo.
   */
  legacyNotes: Record<string, string>;
  tags?: string[];
  dataDegustacao: string;
  criadoEm: number;
  atualizadoEm: number;
  kind: RecordKind;
  sourceFormat: 'native-v2' | 'app-v1' | 'prototype-v1' | 'demo';
  favorite: boolean;
  occasion: string;
  origin: {
    countryCode: string | null;
    region: string;
  };
  aromaTags: string[];
  photoId: string | null;
  provenance: Record<string, DataSource>;
  evidence: Evidence;
  importMetadata: Record<string, unknown>;
  _demo?: boolean;
}

export type PhotoChange =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'replace'; blob: Blob };

export interface EntryDraft {
  id: 'active';
  entry: WineEntry;
  editingId: string | null;
  baseRevision: number | null;
  updatedAt: number;
  photoBlob?: Blob | null;
}

export type SheetLevel = 'iniciante' | 'avancado';

export interface Preferences {
  theme: 'paper' | 'night';
  textures: boolean;
  reduceMotion: boolean;
  showDemo: boolean;
  demoFavorites: Record<string, boolean>;
  /** Quando a pessoa aceitou enviar fotos de rótulo ao Gemini. Ausente em dados antigos. */
  aiConsentAt: number | null;
  /** Nível da ficha. O Iniciante mostra só cor, aromas, doçura, corpo e nota. */
  sheetLevel: SheetLevel;
}

export interface StoreSnapshot {
  entries: WineEntry[];
  draft: EntryDraft | null;
  preferences: Preferences;
}

export interface CommitEntryInput {
  entry: WineEntry;
  expectedRevision: number | null;
  photo: PhotoChange;
  clearDraft: boolean;
}
