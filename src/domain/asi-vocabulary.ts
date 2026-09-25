/**
 * Vocabulário da grade de degustação ASI (Blind Tasting Grid, ASI Sommelier Guidelines).
 *
 * A ficha grava só o `code`. O rótulo em português, o termo oficial em inglês e os
 * sinônimos aceitos pela ASI (a dica) saem daqui. Os termos em português são tradução
 * de trabalho: os idiomas oficiais da ASI são francês, inglês e espanhol.
 */

export interface AsiOption<C extends string = string> {
  code: C;
  pt: string;
  en: string;
  /** Sinônimos aceitos pela ASI para este nível ou exemplo de uso. Só dica, não é gravado. */
  hint?: string;
  /** Cor aproximada, usada na taça ilustrada. */
  hex?: string;
}

type Options = readonly AsiOption[];
export type CodeOf<T extends Options> = T[number]['code'];

function options<const T extends Options>(list: T): T {
  return list;
}

/** Os códigos de uma lista, no formato que `z.enum` aceita. */
export function codesOf<T extends Options>(list: T): [CodeOf<T>, ...CodeOf<T>[]] {
  return list.map((option) => option.code) as [CodeOf<T>, ...CodeOf<T>[]];
}

export function findOption<T extends Options>(list: T, code: string | null | undefined): T[number] | undefined {
  if (!code) return undefined;
  return list.find((option) => option.code === code);
}

/** "Alta · High". */
export function bilingual(option: { pt: string; en: string }): string {
  return option.pt.toLowerCase() === option.en.toLowerCase() ? option.pt : `${option.pt} · ${option.en}`;
}

// Classificação

export const WINE_TYPES = options([
  { code: 'tranquilo', pt: 'Tranquilo', en: 'Still' },
  { code: 'espumante', pt: 'Espumante', en: 'Sparkling' },
  { code: 'sobremesa', pt: 'Doce / sobremesa', en: 'Sweet', hint: 'Botrytis, passificação' },
  { code: 'fortificado', pt: 'Fortificado', en: 'Fortified', hint: 'Porto, Jerez, Madeira, Marsala, Banyuls' },
  { code: 'mistela', pt: 'Mistela', en: 'Mistella / Vin de liqueur', hint: 'Mosto + álcool, sem fermentar. Ex.: Pineau des Charentes' },
  { code: 'aromatizado', pt: 'Aromatizado', en: 'Aromatized', hint: 'Vermute, Quinquina, Chinato' },
]);
export type WineType = CodeOf<typeof WINE_TYPES>;

/** Cor principal (Main Colour). Vale também para espumante. */
export const WINE_STYLES = options([
  { code: 'branco', pt: 'Branco', en: 'White' },
  { code: 'rose', pt: 'Rosé', en: 'Rosé' },
  { code: 'tinto', pt: 'Tinto', en: 'Red' },
]);
export type WineStyle = CodeOf<typeof WINE_STYLES>;

