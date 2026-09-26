import type { WineEntry } from '../wine-entry';
import { isFilled, isGridComplete } from '../asi-fields';
import { AROMA_GROUPS, aromaGroupOf } from '../aroma-catalog';
import { codesOf, DISH_STYLE, PAIRING_COMPONENTS, SUBSTYLE_GROUPS, WINE_TYPES } from '../asi-vocabulary';
import { GRAPES, type Grape } from './grape-catalog';
import { fold, grapeKeysOf, trusted } from './normalize';
import { REGIONS, type Region } from './region-catalog';
import type { Ctx, Rule, StampDef, Tier } from './rules';

/** Congelada nos 13 países de hoje: se `COUNTRIES` crescer, quem deu a volta ao mundo não perde o marco. */
export const WORLD_TOUR_COUNTRIES = ['AR', 'AU', 'BR', 'CL', 'DE', 'ES', 'FR', 'IT', 'NZ', 'PT', 'US', 'UY', 'ZA'] as const;
export const OLD_WORLD = ['FR', 'IT', 'ES', 'PT', 'DE'] as const;
export const NEW_WORLD = ['AR', 'CL', 'BR', 'UY', 'US', 'AU', 'NZ', 'ZA'] as const;

export const JEREZ_SUBSTYLES = SUBSTYLE_GROUPS.find((group) => group.pt === 'Jerez')!.options.map((o) => o.code);
export const MADEIRA_SUBSTYLES = SUBSTYLE_GROUPS.find((group) => group.pt === 'Madeira')!.options.map((o) => o.code);
export const PORT_TRIO = ['port-ruby', 'port-tawny', 'port-vintage'] as const;

const upper = (text: string) => text.toLocaleUpperCase('pt-BR');
const count = (where: (e: WineEntry, ctx: Ctx) => boolean, min: number): Rule => ({ kind: 'count', where, min });

// Uvas

const GRAPE_TIERS: ReadonlyArray<{ tier: Tier; min: number; title: (g: Grape) => string }> = [
  { tier: 1, min: 3, title: (g) => `Curioso de ${g.label}` },
  { tier: 2, min: 10, title: (g) => `Explorador dos ${g.plural}` },
  { tier: 3, min: 25, title: (g) => `Guardião dos ${g.plural}` },
];

function grapeStamps(grape: Grape): StampDef[] {
  // Uma função por uva: os três níveis dividem a mesma passada pelas fichas.
  const where = (e: WineEntry, ctx: Ctx) => (ctx.grapes.get(e.id) ?? []).includes(grape.id as never);
  return GRAPE_TIERS.map(({ tier, min, title }) => ({
    id: `uva.${grape.id}.${tier}`,
    family: 'uva',
    tier,
    title: title(grape),
    motto: upper(`${min} fichas de ${grape.label}`),
    description: `${min} fichas com ${grape.label} no caderno.`,
    glyph: 'grape',
    tone: grape.color === 'tinta' ? 'wine' : 'kraft',
    subject: grape.id,
    rule: count(where, min),
  }));
}

// Regiões

const REGION_TIERS: ReadonlyArray<{ tier: Tier; min: number; title: string; motto: (r: Region) => string }> = [
  { tier: 1, min: 1, title: 'Visitante', motto: (r) => `primeira página ${ofRegion(r)}` },
  { tier: 2, min: 5, title: 'Amante', motto: (r) => `5 fichas ${ofRegion(r)}` },
  { tier: 3, min: 15, title: 'Cidadão', motto: (r) => `15 fichas ${ofRegion(r)}` },
];

function ofRegion(region: Region): string {
  return `${region.of ?? 'de'} ${region.label}`;
}

function regionStamps(region: Region): StampDef[] {
  const where = (e: WineEntry, ctx: Ctx) => (ctx.regions.get(e.id) ?? []).includes(region.id as never);
  return REGION_TIERS.map(({ tier, min, title, motto }) => ({
    id: `regiao.${region.id}.${tier}`,
    family: 'regiao',
    tier,
    title: `${title} ${ofRegion(region)}`,
    motto: upper(motto(region)),
    description: min === 1 ? `Uma página ${ofRegion(region)} no caderno.` : `${min} fichas ${ofRegion(region)} no caderno.`,
    glyph: 'milestone',
    tone: 'sage',
    subject: region.id,
    rule: count(where, min),
  }));
}

