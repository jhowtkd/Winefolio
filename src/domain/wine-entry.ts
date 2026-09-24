export type Rating = 1 | 2 | 3 | 4 | 5 | null;
export type RecordKind = 'personal' | 'legacy' | 'demo';
export type DataSource = 'user' | 'imported-user' | 'legacy-unknown' | 'ai-unverified' | 'demo';

export interface Evidence {
  noteAuthoredAt: number | null;
  aromasAuthoredAt: number | null;
  originConfirmedAt: number | null;
  revisitedAt: number | null;
}

export type WineType = 'tranquilo' | 'espumante' | 'sobremesa' | 'fortificado';
export type WineStyle = 'branco' | 'tinto' | 'rose';

export interface VisualAnalysis {
  limpidez: string;
  transparencia: string;
  intensidade: string;
  corNucleoBorda: string;
  corHex?: string;
  perlage?: string;
}

export interface OlfatoAnalysis {
  condicao: string;
  intensidade: string;
  aromas: string;
  desenvolvimento: string;
}

export interface PaladarAnalysis {
  docura: string;
  acidez: string;
  tanino: string;
  aromasBoca: string;
  corpo: string;
  alcool: string;
  retrogosto: string;
  persistencia: string;
}

export interface ConclusaoAnalysis {
  guarda: string;
  preco: string;
  qualidade: string;
  avaliacaoEstrelas: Rating;
  harmonizacao: string;
  impressaoFinal: string;
}

export interface WineEntry {
  id: string;
  schemaVersion: 2;
  revision: number;
  produtor: string;
  vinho: string;
  safra: string;
  uvas: string;
  regiaoPais: string;
  tipo: WineType | null;
  estilo: WineStyle | null;
  visual: VisualAnalysis;
  olfato: OlfatoAnalysis;
  paladar: PaladarAnalysis;
  conclusao: ConclusaoAnalysis;
  tags?: string[];
  dataDegustacao: string;
  temperaturaServico?: string;
  decantacao?: string;
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

export interface Preferences {
  theme: 'paper' | 'night';
  textures: boolean;
  reduceMotion: boolean;
  showDemo: boolean;
  demoFavorites: Record<string, boolean>;
  /** Quando a pessoa aceitou enviar fotos de rótulo ao Gemini. Ausente em dados antigos. */
  aiConsentAt: number | null;
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