export const SUBSTYLE_GROUPS = [
  {
    pt: 'Jerez',
    en: 'Sherry',
    options: options([
      { code: 'sherry-fino', pt: 'Fino', en: 'Fino' },
      { code: 'sherry-manzanilla', pt: 'Manzanilla', en: 'Manzanilla' },
      { code: 'sherry-amontillado', pt: 'Amontillado', en: 'Amontillado' },
      { code: 'sherry-palo-cortado', pt: 'Palo Cortado', en: 'Palo Cortado' },
      { code: 'sherry-oloroso', pt: 'Oloroso', en: 'Oloroso' },
      { code: 'sherry-moscatel', pt: 'Moscatel', en: 'Moscatel' },
      { code: 'sherry-px', pt: 'Pedro Ximénez', en: 'PX' },
    ]),
  },
  {
    pt: 'Porto',
    en: 'Port',
    options: options([
      { code: 'port-ruby', pt: 'Ruby', en: 'Ruby' },
      { code: 'port-vintage', pt: 'Vintage', en: 'Vintage' },
      { code: 'port-single-quinta', pt: 'Single Quinta Vintage', en: 'Single Quinta Vintage' },
      { code: 'port-lbv', pt: 'Late Bottled Vintage', en: 'LBV' },
      { code: 'port-crusted', pt: 'Crusted', en: 'Crusted' },
      { code: 'port-tawny', pt: 'Tawny', en: 'Tawny' },
      { code: 'port-colheita', pt: 'Colheita', en: 'Colheita' },
    ]),
  },
  {
    pt: 'Madeira',
    en: 'Madeira',
    options: options([
      { code: 'madeira-sercial', pt: 'Sercial', en: 'Sercial' },
      { code: 'madeira-verdelho', pt: 'Verdelho', en: 'Verdelho' },
      { code: 'madeira-boal', pt: 'Boal', en: 'Boal' },
      { code: 'madeira-malmsey', pt: 'Malvasia', en: 'Malmsey' },
    ]),
  },
  {
    pt: 'Marsala',
    en: 'Marsala',
    options: options([
      { code: 'marsala-ambra', pt: 'Ambra', en: 'Ambra' },
      { code: 'marsala-oro', pt: 'Oro', en: 'Oro' },
      { code: 'marsala-rubino', pt: 'Rubino', en: 'Rubino' },
    ]),
  },
  {
    pt: 'Banyuls',
    en: 'Banyuls',
    options: options([
      { code: 'banyuls-blanc', pt: 'Blanc', en: 'Blanc' },
      { code: 'banyuls-traditionnel', pt: 'Traditionnel', en: 'Traditionnel' },
      { code: 'banyuls-rimage', pt: 'Rimage', en: 'Rimage' },
      { code: 'banyuls-grand-cru', pt: 'Grand Cru', en: 'Grand Cru' },
      { code: 'banyuls-rimage-mise-tardive', pt: 'Rimage Mise Tardive', en: 'Rimage Mise Tardive' },
    ]),
  },
] as const;

export type Substyle = (typeof SUBSTYLE_GROUPS)[number]['options'][number]['code'];
export const SUBSTYLES: readonly AsiOption<Substyle>[] = SUBSTYLE_GROUPS.flatMap(
  (group): readonly AsiOption<Substyle>[] => group.options
);

// Visual (Appearance)

/** Cores oficiais, do mais jovem ao mais evoluído. */
export const CORE_COLOURS = {
  branco: options([
    { code: 'lemon-green', pt: 'Limão-esverdeado', en: 'Lemon green', hex: '#E4EBB2' },
    { code: 'lemon', pt: 'Limão', en: 'Lemon', hex: '#EEE8A0' },
    { code: 'straw', pt: 'Palha', en: 'Straw', hex: '#F3E99F' },
    { code: 'hay', pt: 'Feno', en: 'Hay', hex: '#EBD27A' },
    { code: 'golden', pt: 'Dourado', en: 'Golden', hex: '#E2BD48' },
    { code: 'amber', pt: 'Âmbar', en: 'Amber', hex: '#C98A36' },
    { code: 'brown', pt: 'Marrom', en: 'Brown', hex: '#8A5A2B' },
  ]),
  rose: options([
    { code: 'gris', pt: 'Gris', en: 'Gris', hex: '#F2D8CC' },
    { code: 'pink', pt: 'Rosa', en: 'Pink', hex: '#E9A1AE' },
    { code: 'salmon', pt: 'Salmão', en: 'Salmon', hex: '#E88B7C' },
    { code: 'orange', pt: 'Alaranjado', en: 'Orange', hex: '#E39A6A' },
    { code: 'onionskin', pt: 'Casca de cebola', en: 'Onionskin', hex: '#CF9373' },
  ]),
  tinto: options([
    { code: 'purple', pt: 'Púrpura', en: 'Purple', hex: '#58132F' },
    { code: 'ruby', pt: 'Rubi', en: 'Ruby', hex: '#83122D' },
    { code: 'garnet', pt: 'Granada', en: 'Garnet', hex: '#6E1B24' },
    { code: 'tawny', pt: 'Atijolado', en: 'Tawny', hex: '#773523' },
    { code: 'brown', pt: 'Marrom', en: 'Brown', hex: '#5A3320' },
  ]),
} as const;

export type CoreColour =
  | CodeOf<typeof CORE_COLOURS.branco>
  | CodeOf<typeof CORE_COLOURS.rose>
  | CodeOf<typeof CORE_COLOURS.tinto>;