// Predicados compartilhados entre níveis

const any = () => true;
const countryIn =
  (list: readonly string[]) =>
  (e: WineEntry, ctx: Ctx): string[] => {
    const code = ctx.countries.get(e.id);
    return code && list.includes(code) ? [code] : [];
  };
const allCountries = (e: WineEntry, ctx: Ctx): string[] => {
  const code = ctx.countries.get(e.id);
  return code ? [code] : [];
};
const isBrazil = (e: WineEntry, ctx: Ctx) => ctx.countries.get(e.id) === 'BR';

const hasType = (type: string) => (e: WineEntry) => e.tipo === type && trusted(e, 'tipo');
const isSparkling = hasType('espumante');
const isRose = (e: WineEntry) => e.estilo === 'rose' && trusted(e, 'estilo');
// A leitura de rótulo liga o contato com as cascas junto com o estilo.
const isOrange = (e: WineEntry) => e.skinContact && trusted(e, 'estilo');
const hasVinification = (code: string) => (e: WineEntry) => (e.conclusao.vinification ?? []).includes(code as never);
const isTraditional = hasVinification('traditional');
const longAgeing = (e: WineEntry) =>
  (e.conclusao.ageing === '12-15' || e.conclusao.ageing === '15+') && trusted(e, 'conclusao.ageing');

const stars = (e: WineEntry) => e.conclusao.avaliacaoEstrelas;
const hasStars = (e: WineEntry) => stars(e) !== null && stars(e) !== undefined;
const fiveStars = (e: WineEntry) => stars(e) === 5;
const lowStars = (e: WineEntry) => stars(e) === 1 || stars(e) === 2;
const hasAsi = (e: WineEntry) => Boolean(e.conclusao.asiQuality);
const veryGood = (e: WineEntry) => e.conclusao.asiQuality === 'very-good';
const STARS_TO_ASI: Record<number, string> = { 1: 'simple', 2: 'simple', 3: 'acceptable', 4: 'good', 5: 'very-good' };
const calibrated = (e: WineEntry) => hasStars(e) && hasAsi(e) && STARS_TO_ASI[stars(e)!] === e.conclusao.asiQuality;
const tasteIsTaste = (e: WineEntry) =>
  (stars(e) === 5 && e.conclusao.asiQuality === 'simple') || (stars(e) === 1 && e.conclusao.asiQuality === 'very-good');
const longNote = (e: WineEntry) => (e.conclusao.impressaoFinal ?? '').trim().length >= 280;
const hasFault = (e: WineEntry) => (e.olfato.faults ?? []).length > 0 || (e.paladar.faults ?? []).length > 0;

const trustedFilled = (e: WineEntry, path: string) => isFilled(e, path) && trusted(e, path);
const gridComplete = (e: WineEntry) => isGridComplete(e, trustedFilled);
const aromaTags = (e: WineEntry) => (e.aromaTags ?? []).map(fold).filter(Boolean);
const aromaGroups = (e: WineEntry) =>
  (e.aromaTags ?? []).flatMap((tag) => {
    const group = aromaGroupOf(tag);
    return group ? [group.code] : [];
  });
const colours = (e: WineEntry) => (e.estilo && e.visual.coreColour ? [`${e.estilo}.${e.visual.coreColour}`] : []);
const fullService = (e: WineEntry) =>
  trustedFilled(e, 'servico.temperature') && trustedFilled(e, 'servico.glass') && trustedFilled(e, 'servico.decant');

const VINTAGE = /\b(1[89]\d\d|20\d\d)\b/;
function vintageOf(e: WineEntry): number | null {
  if (!trusted(e, 'safra')) return null;
  const match = (e.safra ?? '').match(VINTAGE);
  return match ? Number(match[1]) : null;
}
const archaeologist = (e: WineEntry) => {
  const vintage = vintageOf(e);
  const tasted = Number((e.dataDegustacao ?? '').slice(0, 4));
  return vintage !== null && tasted > 0 && vintage <= tasted - 20;
};

