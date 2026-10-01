/** Data do carimbo postal a partir de 'YYYY-MM-DD', sem `new Date` (fuso não muda o dia). */
export function postmarkDate(isoDate: string | null | undefined): string {
  const match = (isoDate ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  return `${match[3]}·${match[2]}·${match[1].slice(2)}`;
}

/** Quebra o título em linhas de até `maxChars`, sem cortar palavra. */
export function splitTitle(title: string, maxChars: number, maxLines = 3): string[] {
  const lines: string[] = [];
  for (const word of title.split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= maxChars) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(' ')];
}

/** Largura aproximada do texto, para comprimir só o que não cabe. */
export function estimateWidth(text: string, fontSize: number, kind: 'serif' | 'mono' | 'hand', letterSpacing = 0): number {
  const ratio = kind === 'mono' ? 0.6 : kind === 'hand' ? 0.42 : 0.54;
  return text.length * fontSize * ratio + Math.max(0, text.length - 1) * letterSpacing;
}

export function upper(text: string): string {
  return text.toLocaleUpperCase('pt-BR');
}

/** Semente estável por marco, para o desgaste variar entre selos e não entre renderizações. */
export function seedOf(id: string): number {
  let hash = 7;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 9973;
  return hash;
}