export const ALL_CORE_COLOUR_CODES = [
  ...new Set([
    ...codesOf(CORE_COLOURS.branco),
    ...codesOf(CORE_COLOURS.rose),
    ...codesOf(CORE_COLOURS.tinto),
  ]),
] as [CoreColour, ...CoreColour[]];

export function coreColoursFor(style: WineStyle | null): readonly AsiOption<CoreColour>[] {
  if (style) return CORE_COLOURS[style];
  return [...CORE_COLOURS.branco, ...CORE_COLOURS.rose, ...CORE_COLOURS.tinto];
}

/** Acha a cor pelo estilo. Sem estilo, procura em branco, rosé e tinto, nessa ordem. */
export function findCoreColour(style: WineStyle | null, code: string | null | undefined) {
  return findOption(coreColoursFor(style), code);
}

export const CLARITY = options([
  { code: 'clear', pt: 'Límpido', en: 'Clear' },
  { code: 'cloudy', pt: 'Turvo', en: 'Cloudy' },
]);

export const BRIGHTNESS = options([
  { code: 'bright', pt: 'Brilhante', en: 'Bright', hint: 'Cristalino, lustroso · Starbright, Shiny, Lustrous, Brilliant' },
  { code: 'dull', pt: 'Sem brilho', en: 'Dull', hint: 'Fosco · Flat, Matte, Lusterless' },
]);

export const APPEARANCE_INTENSITY = options([
  { code: 'low', pt: 'Baixa', en: 'Low', hint: 'Pálida, tênue · Pale, Faint, Weak' },
  { code: 'medium', pt: 'Média', en: 'Medium', hint: 'Moderada · Moderate' },
  { code: 'high', pt: 'Alta', en: 'High', hint: 'Profunda, opaca · Deep, Opaque' },
]);

export const VISCOSITY = options([
  { code: 'low', pt: 'Baixa', en: 'Low', hint: 'Aquosa, leve · Watery, Light' },
  { code: 'medium', pt: 'Média', en: 'Medium', hint: 'Moderada · Moderate' },
  { code: 'high', pt: 'Alta', en: 'High', hint: 'Pronunciada · Pronounced' },
]);

export const OBSERVATIONS = options([
  { code: 'co2', pt: 'CO2', en: 'CO2' },
  { code: 'deposit', pt: 'Depósito', en: 'Deposit' },
  { code: 'sediment', pt: 'Sedimento', en: 'Sediment' },
  { code: 'turbidity', pt: 'Turbidez', en: 'Turbidity' },
  { code: 'haze', pt: 'Véu', en: 'Haze' },
  { code: 'tearing', pt: 'Lágrimas', en: 'Tearing' },
]);

export const RIM_VARIATION = options([
  { code: 'yes', pt: 'Com variação no halo', en: 'Rim variation', hint: 'De aquoso a denso; reflexo, halo prateado · Watery to Dense, Hue, Silverlined' },
  { code: 'no', pt: 'Sem variação', en: 'No rim variation' },
]);

// Nariz e boca

export const NOSE_INTENSITY = options([
  { code: 'low', pt: 'Baixa', en: 'Low', hint: 'Discreta, contida · Gentle, Diminished, Lesser' },
  { code: 'medium', pt: 'Média', en: 'Medium', hint: 'Moderada · Moderate, Mild' },
  { code: 'high', pt: 'Alta', en: 'High', hint: 'Pronunciada, expressiva · Pronounced, Upfront, Direct, Elevated' },
]);

export const CONDITION = options([
  { code: 'clean', pt: 'Limpo', en: 'Clean' },
  { code: 'faulty', pt: 'Defeituoso', en: 'Faulty' },
]);

export const OAK = options([
  { code: 'perceptible', pt: 'Madeira perceptível', en: 'Perceptible' },
  { code: 'imperceptible', pt: 'Imperceptível', en: 'Imperceptible' },
]);

export const NOSE_MATURITY = options([
  { code: 'unripe', pt: 'Imaturo', en: 'Unripe' },
  { code: 'youthful', pt: 'Jovem', en: 'Youthful' },
  { code: 'maturing', pt: 'Em evolução', en: 'Maturing' },
  { code: 'mature', pt: 'Maduro', en: 'Mature' },
  { code: 'past-peak', pt: 'Em declínio', en: 'Past Peak' },
]);