const producers = (e: WineEntry) => {
  const name = trusted(e, 'produtor') ? fold(e.produtor ?? '') : '';
  return name ? [name] : [];
};
const stylesWithOrange = (e: WineEntry) => (e.estilo && trusted(e, 'estilo') ? [isOrange(e) ? 'laranja' : e.estilo] : []);
const types = (e: WineEntry) => (e.tipo && trusted(e, 'tipo') ? [e.tipo] : []);
const substyle = (e: WineEntry) => (e.subestilo ? [e.subestilo] : []);
const starValue = (e: WineEntry) => (hasStars(e) ? [String(stars(e))] : []);
const atTable = (e: WineEntry) =>
  (trusted(e, 'conclusao.harmonizacao') && (e.conclusao.harmonizacao ?? '').trim() !== '') || Boolean(e.servico.dishStyle);
const pairingComponents = (e: WineEntry) => e.servico.pairingComponents ?? [];
const dishStyle = (e: WineEntry) => (e.servico.dishStyle ? [e.servico.dishStyle] : []);
const revisited = (e: WineEntry) => Boolean(e.evidence?.revisitedAt);
const favorite = (e: WineEntry) => Boolean(e.favorite);

/** Pelo menos 10 fichas do Velho Mundo e 10 do Novo. */
function twoWorlds(ctx: Ctx) {
  let old = 0;
  let fresh = 0;
  for (const entry of ctx.entries) {
    const code = ctx.countries.get(entry.id);
    if (!code) continue;
    if ((OLD_WORLD as readonly string[]).includes(code)) old += 1;
    if ((NEW_WORLD as readonly string[]).includes(code)) fresh += 1;
    if (old >= 10 && fresh >= 10) return { current: 20, unlockedBy: entry.id };
  }
  return { current: Math.min(old, 10) + Math.min(fresh, 10) };
}

/** Mesmo produtor e vinho em três safras diferentes. */
function vertical(ctx: Ctx) {
  const vintages = new Map<string, Set<number>>();
  let best = 0;
  for (const entry of ctx.entries) {
    const vintage = vintageOf(entry);
    if (vintage === null || !trusted(entry, 'produtor') || !trusted(entry, 'vinho')) continue;
    const wine = fold(entry.vinho ?? '');
    if (!wine) continue;
    const key = `${fold(entry.produtor ?? '')}|${wine}`;
    const seen = vintages.get(key) ?? new Set<number>();
    seen.add(vintage);
    vintages.set(key, seen);
    best = Math.max(best, seen.size);
    if (seen.size >= 3) return { current: 3, unlockedBy: entry.id };
  }
  return { current: best };
}

type Fixed = Omit<StampDef, 'family' | 'rule'> & { rule: Rule };

function family(name: StampDef['family'], stamps: Fixed[]): StampDef[] {
  return stamps.map((stamp) => ({ ...stamp, family: name }));
}

