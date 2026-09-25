/**
 * Grupos aromáticos da grade ASI (ASI Synonyms) com descritores em português.
 *
 * A ficha grava só o descritor (`aromaTags`). O grupo sai daqui, e um descritor fora
 * do catálogo continua valendo: a própria ASI diz que a lista não é exaustiva.
 * A grafia dos descritores antigos foi mantida para as fichas salvas ganharem grupo
 * sem conversão.
 */

export interface AromaGroup {
  code: string;
  pt: string;
  en: string;
  /** Grupo mostrado no nível Iniciante. */
  common: boolean;
  descriptors: readonly string[];
}

export const AROMA_GROUPS: readonly AromaGroup[] = [
  {
    code: 'fruity',
    pt: 'Frutado',
    en: 'Fruity',
    common: true,
    descriptors: [
      'Cítricos', 'Limão siciliano', 'Lima da Pérsia', 'Casca de limão',
      'Maçã verde', 'Maçã madura', 'Pêra', 'Pêssego', 'Casca de pêssego', 'Damasco', 'Melão',
      'Abacaxi', 'Maracujá', 'Manga', 'Goiaba',
      'Frutas vermelhas', 'Morango', 'Framboesa', 'Cereja fresca', 'Groselha',
      'Frutas escuras', 'Cereja negra', 'Amora', 'Mirtilo', 'Ameixa preta', 'Cassis',
      'Frutas em compota', 'Geleia de frutas',
    ],
  },
  {
    code: 'floral',
    pt: 'Floral',
    en: 'Floral',
    common: true,
    descriptors: ['Flores', 'Flores brancas', 'Flor de laranjeira', 'Jasmim', 'Violeta', 'Lavanda', 'Rosas', 'Gerânio'],
  },
  {
    code: 'herbaceous',
    pt: 'Herbáceo',
    en: 'Herbaceous',
    common: true,
    descriptors: ['Ervas', 'Alecrim', 'Sálvia', 'Tomilho', 'Eucalipto', 'Menta / Hortelã'],
  },
  {
    code: 'vegetal',
    pt: 'Vegetal',
    en: 'Vegetal',
    common: true,
    descriptors: ['Grama cortada', 'Feno', 'Pimentão verde', 'Aspargo', 'Azeitona'],
  },
  {
    code: 'spice',
    pt: 'Especiarias',
    en: 'Spice',
    common: true,
    descriptors: ['Especiarias', 'Pimenta preta', 'Pimenta branca', 'Cravo', 'Canela', 'Noz-moscada', 'Anis'],
  },
  {
    code: 'wood',
    pt: 'Madeira',
    en: 'Wood',
    common: true,
    descriptors: ['Baunilha', 'Carvalho tostado', 'Cedro', 'Defumado', 'Coco', 'Resina'],
  },
  {
    code: 'earthy',
    pt: 'Terroso',
    en: 'Earthy',
    common: true,
    descriptors: ['Mineral / Pedra molhada', 'Calcário', 'Sílex', 'Grafite', 'Sub-bosque', 'Trufa', 'Cogumelo'],
  },
  {
    code: 'nuts',
    pt: 'Frutos secos',
    en: 'Nuts & Kernels',
    common: false,
    descriptors: ['Nozes', 'Avelã', 'Amêndoa', 'Café', 'Chocolate'],
  },
  {
    code: 'confectionary',
    pt: 'Confeitaria / caramelo',
    en: 'Confectionary / Caramel',
    common: false,
    descriptors: ['Mel', 'Toffee', 'Caramelo', 'Melaço'],
  },
  {
    code: 'baked',
    pt: 'Panificação',
    en: 'Baked',
    common: false,
    descriptors: ['Pão', 'Brioche / Pão tostado', 'Biscoito'],
  },
  {
    code: 'lactic',
    pt: 'Lático',
    en: 'Lactic',
    common: false,
    descriptors: ['Manteiga', 'Creme', 'Iogurte'],
  },
  {
    code: 'tertiary',
    pt: 'Terciário / evoluído',
    en: 'Tertiary / Aged',
    common: false,
    descriptors: ['Caça', 'Tabaco', 'Figo maduro', 'Passas', 'Ameixa seca'],
  },
  {
    code: 'animal',
    pt: 'Animal',
    en: 'Animal',
    common: false,
    descriptors: ['Couro', 'Carne', 'Sangue', 'Estábulo'],
  },
  {
    code: 'umami',
    pt: 'Umami',
    en: 'Umami',
    common: false,
    descriptors: ['Shoyu', 'Missô', 'Carne seca'],
  },
  {
    code: 'chemical',
    pt: 'Químico',
    en: 'Chemical',
    common: false,
    descriptors: ['Petróleo', 'Medicinal', 'Borracha', 'Alcatrão'],
  },
  {
    code: 'microbiological',
    pt: 'Microbiológico',
    en: 'Microbiological',
    common: false,
    descriptors: ['Levedura fresca', 'Borras (lees)', 'Mofo'],
  },
  {
    code: 'oxidative',
    pt: 'Oxidativo',
    en: 'Oxidative',
    common: false,
    descriptors: ['Marzipã', 'Carne curada'],
  },
  {
    code: 'reductive',
    pt: 'Redutivo',
    en: 'Reduction / Reductive',
    common: false,
    descriptors: ['Alho', 'Repolho', 'Cebola', 'Borracha queimada'],
  },
];

const byDescriptor = new Map<string, AromaGroup>();
for (const group of AROMA_GROUPS) {
  for (const descriptor of group.descriptors) byDescriptor.set(descriptor.toLocaleLowerCase('pt-BR'), group);
}

/** O grupo de um descritor, sem diferenciar maiúsculas. Descritor livre não tem grupo. */
export function aromaGroupOf(descriptor: string): AromaGroup | undefined {
  return byDescriptor.get(descriptor.trim().toLocaleLowerCase('pt-BR'));
}

/** Agrupa os descritores na ordem do catálogo. Os livres ficam por último, sem grupo. */
export function groupAromas(descriptors: readonly string[]): Array<{ group: AromaGroup | null; descriptors: string[] }> {
  const grouped = new Map<AromaGroup | null, string[]>();
  for (const descriptor of descriptors) {
    const group = aromaGroupOf(descriptor) ?? null;
    grouped.set(group, [...(grouped.get(group) ?? []), descriptor]);
  }
  const ordered: Array<{ group: AromaGroup | null; descriptors: string[] }> = [];
  for (const group of AROMA_GROUPS) {
    const list = grouped.get(group);
    if (list) ordered.push({ group, descriptors: list });
  }
  const free = grouped.get(null);
  if (free) ordered.push({ group: null, descriptors: free });
  return ordered;
}
