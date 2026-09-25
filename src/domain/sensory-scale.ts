import type { PaladarAnalysis, WineEntry } from './wine-entry';

export type PalateAxis = 'corpo' | 'acidez' | 'tanino' | 'alcool' | 'docura';

export function scorePalate(value: string | undefined, axis: PalateAxis): number | null {
  const lower = (value || '').trim().toLowerCase();
  if (!lower) return null;

  if (axis === 'corpo') {
    if (lower.includes('encorpado')) return 5;
    if (lower.includes('médio+') || lower.includes('medio+')) return 4;
    if (lower.includes('médio-') || lower.includes('medio-')) return 2;
    if (lower.includes('médio') || lower.includes('medio')) return 3;
    if (lower.includes('leve')) return 1.5;
    return null;
  }
  if (axis === 'acidez') {
    if (lower.includes('muito alta')) return 5;
    if (lower.includes('alta')) return 4.5;
    if (lower.includes('média+') || lower.includes('media+')) return 4;
    if (lower.includes('média-') || lower.includes('media-')) return 2;
    if (lower.includes('média') || lower.includes('media')) return 3;
    if (lower.includes('baixa')) return 1.5;
    return null;
  }
  if (axis === 'tanino') {
    if (lower.includes('nulo') || lower.includes('não tem') || lower.includes('nao tem')) return 1;
    if (lower.includes('baixo')) return 2;
    if (lower.includes('médio-') || lower.includes('medio-')) return 2.5;
    if (lower.includes('médio+') || lower.includes('medio+')) return 4;
    if (lower.includes('sedoso')) return 3.5;
    if (lower.includes('médio') || lower.includes('medio')) return 3;
    if (lower.includes('adstringente') || lower.includes('alto')) return 5;
    return null;
  }
  if (axis === 'alcool') {
    if (lower.includes('quente')) return 5;
    if (lower.includes('alto')) return 4.5;
    if (lower.includes('equilibrado') || lower.includes('médio') || lower.includes('medio')) return 3.5;
    if (lower.includes('baixo')) return 2;
    return null;
  }
  if (lower.includes('doce')) return 5;
  if (lower.includes('suave')) return 3.8;
  if (lower.includes('meio-seco')) return 2.5;
  if (lower.includes('seco')) return 1.2;
  return null;
}

const LEVEL3: Record<string, number> = { low: 1.5, medium: 3, high: 4.5 };

const CODE_SCORES: Record<PalateAxis, Record<string, number>> = {
  corpo: { light: 1.5, medium: 3, full: 5 },
  acidez: LEVEL3,
  tanino: { low: 2, medium: 3, high: 5 },
  alcool: { low: 2, medium: 3.5, high: 4.5, fortified: 5 },
  docura: { dry: 1.2, 'off-dry': 2, 'medium-dry': 2.5, 'medium-sweet': 3.5, sweet: 4.5, luscious: 5 },
};

const AXIS_PATH: Record<PalateAxis, { field: keyof PaladarAnalysis; legacy: string }> = {
  corpo: { field: 'body', legacy: 'paladar.body' },
  acidez: { field: 'acidity', legacy: 'paladar.acidity' },
  tanino: { field: 'tanninLevel', legacy: 'paladar.tanninLevel' },
  alcool: { field: 'alcohol', legacy: 'paladar.alcohol' },
  docura: { field: 'sweetness', legacy: 'paladar.sweetness' },
};

/**
 * Nota de 1 a 5 do eixo no radar. Lê o código da grade ASI. Sem código, usa o texto
 * que ficou da ficha anterior à grade (ex.: "Média+"), para o radar antigo não sumir.
 */
export function palateScore(
  entry: Pick<WineEntry, 'paladar' | 'legacyNotes'>,
  axis: PalateAxis
): number | null {
  const { field, legacy } = AXIS_PATH[axis];
  const code = entry.paladar?.[field];
  if (typeof code === 'string' && CODE_SCORES[axis][code] !== undefined) return CODE_SCORES[axis][code];
  return scorePalate(entry.legacyNotes?.[legacy], axis);
}