const PAIS = family('pais', [
  { id: 'pais.3', tier: 1, title: 'Mochileiro', motto: '3 PAÍSES NO CADERNO', description: 'Fichas de três países diferentes.', glyph: 'globe', tone: 'terracotta', rule: { kind: 'distinct', of: allCountries, min: 3 } },
  { id: 'pais.6', tier: 2, title: 'Passaporte carimbado', motto: '6 PAÍSES NO CADERNO', description: 'Fichas de seis países diferentes.', glyph: 'globe', tone: 'terracotta', rule: { kind: 'distinct', of: allCountries, min: 6 } },
  { id: 'pais.10', tier: 3, title: 'Cosmopolita', motto: '10 PAÍSES NO CADERNO', description: 'Fichas de dez países diferentes.', glyph: 'globe', tone: 'terracotta', rule: { kind: 'distinct', of: allCountries, min: 10 } },
  { id: 'pais.todos', tier: 3, title: 'Volta ao mundo', motto: 'TODOS OS PAÍSES DO CADERNO', description: 'Uma ficha de cada um dos 13 países da lista.', glyph: 'globe', tone: 'terracotta', rule: { kind: 'coverAll', of: allCountries, required: WORLD_TOUR_COUNTRIES } },
  { id: 'pais.velho', tier: 2, title: 'Velho Mundo', motto: '4 PAÍSES DO VELHO MUNDO', description: 'Quatro países entre França, Itália, Espanha, Portugal e Alemanha.', glyph: 'globe', tone: 'terracotta', rule: { kind: 'distinct', of: countryIn(OLD_WORLD), min: 4 } },
  { id: 'pais.novo', tier: 2, title: 'Novo Mundo', motto: '4 PAÍSES DO NOVO MUNDO', description: 'Quatro países das Américas, da Oceania ou da África do Sul.', glyph: 'globe', tone: 'terracotta', rule: { kind: 'distinct', of: countryIn(NEW_WORLD), min: 4 } },
  { id: 'pais.dois-mundos', tier: 3, title: 'Entre dois mundos', motto: '10 DO VELHO, 10 DO NOVO', description: 'Dez fichas do Velho Mundo e dez do Novo.', glyph: 'globe', tone: 'terracotta', face: '10', rule: { kind: 'custom', target: 20, progress: twoWorlds } },
  { id: 'pais.casa', tier: 2, title: 'Orgulho nacional', motto: '10 FICHAS DO BRASIL', description: 'Dez fichas de vinhos brasileiros.', glyph: 'globe', tone: 'sage', rule: count(isBrazil, 10) },
]);

