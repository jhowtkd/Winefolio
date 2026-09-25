import { z } from 'zod';
import {
  ACIDITY,
  AGEING,
  ALCOHOL,
  ALL_CORE_COLOUR_CODES,
  APPEARANCE_INTENSITY,
  ASI_QUALITY,
  BODY,
  BRIGHTNESS,
  CLARITY,
  CLIMATE,
  CLIMATE_TYPE,
  codesOf,
  CONDITION,
  DECANT,
  DISH_STYLE,
  FAULTS,
  FINISH,
  FLAVOUR_INTENSITY,
  GLASS,
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
  VISCOSITY,
  WINE_STYLES,
  WINE_TYPES,
  type AsiOption,
} from './asi-vocabulary';

export const RatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.null(),
]);

const code = <T extends readonly AsiOption[]>(list: T) => z.enum(codesOf(list)).nullable();
const codeList = <T extends readonly AsiOption[]>(list: T) => z.array(z.enum(codesOf(list))).max(list.length);

export const WineTypeSchema = code(WINE_TYPES);
export const WineStyleSchema = code(WINE_STYLES);

export const VisualAnalysisSchema = z.object({
  coreColour: z.enum(ALL_CORE_COLOUR_CODES).nullable(),
  corHex: z.string().max(30).optional(),
  intensity: code(APPEARANCE_INTENSITY),
  clarity: code(CLARITY),
  brightness: code(BRIGHTNESS),
  rimVariation: code(RIM_VARIATION),
  viscosity: code(VISCOSITY),
  observations: codeList(OBSERVATIONS),
});

export const OlfatoAnalysisSchema = z.object({
  condition: code(CONDITION),
  faults: codeList(FAULTS),
  intensity: code(NOSE_INTENSITY),
  oak: code(OAK),
  maturity: code(NOSE_MATURITY),
  aromas: z.string().max(2000),
});

export const PaladarAnalysisSchema = z.object({
  condition: code(CONDITION),
  faults: codeList(FAULTS),
  sweetness: code(SWEETNESS),
  sparkle: code(SPARKLE),
  body: code(BODY),
  texture: codeList(TEXTURE),
  acidity: code(ACIDITY),
  flavourIntensity: code(FLAVOUR_INTENSITY),
  oak: code(OAK),
  maturity: code(PALATE_MATURITY),
  tanninLevel: code(TANNIN_LEVEL),
  tanninQuality: codeList(TANNIN_QUALITY),
  alcohol: code(ALCOHOL),
  abv: z.string().max(30),
  finish: code(FINISH),
  aromasBoca: z.string().max(2000),
  retrogosto: z.string().max(1000),
});

export const ConclusaoAnalysisSchema = z.object({
  avaliacaoEstrelas: RatingSchema,
  impressaoFinal: z.string().max(20000),
  harmonizacao: z.string().max(2000),
  preco: z.string().max(100),
  asiQuality: code(ASI_QUALITY),
  ageing: code(AGEING),
  vinification: codeList(VINIFICATION),
  climate: code(CLIMATE),
  climateType: code(CLIMATE_TYPE),
});

export const TemperatureRangeSchema = z
  .object({ min: z.number().min(-5).max(30), max: z.number().min(-5).max(30) })
  .refine((range) => range.min <= range.max);

export const ServicoAnalysisSchema = z.object({
  temperature: TemperatureRangeSchema.nullable(),
  glass: code(GLASS),
  decant: code(DECANT),
  dishStyle: code(DISH_STYLE),
  pairingComponents: codeList(PAIRING_COMPONENTS),
});

export const WineEntrySchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(3),
  revision: z.number().int().min(0),
  produtor: z.string().max(300),
  vinho: z.string().max(300),
  safra: z.string().max(50),
  uvas: z.string().max(300),
  regiaoPais: z.string().max(300),
  tipo: WineTypeSchema,
  estilo: WineStyleSchema,
  skinContact: z.boolean(),
  subestilo: z.enum(codesOf(SUBSTYLES)).nullable(),
  visual: VisualAnalysisSchema,
  olfato: OlfatoAnalysisSchema,
  paladar: PaladarAnalysisSchema,
  conclusao: ConclusaoAnalysisSchema,
  servico: ServicoAnalysisSchema,
  legacyNotes: z.record(z.string().max(100), z.string().max(2000)),
  tags: z.array(z.string().max(120)).max(100).optional(),
  dataDegustacao: z.string(),
  criadoEm: z.number(),
  atualizadoEm: z.number(),
  kind: z.enum(['personal', 'legacy', 'demo']),
  sourceFormat: z.enum(['native-v2', 'app-v1', 'prototype-v1', 'demo']),
  favorite: z.boolean(),
  occasion: z.string().max(300),
  origin: z.object({
    countryCode: z.string().nullable(),
    region: z.string().max(300),
  }),
  aromaTags: z.array(z.string().max(120)),
  photoId: z.string().nullable(),
  provenance: z.record(z.string(), z.enum(['user', 'imported-user', 'legacy-unknown', 'ai-unverified', 'demo'])),
  evidence: z.object({
    noteAuthoredAt: z.number().nullable(),
    aromasAuthoredAt: z.number().nullable(),
    originConfirmedAt: z.number().nullable(),
    revisitedAt: z.number().nullable(),
  }),
  importMetadata: z.record(z.string(), z.unknown()),
  _demo: z.boolean().optional(),
});
