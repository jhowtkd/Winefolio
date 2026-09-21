import { z } from 'zod';

export const RatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.null(),
]);

export const WineTypeSchema = z.enum(['tranquilo', 'espumante', 'sobremesa', 'fortificado']).nullable();
export const WineStyleSchema = z.enum(['branco', 'tinto', 'rose']).nullable();

export const VisualAnalysisSchema = z.object({
  limpidez: z.string().max(100),
  transparencia: z.string().max(100),
  intensidade: z.string().max(100),
  corNucleoBorda: z.string().max(200),
  corHex: z.string().max(30).optional(),
  perlage: z.string().max(100).optional(),
});

export const OlfatoAnalysisSchema = z.object({
  condicao: z.string().max(100),
  intensidade: z.string().max(100),
  aromas: z.string().max(2000),
  desenvolvimento: z.string().max(100),
});

export const PaladarAnalysisSchema = z.object({
  docura: z.string().max(100),
  acidez: z.string().max(100),
  tanino: z.string().max(100),
  aromasBoca: z.string().max(2000),
  corpo: z.string().max(100),
  alcool: z.string().max(100),
  retrogosto: z.string().max(1000),
  persistencia: z.string().max(100),
});

export const ConclusaoAnalysisSchema = z.object({
  guarda: z.string().max(100),
  preco: z.string().max(100),
  qualidade: z.string().max(100),
  avaliacaoEstrelas: RatingSchema,
  harmonizacao: z.string().max(2000),
  impressaoFinal: z.string().max(20000),
});

export const WineEntrySchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(2),
  revision: z.number().int().min(0),
  produtor: z.string().max(300),
  vinho: z.string().max(300),
  safra: z.string().max(50),
  uvas: z.string().max(300),
  regiaoPais: z.string().max(300),
  tipo: WineTypeSchema,
  estilo: WineStyleSchema,
  visual: VisualAnalysisSchema,
  olfato: OlfatoAnalysisSchema,
  paladar: PaladarAnalysisSchema,
  conclusao: ConclusaoAnalysisSchema,
  tags: z.array(z.string().max(120)).max(100).optional(),
  dataDegustacao: z.string(),
  temperaturaServico: z.string().max(100).optional(),
  decantacao: z.string().max(100).optional(),
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