const ESTILO = family('estilo', [
  { id: 'estilo.primeiro-espumante', tier: 1, title: 'Primeiras bolhas', motto: 'PRIMEIRO ESPUMANTE', description: 'Um espumante no caderno.', glyph: 'bubbles', tone: 'kraft', rule: count(isSparkling, 1) },
  { id: 'estilo.espumante', tier: 3, title: 'Vida efervescente', motto: '15 ESPUMANTES', description: 'Quinze fichas de espumante.', glyph: 'bubbles', tone: 'kraft', rule: count(isSparkling, 15) },
  { id: 'estilo.tradicional', tier: 2, title: 'Método clássico', motto: '5 FICHAS DE MÉTODO TRADICIONAL', description: 'Cinco espumantes de segunda fermentação na garrafa.', glyph: 'bubbles', tone: 'kraft', rule: count(isTraditional, 5) },
  { id: 'estilo.rose', tier: 2, title: 'Amante de rosé', motto: '10 ROSÉS', description: 'Dez fichas de rosé.', glyph: 'bottle', tone: 'terracotta', rule: count(isRose, 10) },
  { id: 'estilo.laranja', tier: 1, title: 'Pele e alma', motto: 'PRIMEIRO LARANJA', description: 'Um branco feito com contato com as cascas.', glyph: 'bottle', tone: 'terracotta', rule: count(isOrange, 1) },
  { id: 'estilo.laranja-5', tier: 2, title: 'Laranja convicto', motto: '5 LARANJAS', description: 'Cinco fichas de vinho laranja.', glyph: 'bottle', tone: 'terracotta', rule: count(isOrange, 5) },
  { id: 'estilo.doce', tier: 1, title: 'Final doce', motto: 'PRIMEIRO DOCE', description: 'Um vinho doce ou de sobremesa.', glyph: 'bottle', tone: 'kraft', rule: count(hasType('sobremesa'), 1) },
  { id: 'estilo.botrytis', tier: 2, title: 'Podridão nobre', motto: 'BOTRYTIS NA TAÇA', description: 'Um vinho de uvas com podridão nobre.', glyph: 'grape', tone: 'kraft', rule: count(hasVinification('botrytis'), 1) },
  { id: 'estilo.fortificado', tier: 1, title: 'Espírito fortificado', motto: 'PRIMEIRO FORTIFICADO', description: 'Um Porto, Jerez, Madeira ou outro fortificado.', glyph: 'bottle', tone: 'wine', rule: count(hasType('fortificado'), 1) },
  { id: 'estilo.jerez-todos', tier: 3, title: 'Bodega completa', motto: 'OS 7 ESTILOS DE JEREZ', description: 'Fino, Manzanilla, Amontillado, Palo Cortado, Oloroso, Moscatel e PX.', glyph: 'bottle', tone: 'kraft', rule: { kind: 'coverAll', of: substyle, required: JEREZ_SUBSTYLES } },
  { id: 'estilo.porto-trio', tier: 2, title: 'Cais da Ribeira', motto: 'RUBY, TAWNY E VINTAGE', description: 'Os três Portos clássicos: Ruby, Tawny e Vintage.', glyph: 'bottle', tone: 'wine', rule: { kind: 'coverAll', of: substyle, required: PORT_TRIO } },
  { id: 'estilo.madeira-todos', tier: 3, title: 'Quatro castas da ilha', motto: 'OS 4 ESTILOS DE MADEIRA', description: 'Sercial, Verdelho, Boal e Malvasia.', glyph: 'bottle', tone: 'kraft', rule: { kind: 'coverAll', of: substyle, required: MADEIRA_SUBSTYLES } },
  { id: 'estilo.raros', tier: 2, title: 'Fora do mapa', motto: 'MISTELA E AROMATIZADO', description: 'Uma mistela e um vinho aromatizado.', glyph: 'bottle', tone: 'terracotta', rule: { kind: 'coverAll', of: types, required: ['mistela', 'aromatizado'] } },
  { id: 'estilo.arco-iris', tier: 2, title: 'Arco-íris na taça', motto: 'BRANCO, ROSÉ, TINTO E LARANJA', description: 'As quatro cores do vinho no caderno.', glyph: 'palette', tone: 'terracotta', rule: { kind: 'coverAll', of: stylesWithOrange, required: ['branco', 'rose', 'tinto', 'laranja'] } },
  { id: 'estilo.todos-tipos', tier: 3, title: 'Seis caminhos', motto: 'OS 6 TIPOS DE VINHO', description: 'Tranquilo, espumante, doce, fortificado, mistela e aromatizado.', glyph: 'bottle', tone: 'wine', rule: { kind: 'coverAll', of: types, required: codesOf(WINE_TYPES) } },
  { id: 'estilo.guarda', tier: 2, title: 'Paciência de adega', motto: '3 VINHOS DE LONGA GUARDA', description: 'Três vinhos com potencial de guarda acima de 12 anos.', glyph: 'hourglass', tone: 'wine', rule: count(longAgeing, 3) },
]);

