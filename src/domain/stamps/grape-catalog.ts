import type { WineEntry } from '../wine-entry';

/** Sinônimo com condição: só casa quando a ficha passa no teste. */
export interface ConditionalAlias {
  text: string;
  when: (entry: WineEntry) => boolean;
}

export type Alias = string | ConditionalAlias;

export interface Grape {
  id: string;
  label: string;
  plural: string;
  color: 'tinta' | 'branca';
  /** País mais associado à uva. Decide o modelo de arte do selo. */
  home: string;
  aliases: readonly Alias[];
}

const isRed = (entry: WineEntry) => entry.estilo === 'tinto';

export const GRAPES = [
  { id: 'cabernet-sauvignon', label: 'Cabernet Sauvignon', plural: 'Cabernets', color: 'tinta', home: 'FR', aliases: ['cab sauv', 'cabernet s'] },
  { id: 'merlot', label: 'Merlot', plural: 'Merlots', color: 'tinta', home: 'FR', aliases: [] },
  { id: 'pinot-noir', label: 'Pinot Noir', plural: 'Pinots Noirs', color: 'tinta', home: 'FR', aliases: ['pinot nero', 'spatburgunder', 'blauburgunder'] },
  { id: 'syrah', label: 'Syrah', plural: 'Syrahs', color: 'tinta', home: 'FR', aliases: ['shiraz'] },
  { id: 'malbec', label: 'Malbec', plural: 'Malbecs', color: 'tinta', home: 'AR', aliases: ['cot', { text: 'auxerrois', when: isRed }] },
  { id: 'tempranillo', label: 'Tempranillo', plural: 'Tempranillos', color: 'tinta', home: 'ES', aliases: ['tinta roriz', 'aragonez', 'tinto fino', 'tinta de toro'] },
  { id: 'grenache', label: 'Grenache', plural: 'Grenaches', color: 'tinta', home: 'ES', aliases: ['garnacha', 'garnatxa', 'cannonau'] },
  { id: 'sangiovese', label: 'Sangiovese', plural: 'Sangioveses', color: 'tinta', home: 'IT', aliases: ['brunello', 'prugnolo gentile', 'morellino'] },
  { id: 'nebbiolo', label: 'Nebbiolo', plural: 'Nebbiolos', color: 'tinta', home: 'IT', aliases: ['spanna', 'chiavennasca'] },
  { id: 'carmenere', label: 'Carménère', plural: 'Carménères', color: 'tinta', home: 'CL', aliases: ['carmenere'] },
  { id: 'tannat', label: 'Tannat', plural: 'Tannats', color: 'tinta', home: 'UY', aliases: [] },
  { id: 'touriga-nacional', label: 'Touriga Nacional', plural: 'Tourigas', color: 'tinta', home: 'PT', aliases: [] },
  { id: 'cabernet-franc', label: 'Cabernet Franc', plural: 'Cabernets Francs', color: 'tinta', home: 'FR', aliases: ['bouchet'] },
  { id: 'zinfandel', label: 'Zinfandel', plural: 'Zinfandels', color: 'tinta', home: 'US', aliases: ['primitivo'] },
  { id: 'mourvedre', label: 'Mourvèdre', plural: 'Mourvèdres', color: 'tinta', home: 'FR', aliases: ['monastrell', 'mataro'] },
  { id: 'chardonnay', label: 'Chardonnay', plural: 'Chardonnays', color: 'branca', home: 'FR', aliases: ['chard'] },
  { id: 'sauvignon-blanc', label: 'Sauvignon Blanc', plural: 'Sauvignons', color: 'branca', home: 'FR', aliases: ['fume blanc', 'sauvignon'] },
  { id: 'riesling', label: 'Riesling', plural: 'Rieslings', color: 'branca', home: 'DE', aliases: [] },
  { id: 'chenin-blanc', label: 'Chenin Blanc', plural: 'Chenins', color: 'branca', home: 'FR', aliases: ['steen'] },
  { id: 'alvarinho', label: 'Alvarinho', plural: 'Alvarinhos', color: 'branca', home: 'PT', aliases: ['albarino'] },
  { id: 'pinot-grigio', label: 'Pinot Grigio', plural: 'Pinots Gris', color: 'branca', home: 'IT', aliases: ['pinot gris', 'grauburgunder'] },
  { id: 'gewurztraminer', label: 'Gewürztraminer', plural: 'Gewürz', color: 'branca', home: 'FR', aliases: ['gewurz', 'traminer'] },
  { id: 'viognier', label: 'Viognier', plural: 'Viogniers', color: 'branca', home: 'FR', aliases: [] },
  { id: 'moscato', label: 'Moscato', plural: 'Moscatos', color: 'branca', home: 'IT', aliases: ['muscat', 'moscatel', 'moscato giallo'] },
] as const satisfies readonly Grape[];

export type GrapeId = (typeof GRAPES)[number]['id'];

export function grapeById(id: string): Grape | undefined {
  return (GRAPES as readonly Grape[]).find((grape) => grape.id === id);
}
