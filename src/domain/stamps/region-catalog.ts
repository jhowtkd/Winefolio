import type { WineEntry } from '../wine-entry';
import type { Alias } from './grape-catalog';

export interface Region {
  id: string;
  label: string;
  country: string;
  /** Preposição com artigo para os títulos: "Amante da Toscana", "Visitante do Douro". Padrão "de". */
  of?: 'de' | 'do' | 'da';
  /** Região mãe, para quando uma sub-região ganhar marco próprio. */
  parent?: string;
  /** Sub-regiões e grafias que contam para esta região. */
  aliases: readonly Alias[];
}

const isFortified = (entry: WineEntry) => entry.tipo === 'fortificado';

export const REGIONS = [
  // França
  { id: 'provence', label: 'Provence', country: 'FR', aliases: ['provenca', 'cotes de provence', 'bandol', 'cassis', 'palette'] },
  {
    id: 'bordeaux',
    label: 'Bordeaux',
    country: 'FR',
    aliases: [
      'bordeus', 'medoc', 'haut medoc', 'pauillac', 'margaux', 'saint julien', 'st julien', 'saint estephe', 'st estephe',
      'saint emilion', 'st emilion', 'pomerol', 'graves', 'pessac', 'pessac leognan', 'sauternes',
    ],
  },
  {
    id: 'borgonha',
    label: 'Borgonha',
    country: 'FR', of: 'da',
    aliases: ['bourgogne', 'burgundy', 'chablis', 'cote de nuits', 'cote de beaune', 'cote d or', 'maconnais', 'beaujolais'],
  },
  { id: 'champagne', label: 'Champagne', country: 'FR', aliases: ['champanhe'] },
  {
    id: 'rhone',
    label: 'Rhône',
    country: 'FR', of: 'do',
    aliases: ['vale do rodano', 'rodano', 'cotes du rhone', 'chateauneuf du pape', 'hermitage', 'crozes hermitage', 'cote rotie', 'gigondas'],
  },
  { id: 'loire', label: 'Loire', country: 'FR', of: 'do', aliases: ['vale do loire', 'sancerre', 'vouvray', 'muscadet', 'pouilly fume'] },
  { id: 'alsacia', label: 'Alsácia', country: 'FR', of: 'da', aliases: ['alsace'] },
  // Itália
  { id: 'toscana', label: 'Toscana', country: 'IT', of: 'da', aliases: ['tuscany', 'chianti', 'montalcino', 'brunello di montalcino', 'bolgheri', 'montepulciano'] },
  { id: 'piemonte', label: 'Piemonte', country: 'IT', of: 'do', aliases: ['piedmont', 'barolo', 'barbaresco', 'langhe', 'asti'] },
  { id: 'veneto', label: 'Vêneto', country: 'IT', of: 'do', aliases: ['valpolicella', 'amarone', 'soave', 'prosecco', 'conegliano'] },
  { id: 'sicilia', label: 'Sicília', country: 'IT', of: 'da', aliases: ['sicily', 'etna'] },
  // Espanha
  { id: 'rioja', label: 'Rioja', country: 'ES', aliases: [] },
  { id: 'ribera-del-duero', label: 'Ribera del Duero', country: 'ES', aliases: [] },
  { id: 'priorat', label: 'Priorat', country: 'ES', aliases: ['priorato'] },
  { id: 'jerez', label: 'Jerez', country: 'ES', aliases: ['sherry', 'xeres', 'xerez', 'sanlucar', 'sanlucar de barrameda'] },
  { id: 'rias-baixas', label: 'Rías Baixas', country: 'ES', aliases: [] },
  // Portugal
  { id: 'douro', label: 'Douro', country: 'PT', of: 'do', aliases: ['vale do douro', { text: 'porto', when: isFortified }] },
  { id: 'alentejo', label: 'Alentejo', country: 'PT', of: 'do', aliases: [] },
  { id: 'vinho-verde', label: 'Vinho Verde', country: 'PT', of: 'do', aliases: ['minho', 'moncao', 'melgaco'] },
  { id: 'dao', label: 'Dão', country: 'PT', of: 'do', aliases: [] },
  { id: 'madeira', label: 'Madeira', country: 'PT', of: 'da', aliases: [] },
  // Argentina
  { id: 'mendoza', label: 'Mendoza', country: 'AR', aliases: ['lujan de cuyo', 'valle de uco', 'vale de uco', 'maipu', 'tupungato'] },
  { id: 'salta', label: 'Salta', country: 'AR', aliases: ['cafayate', 'calchaqui', 'valles calchaquies'] },
  // Chile
  { id: 'colchagua', label: 'Colchagua', country: 'CL', aliases: ['vale de colchagua', 'valle de colchagua'] },
  { id: 'maipo', label: 'Maipo', country: 'CL', of: 'do', aliases: ['vale do maipo', 'valle del maipo'] },
  { id: 'casablanca', label: 'Casablanca', country: 'CL', aliases: ['vale de casablanca', 'valle de casablanca'] },
  // Brasil
  { id: 'serra-gaucha', label: 'Serra Gaúcha', country: 'BR', of: 'da', aliases: ['vale dos vinhedos', 'bento goncalves', 'pinto bandeira'] },
  { id: 'campanha-gaucha', label: 'Campanha Gaúcha', country: 'BR', of: 'da', aliases: ['campanha'] },
  // Novo Mundo
  { id: 'napa', label: 'Napa', country: 'US', aliases: ['napa valley'] },
  { id: 'marlborough', label: 'Marlborough', country: 'NZ', aliases: [] },
  { id: 'stellenbosch', label: 'Stellenbosch', country: 'ZA', aliases: [] },
] as const satisfies readonly Region[];

export type RegionId = (typeof REGIONS)[number]['id'];

export function regionById(id: string): Region | undefined {
  return (REGIONS as readonly Region[]).find((region) => region.id === id);
}