const CRITICA = family('critica', [
  { id: 'critica.primeira-nota', tier: 1, title: 'Primeira opinião', motto: 'PRIMEIRA NOTA', description: 'Uma ficha com a sua nota em estrelas.', glyph: 'star', tone: 'terracotta', rule: count(hasStars, 1) },
  { id: 'critica.cinco', tier: 1, title: 'Amor à primeira taça', motto: 'CINCO ESTRELAS', description: 'Um vinho com cinco estrelas.', glyph: 'heart', tone: 'wine', rule: count(fiveStars, 1) },
  { id: 'critica.cinco-10', tier: 2, title: 'Coração generoso', motto: '10 VINHOS DE CINCO ESTRELAS', description: 'Dez vinhos com cinco estrelas.', glyph: 'heart', tone: 'wine', rule: count(fiveStars, 10) },
  { id: 'critica.exigente', tier: 2, title: 'Crítico exigente', motto: '10 NOTAS BAIXAS', description: 'Dez vinhos com uma ou duas estrelas.', glyph: 'star', tone: 'terracotta', rule: count(lowStars, 10) },
  { id: 'critica.escala', tier: 2, title: 'Escala inteira', motto: 'DE UMA A CINCO ESTRELAS', description: 'Pelo menos um vinho em cada nota, de uma a cinco estrelas.', glyph: 'star', tone: 'terracotta', rule: { kind: 'coverAll', of: starValue, required: ['1', '2', '3', '4', '5'] } },
  { id: 'critica.asi-1', tier: 1, title: 'Olhar técnico', motto: 'PRIMEIRA QUALIDADE ASI', description: 'Uma ficha com a qualidade técnica da grade ASI.', glyph: 'magnifier', tone: 'sage', rule: count(hasAsi, 1) },
  { id: 'critica.asi-25', tier: 3, title: 'Júri de bolso', motto: '25 JULGAMENTOS ASI', description: 'Vinte e cinco fichas com a qualidade técnica ASI.', glyph: 'magnifier', tone: 'sage', rule: count(hasAsi, 25) },
  { id: 'critica.muito-bom', tier: 2, title: 'Muito bom, oficialmente', motto: '5 VINHOS MUITO BONS', description: 'Cinco vinhos com qualidade ASI "muito bom".', glyph: 'star', tone: 'sage', rule: count(veryGood, 5) },
  { id: 'critica.gosto-e-gosto', tier: 2, title: 'Gosto é gosto', motto: 'O CORAÇÃO E A TÉCNICA', description: 'Cinco estrelas para um vinho simples, ou uma estrela para um muito bom.', glyph: 'heart', tone: 'terracotta', rule: count(tasteIsTaste, 1) },
  { id: 'critica.calibrado', tier: 3, title: 'Palato calibrado', motto: '10 NOTAS EM SINTONIA', description: 'Dez fichas em que as estrelas e a qualidade ASI concordam.', glyph: 'magnifier', tone: 'sage', rule: count(calibrated, 10) },
  { id: 'critica.cronista', tier: 2, title: 'Cronista', motto: '10 IMPRESSÕES LONGAS', description: 'Dez impressões finais com pelo menos 280 caracteres.', glyph: 'quill', tone: 'kraft', rule: count(longNote, 10) },
  { id: 'critica.defeito', tier: 1, title: 'Nariz de detetive', motto: 'UM DEFEITO ENCONTRADO', description: 'Um defeito anotado no nariz ou na boca.', glyph: 'magnifier', tone: 'terracotta', rule: count(hasFault, 1) },
]);

const TECNICA = family('tecnica', [
  { id: 'tecnica.grade-1', tier: 1, title: 'Grade completa', motto: 'PRIMEIRA GRADE ASI COMPLETA', description: 'Uma ficha com toda a grade ASI que se aplica a ela.', glyph: 'grid', tone: 'sage', rule: count(gridComplete, 1) },
  { id: 'tecnica.grade-10', tier: 2, title: 'Sommelier de bolso', motto: '10 GRADES COMPLETAS', description: 'Dez fichas com a grade ASI completa.', glyph: 'grid', tone: 'sage', rule: count(gridComplete, 10) },
  { id: 'tecnica.grade-50', tier: 3, title: 'Banca examinadora', motto: '50 GRADES COMPLETAS', description: 'Cinquenta fichas com a grade ASI completa.', glyph: 'grid', tone: 'sage', rule: count(gridComplete, 50) },
  { id: 'tecnica.aromas-10', tier: 1, title: 'Nariz curioso', motto: '10 AROMAS DIFERENTES', description: 'Dez aromas diferentes nas suas fichas.', glyph: 'leaf', tone: 'sage', rule: { kind: 'distinct', of: aromaTags, min: 10 } },
  { id: 'tecnica.aromas-50', tier: 2, title: 'Biblioteca de aromas', motto: '50 AROMAS DIFERENTES', description: 'Cinquenta aromas diferentes nas suas fichas.', glyph: 'leaf', tone: 'sage', rule: { kind: 'distinct', of: aromaTags, min: 50 } },
  { id: 'tecnica.grupos', tier: 3, title: 'Nariz enciclopédico', motto: 'OS 18 GRUPOS DE AROMAS', description: 'Um aroma de cada grupo da roda de aromas.', glyph: 'leaf', tone: 'sage', rule: { kind: 'coverAll', of: aromaGroups, required: AROMA_GROUPS.map((group) => group.code) } },
  { id: 'tecnica.cor', tier: 2, title: 'Paleta de cores', motto: '10 TONS NA TAÇA', description: 'Dez cores diferentes anotadas no visual.', glyph: 'palette', tone: 'terracotta', rule: { kind: 'distinct', of: colours, min: 10 } },
  { id: 'tecnica.servico', tier: 2, title: 'Mestre de serviço', motto: '10 SERVIÇOS COMPLETOS', description: 'Dez fichas com temperatura, taça e decantação.', glyph: 'thermometer', tone: 'sage', rule: count(fullService, 10) },
  { id: 'tecnica.vertical', tier: 3, title: 'Degustação vertical', motto: '3 SAFRAS DO MESMO VINHO', description: 'O mesmo vinho do mesmo produtor em três safras.', glyph: 'hourglass', tone: 'wine', rule: { kind: 'custom', target: 3, progress: vertical } },
  { id: 'tecnica.arqueologo', tier: 2, title: 'Arqueólogo', motto: '20 ANOS NA GARRAFA', description: 'Um vinho provado 20 anos ou mais depois da safra.', glyph: 'hourglass', tone: 'kraft', rule: count(archaeologist, 1) },
]);