/** Os 9 defeitos da grade. Os dois últimos só aparecem na boca. */
export const FAULTS = options([
  { code: 'tca', pt: 'TCA (bouchonné)', en: 'TCA', hint: 'Mofo, papelão molhado, fruta apagada' },
  { code: 'oxidation', pt: 'Oxidação', en: 'Oxidation', hint: 'Maçã passada, nozes, cor evoluída precoce' },
  { code: 'brett', pt: 'Brett', en: 'Brettanomyces', hint: 'Estábulo, suor de cavalo, band-aid' },
  { code: 'volatile-acidity', pt: 'Acidez volátil', en: 'Volatile acidity', hint: 'Vinagre, acetona, esmalte' },
  { code: 'reduction', pt: 'Redução', en: 'Reduction', hint: 'Ovo podre, alho, repolho, fósforo' },
  { code: 'smoke-taint', pt: 'Contaminação por fumaça', en: 'Smoke taint', hint: 'Cinzeiro, fumaça medicinal' },
  { code: 'geosmin', pt: 'Geosmina', en: 'Geosmin', hint: 'Terra molhada, beterraba' },
  { code: 'mousiness', pt: 'Gosto de rato', en: 'Mousiness', hint: 'Final de pipoca ou ração, depois de engolir' },
  { code: 'refermentation', pt: 'Refermentação', en: 'Refermentation', hint: 'CO2 indesejado, turbidez' },
]);
export type Fault = CodeOf<typeof FAULTS>;
export const NOSE_FAULTS: readonly AsiOption<Fault>[] = FAULTS.filter(
  (f) => f.code !== 'mousiness' && f.code !== 'refermentation'
);

export const SWEETNESS = options([
  { code: 'dry', pt: 'Seco', en: 'Dry' },
  { code: 'off-dry', pt: 'Quase seco', en: 'Off-dry' },
  { code: 'medium-dry', pt: 'Meio seco', en: 'Medium Dry' },
  { code: 'medium-sweet', pt: 'Meio doce', en: 'Medium sweet' },
  { code: 'sweet', pt: 'Doce', en: 'Sweet' },
  { code: 'luscious', pt: 'Licoroso', en: 'Luscious' },
]);

export const SPARKLE = options([
  { code: 'still', pt: 'Tranquilo', en: 'Still' },
  { code: 'prickly', pt: 'Frisante (agulha)', en: 'Prickly' },
  { code: 'soft-mousse', pt: 'Mousse suave', en: 'Soft mousse' },
  { code: 'pronounced-mousse', pt: 'Mousse pronunciada', en: 'Pronounced mousse' },
  { code: 'aggressive-mousse', pt: 'Mousse agressiva', en: 'Aggressive mousse' },
]);

export const BODY = options([
  { code: 'light', pt: 'Leve', en: 'Light' },
  { code: 'medium', pt: 'Médio', en: 'Medium' },
  { code: 'full', pt: 'Encorpado', en: 'Full' },
]);

export const TEXTURE = options([
  { code: 'waxy', pt: 'Cerosa', en: 'Waxy' },
  { code: 'oily', pt: 'Oleosa', en: 'Oily' },
  { code: 'creamy', pt: 'Cremosa', en: 'Creamy' },
  { code: 'mouthcoating', pt: 'Envolvente', en: 'Mouthcoating' },
  { code: 'watery', pt: 'Aquosa', en: 'Watery' },
]);

export const ACIDITY = options([
  { code: 'low', pt: 'Baixa', en: 'Low', hint: 'Suave · Gentle, Soft' },
  { code: 'medium', pt: 'Média', en: 'Medium', hint: 'Equilibrada, refrescante · Balanced, Moderate, Refreshing' },
  { code: 'high', pt: 'Alta', en: 'High', hint: 'Crocante, salivante, cortante · Pronounced, Crisp, Mouthwatering, Puckering, Searing' },
]);

export const FLAVOUR_INTENSITY = options([
  { code: 'low', pt: 'Baixa', en: 'Low', hint: 'Gentle, Muted, Soft' },
  { code: 'medium', pt: 'Média', en: 'Medium', hint: 'Moderate' },
  { code: 'high', pt: 'Alta', en: 'High', hint: 'Pronounced, Upfront, Strong' },
]);

