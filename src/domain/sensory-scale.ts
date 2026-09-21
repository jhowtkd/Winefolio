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