const VOLUME = family('volume', [
  { id: 'volume.1', tier: 1, title: 'Primeira taça', motto: 'PRIMEIRA FICHA', description: 'A primeira ficha do caderno.', glyph: 'book', tone: 'wine', rule: count(any, 1) },
  { id: 'volume.10', tier: 1, title: 'Dezena', motto: '10 FICHAS', description: 'Dez fichas no caderno.', glyph: 'book', tone: 'wine', rule: count(any, 10) },
  { id: 'volume.25', tier: 2, title: 'Caderno aberto', motto: '25 FICHAS', description: 'Vinte e cinco fichas no caderno.', glyph: 'book', tone: 'wine', rule: count(any, 25) },
  { id: 'volume.50', tier: 2, title: 'Meio século', motto: '50 FICHAS', description: 'Cinquenta fichas no caderno.', glyph: 'book', tone: 'wine', rule: count(any, 50) },
  { id: 'volume.100', tier: 3, title: 'Cem páginas', motto: '100 FICHAS', description: 'Cem fichas no caderno.', glyph: 'book', tone: 'wine', rule: count(any, 100) },
  { id: 'volume.250', tier: 3, title: 'Adega de papel', motto: '250 FICHAS', description: 'Duzentas e cinquenta fichas no caderno.', glyph: 'book', tone: 'wine', rule: count(any, 250) },
  { id: 'volume.500', tier: 3, title: 'Enciclopédia', motto: '500 FICHAS', description: 'Quinhentas fichas no caderno.', glyph: 'book', tone: 'wine', rule: count(any, 500) },
  { id: 'volume.1000', tier: 3, title: 'Mil taças', motto: '1000 FICHAS', description: 'Mil fichas no caderno.', glyph: 'book', tone: 'wine', rule: count(any, 1000) },
  { id: 'volume.produtores-10', tier: 1, title: 'Dez casas', motto: '10 PRODUTORES', description: 'Vinhos de dez produtores diferentes.', glyph: 'house', tone: 'kraft', rule: { kind: 'distinct', of: producers, min: 10 } },
  { id: 'volume.produtores-50', tier: 2, title: 'Rota das vinícolas', motto: '50 PRODUTORES', description: 'Vinhos de cinquenta produtores diferentes.', glyph: 'house', tone: 'kraft', rule: { kind: 'distinct', of: producers, min: 50 } },
  { id: 'volume.uvas-10', tier: 1, title: 'Ampelógrafo', motto: '10 UVAS DIFERENTES', description: 'Dez uvas diferentes nas suas fichas.', glyph: 'grape', tone: 'wine', rule: { kind: 'distinct', of: grapeKeysOf, min: 10 } },
  { id: 'volume.uvas-50', tier: 3, title: 'Enciclopédia de castas', motto: '50 UVAS DIFERENTES', description: 'Cinquenta uvas diferentes nas suas fichas.', glyph: 'grape', tone: 'wine', rule: { kind: 'distinct', of: grapeKeysOf, min: 50 } },
]);