export const PALATE_MATURITY = options([
  { code: 'youthful', pt: 'Jovem', en: 'Youthful' },
  { code: 'developing', pt: 'Em evolução', en: 'Developing' },
  { code: 'developed', pt: 'Evoluído', en: 'Developed' },
  { code: 'past-peak', pt: 'Em declínio', en: 'Past Peak' },
]);

export const TANNIN_LEVEL = options([
  { code: 'low', pt: 'Baixo', en: 'Low' },
  { code: 'medium', pt: 'Médio', en: 'Medium', hint: 'Moderate' },
  { code: 'high', pt: 'Alto', en: 'High' },
]);

export const TANNIN_QUALITY = options([
  { code: 'gentle', pt: 'Delicados', en: 'Gentle' },
  { code: 'silky', pt: 'Sedosos', en: 'Silky' },
  { code: 'fine-grained', pt: 'De grão fino', en: 'Fine-grained' },
  { code: 'soft', pt: 'Macios', en: 'Soft' },
  { code: 'smooth', pt: 'Lisos', en: 'Smooth' },
  { code: 'grippy', pt: 'Aderentes', en: 'Grippy' },
  { code: 'coarse', pt: 'Rústicos', en: 'Coarse' },
  { code: 'unripe', pt: 'Imaturos', en: 'Unripe' },
  { code: 'green', pt: 'Verdes', en: 'Green' },
  { code: 'aggressive', pt: 'Agressivos', en: 'Aggressive' },
  { code: 'dominating', pt: 'Dominantes', en: 'Dominating' },
  { code: 'integrated', pt: 'Integrados', en: 'Integrated' },
]);

export const ALCOHOL = options([
  { code: 'low', pt: 'Baixo', en: 'Low', hint: 'Gentle, Restrained' },
  { code: 'medium', pt: 'Médio', en: 'Medium', hint: 'Equilibrado, integrado · Balanced, Integrated' },
  { code: 'high', pt: 'Alto', en: 'High', hint: 'Quente, ardente · Warming, Hot, Burning' },
  { code: 'fortified', pt: 'Fortificado', en: 'Fortified' },
]);

export const FINISH = options([
  { code: 'short', pt: 'Curto', en: 'Short', hint: 'Brief, Fleeting' },
  { code: 'medium', pt: 'Médio', en: 'Medium', hint: 'Moderate' },
  { code: 'long', pt: 'Longo', en: 'Long', hint: 'Persistente · Lingering, Prolonged' },
]);

// Conclusões

export const ASI_QUALITY = options([
  { code: 'simple', pt: 'Simples', en: 'Simple' },
  { code: 'acceptable', pt: 'Aceitável', en: 'Acceptable' },
  { code: 'good', pt: 'Bom', en: 'Good' },
  { code: 'very-good', pt: 'Muito bom', en: 'Very Good' },
]);

/** Potencial de guarda: consumo imediato ou faixas de 3 anos. */
export const AGEING = options([
  { code: 'now', pt: 'Consumo imediato', en: 'Immediate consumption' },
  { code: '0-3', pt: '0 a 3 anos', en: '0-3 years' },
  { code: '3-6', pt: '3 a 6 anos', en: '3-6 years' },
  { code: '6-9', pt: '6 a 9 anos', en: '6-9 years' },
  { code: '9-12', pt: '9 a 12 anos', en: '9-12 years' },
  { code: '12-15', pt: '12 a 15 anos', en: '12-15 years' },
  { code: '15+', pt: 'Mais de 15 anos', en: '15+ years' },
]);
export type Ageing = CodeOf<typeof AGEING>;

export const VINIFICATION_STILL = options([
  { code: 'fortification', pt: 'Fortificação', en: 'Fortification' },
  { code: 'oxidative', pt: 'Oxidativo', en: 'Oxidative' },
  { code: 'reductive', pt: 'Redutivo', en: 'Reductive' },
  { code: 'modern', pt: 'Moderno', en: 'Modern' },
  { code: 'classic', pt: 'Clássico', en: 'Classic' },
  { code: 'cold-ferment', pt: 'Fermentação a frio', en: 'Cold ferment' },
  { code: 'lees-contact', pt: 'Contato com borras', en: 'Under Lees contact' },
  { code: 'skin-contact', pt: 'Contato com cascas', en: 'Skin contact' },
]);

