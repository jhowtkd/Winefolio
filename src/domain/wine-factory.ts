import type { WineEntry } from './wine-entry';
import { localISODate } from './calendar';

export function createEntry(id: string, now: Date = new Date()): WineEntry {
  const timestamp = now.getTime();
  const dateStr = localISODate(now);

  return {
    id,
    schemaVersion: 2,
    revision: 0,
    produtor: '',
    vinho: '',
    safra: '',
    uvas: '',
    regiaoPais: '',
    tipo: null,
    estilo: null,
    visual: {
      limpidez: '',
      transparencia: '',
      intensidade: '',
      corNucleoBorda: '',
    },
    olfato: {
      condicao: '',
      intensidade: '',
      aromas: '',
      desenvolvimento: '',
    },
    paladar: {
      docura: '',
      acidez: '',
      tanino: '',
      aromasBoca: '',
      corpo: '',
      alcool: '',
      retrogosto: '',
      persistencia: '',
    },
    conclusao: {
      guarda: '',
      preco: '',
      qualidade: '',
      avaliacaoEstrelas: null,
      harmonizacao: '',
      impressaoFinal: '',
    },
    tags: [],
    dataDegustacao: dateStr,
    criadoEm: timestamp,
    atualizadoEm: timestamp,
    kind: 'personal',
    sourceFormat: 'native-v2',
    favorite: false,
    occasion: '',
    origin: {
      countryCode: null,
      region: '',
    },
    aromaTags: [],
    photoId: null,
    provenance: {},
    evidence: {
      noteAuthoredAt: null,
      aromasAuthoredAt: null,
      originConfirmedAt: null,
      revisitedAt: null,
    },
    importMetadata: {},
  };
}
