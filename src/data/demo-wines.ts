import type { Rating, WineEntry } from '../domain/wine-entry';
import { createEntry } from '../domain/wine-factory';

interface DemoSpec {
  id: string;
  vinho: string;
  produtor: string;
  safra: string;
  estilo: 'tinto' | 'branco' | 'rose';
  uvas: string;
  countryCode: string;
  region: string;
  impressaoFinal: string;
  aromaTags: string[];
  nota: Rating;
  dataDegustacao: string;
  occasion: string;
  favorite: boolean;
  art: number;
}

/** Os 6 vinhos fictícios da coleção ilustrativa do protótipo. */
const DEMO_SPECS: DemoSpec[] = [
  {
    id: 'demo-casa-do-vento',
    vinho: 'Casa do Vento',
    produtor: 'Quinta do Vento',
    safra: '2022',
    estilo: 'tinto',
    uvas: 'Touriga Nacional',
    countryCode: 'PT',
    region: 'Douro',
    impressaoFinal: 'Frutas escuras, conversa longa. Um daqueles que ficam na memória.',
    aromaTags: ['Frutas escuras', 'Especiarias'],
    nota: 5,
    dataDegustacao: '2026-09-18',
    occasion: 'Jantar sem pressa',
    favorite: true,
    art: 0,
  },
  {
    id: 'demo-la-loma',
    vinho: 'La Loma',
    produtor: 'Bodega La Loma',
    safra: '2023',
    estilo: 'branco',
    uvas: 'Chardonnay',
    countryCode: 'AR',
    region: 'Mendoza',
    impressaoFinal: 'Fresco, leve, com um toque de pêssego. Cara de tarde de sol.',
    aromaTags: ['Pêssego', 'Cítricos'],
    nota: 4,
    dataDegustacao: '2026-09-14',
    occasion: 'Almoço de domingo',
    favorite: false,
    art: 1,
  },
  {
    id: 'demo-rose-de-sol',
    vinho: 'Rosé de Sol',
    produtor: 'Maison du Sol',
    safra: '2024',
    estilo: 'rose',
    uvas: 'Grenache',
    countryCode: 'FR',
    region: 'Provence',
    impressaoFinal: 'Delicado, mas nada sem graça. Morango e uma boa surpresa.',
    aromaTags: ['Frutas vermelhas', 'Flores'],
    nota: 4,
    dataDegustacao: '2026-09-11',
    occasion: 'Uma boa conversa',
    favorite: false,
    art: 2,
  },
  {
    id: 'demo-linha-da-serra',
    vinho: 'Linha da Serra',
    produtor: 'Vinícola da Serra',
    safra: '2021',
    estilo: 'tinto',
    uvas: 'Merlot',
    countryCode: 'BR',
    region: 'Serra Gaúcha',
    impressaoFinal: 'Lembrou ameixa e um pouco de chocolate. Gostei da textura.',
    aromaTags: ['Frutas escuras', 'Chocolate'],
    nota: 4,
    dataDegustacao: '2026-09-08',
    occasion: 'Jantar em casa',
    favorite: false,
    art: 3,
  },
  {
    id: 'demo-campo-claro',
    vinho: 'Campo Claro',
    produtor: 'Herdade Campo Claro',
    safra: '2023',
    estilo: 'branco',
    uvas: 'Arinto',
    countryCode: 'PT',
    region: 'Alentejo',
    impressaoFinal: 'A acidez chamou atenção primeiro. Depois, veio o limão.',
    aromaTags: ['Cítricos', 'Flores'],
    nota: 3,
    dataDegustacao: '2026-09-05',
    occasion: 'Encontro com amigos',
    favorite: false,
    art: 4,
  },
  {
    id: 'demo-entre-rios',
    vinho: 'Entre Rios',
    produtor: 'Bodega Entre Rios',
    safra: '2022',
    estilo: 'tinto',
    uvas: 'Cabernet Franc',
    countryCode: 'AR',
    region: 'Mendoza',
    impressaoFinal: 'Uma nota de ervas que eu não esperava. Valeu anotar.',
    aromaTags: ['Ervas', 'Especiarias'],
    nota: 5,
    dataDegustacao: '2026-09-01',
    occasion: 'Uma noite de descobertas',
    favorite: true,
    art: 5,
  },
];

/** Os campos do nível Iniciante, para a ficha de exemplo mostrar a grade ASI. */
const DEMO_COLOUR = { tinto: 'ruby', branco: 'lemon', rose: 'salmon' } as const;

export function getDemoWines(now: Date = new Date()): WineEntry[] {
  return DEMO_SPECS.map((spec) => {
    const entry = createEntry(spec.id, now);
    entry.produtor = spec.produtor;
    entry.vinho = spec.vinho;
    entry.safra = spec.safra;
    entry.uvas = spec.uvas;
    entry.tipo = 'tranquilo';
    entry.estilo = spec.estilo;
    entry.origin = { countryCode: spec.countryCode, region: spec.region };
    entry.regiaoPais = spec.region;
    entry.occasion = spec.occasion;
    entry.favorite = spec.favorite;
    entry.aromaTags = [...spec.aromaTags];
    entry.dataDegustacao = spec.dataDegustacao;
    entry.visual = { ...entry.visual, coreColour: DEMO_COLOUR[spec.estilo] };
    entry.paladar = { ...entry.paladar, sweetness: 'dry' };
    entry.conclusao = {
      ...entry.conclusao,
      avaliacaoEstrelas: spec.nota,
      impressaoFinal: spec.impressaoFinal,
    };
    entry.kind = 'demo';
    entry.sourceFormat = 'demo';
    entry._demo = true;
    entry.provenance = { 'conclusao.impressaoFinal': 'demo' };
    entry.importMetadata = { art: spec.art };
    return entry;
  });
}