const HARMONIZACAO = family('harmonizacao', [
  { id: 'harmonizacao.1', tier: 1, title: 'À mesa', motto: 'PRIMEIRA HARMONIZAÇÃO', description: 'Uma ficha com harmonização ou estilo de prato.', glyph: 'fork', tone: 'terracotta', rule: count(atTable, 1) },
  { id: 'harmonizacao.25', tier: 2, title: 'Cozinha do caderno', motto: '25 HARMONIZAÇÕES', description: 'Vinte e cinco fichas com harmonização.', glyph: 'fork', tone: 'terracotta', rule: count(atTable, 25) },
  { id: 'harmonizacao.componentes', tier: 3, title: 'Sete sabores', motto: 'OS 7 COMPONENTES DO PRATO', description: 'Doçura, sal, umami, acidez, amargor, picância e gordura.', glyph: 'fork', tone: 'terracotta', rule: { kind: 'coverAll', of: pairingComponents, required: codesOf(PAIRING_COMPONENTS) } },
  { id: 'harmonizacao.estilos', tier: 2, title: 'Do rústico ao elegante', motto: 'OS 3 ESTILOS DE PRATO', description: 'Pratos elegantes, rústicos e ricos.', glyph: 'fork', tone: 'terracotta', rule: { kind: 'coverAll', of: dishStyle, required: codesOf(DISH_STYLE) } },
]);

const SECRETO = family('secreto', [
  { id: 'secreto.revisita', tier: 2, title: 'De volta à página', motto: '5 FICHAS REVISITADAS', description: 'Cinco fichas que você voltou para completar.', glyph: 'return', tone: 'kraft', hidden: true, rule: count(revisited, 5) },
  { id: 'secreto.favoritos', tier: 3, title: 'Coleção do coração', motto: '20 FAVORITOS', description: 'Vinte vinhos marcados como favoritos.', glyph: 'heart', tone: 'wine', hidden: true, rule: count(favorite, 20) },
]);

/** As quatro marcas que o Passaporte já mostrava, com as mesmas regras. */
export const LEGACY_STAMPS = family('legado', [
  { id: 'legado.first', tier: 1, title: 'Primeira página', motto: 'IMPRESSÃO GUARDADA', description: 'Uma impressão pessoal guardada, do seu jeito.', glyph: 'book', tone: 'wine', rule: count((e) => Boolean(e.conclusao?.impressaoFinal?.trim()), 1) },
  { id: 'legado.vocabulary', tier: 1, title: 'Meu vocabulário', motto: 'AROMA DESCRITO', description: 'Um aroma descrito com as suas próprias referências.', glyph: 'leaf', tone: 'sage', rule: count((e) => Boolean(e.aromaTags?.length), 1) },
  { id: 'legado.revisited', tier: 1, title: 'Memória revisitada', motto: 'FICHA REVISITADA', description: 'Uma nova observação acrescentada a uma ficha sua.', glyph: 'pencil', tone: 'kraft', rule: count(revisited, 1) },
  { id: 'legado.origin', tier: 1, title: 'Origem registrada', motto: 'PAÍS NO CADERNO', description: 'O país de um rótulo confirmado no caderno.', glyph: 'passport', tone: 'terracotta', rule: count((e) => Boolean(e.origin?.countryCode) && e.origin.countryCode !== 'other', 1) },
]);

export const GRAPE_STAMPS = (GRAPES as readonly Grape[]).flatMap(grapeStamps);
export const REGION_STAMPS = (REGIONS as readonly Region[]).flatMap(regionStamps);
export const FIXED_STAMPS = [...PAIS, ...ESTILO, ...CRITICA, ...TECNICA, ...VOLUME, ...HARMONIZACAO, ...SECRETO];

export const STAMPS: readonly StampDef[] = [...GRAPE_STAMPS, ...REGION_STAMPS, ...FIXED_STAMPS, ...LEGACY_STAMPS];

const BY_ID = new Map(STAMPS.map((stamp) => [stamp.id, stamp]));

export function stampById(id: string): StampDef | undefined {
  return BY_ID.get(id);
}