export const VINIFICATION_SPARKLING = options([
  { code: 'traditional', pt: 'Tradicional', en: 'Traditionnelle' },
  { code: 'tank', pt: 'Tanque (Charmat)', en: 'Tank' },
  { code: 'transfer', pt: 'Transferência', en: 'Transfer' },
  { code: 'ancestral', pt: 'Ancestral', en: 'Ancestrale' },
  { code: 'carbonation', pt: 'Gaseificação', en: 'Carbonation' },
]);

export const VINIFICATION_SWEET = options([
  { code: 'botrytis', pt: 'Podridão nobre', en: 'Botrytis' },
  { code: 'appassimento', pt: 'Passificação', en: 'Appassimento' },
]);

export const VINIFICATION = options([...VINIFICATION_STILL, ...VINIFICATION_SPARKLING, ...VINIFICATION_SWEET]);
export type Vinification = CodeOf<typeof VINIFICATION>;

/** Estilos de vinificação que fazem sentido para o tipo do vinho. */
export function vinificationFor(type: WineType | null): readonly AsiOption<Vinification>[] {
  if (type === 'espumante') return VINIFICATION_SPARKLING;
  if (type === 'sobremesa') return [...VINIFICATION_SWEET, ...VINIFICATION_STILL];
  if (type === null) return VINIFICATION;
  return VINIFICATION_STILL;
}

export const CLIMATE = options([
  { code: 'cool', pt: 'Frio', en: 'Cool' },
  { code: 'moderate', pt: 'Moderado', en: 'Moderate' },
  { code: 'warm', pt: 'Quente', en: 'Warm' },
]);

export const CLIMATE_TYPE = options([
  { code: 'maritime', pt: 'Marítimo', en: 'Maritime' },
  { code: 'continental', pt: 'Continental', en: 'Continental' },
  { code: 'mediterranean', pt: 'Mediterrâneo', en: 'Mediterranean' },
  { code: 'desert', pt: 'Desértico', en: 'Desert' },
]);

// Serviço (Service & Food)

export const GLASS = options([
  { code: 'sleek-white', pt: 'Estreita de branco', en: 'Sleek white', hint: 'Riesling, Sauvignon Blanc' },
  { code: 'couped-white', pt: 'Bojuda de branco', en: 'Couped white', hint: 'Borgonha branco' },
  { code: 'sleek-red', pt: 'Estreita de tinto', en: 'Sleek red', hint: 'Bordeaux, Rhône' },
  { code: 'couped-red', pt: 'Bojuda de tinto', en: 'Couped red', hint: 'Borgonha tinto, Barolo' },
  { code: 'small-sleek', pt: 'Pequena estreita', en: 'Small sleek', hint: 'Fortificados' },
]);

export const DECANT = options([
  { code: 'no', pt: 'Não decantar', en: 'No' },
  { code: 'sediment', pt: 'Decantar para sedimento', en: 'For removal of sediment' },
  { code: 'aerate', pt: 'Aerar', en: 'Aerating' },
]);

export const DISH_STYLE = options([
  { code: 'elegant', pt: 'Elegante', en: 'Elegant' },
  { code: 'rustic', pt: 'Rústico', en: 'Rustic' },
  { code: 'rich', pt: 'Rico', en: 'Rich' },
]);

export const PAIRING_COMPONENTS = options([
  { code: 'sweetness', pt: 'Doçura', en: 'Sweetness' },
  { code: 'saltiness', pt: 'Sal', en: 'Saltiness' },
  { code: 'umami', pt: 'Umami', en: 'Umami' },
  { code: 'acidity', pt: 'Acidez', en: 'Acidity' },
  { code: 'bitterness', pt: 'Amargor', en: 'Bitterness' },
  { code: 'heat', pt: 'Picância', en: 'Heat' },
  { code: 'fat', pt: 'Gordura', en: 'Fat' },
]);

/** A ASI pede a temperatura de serviço numa faixa de até 3 °C. */
export const MAX_TEMPERATURE_RANGE = 3;
