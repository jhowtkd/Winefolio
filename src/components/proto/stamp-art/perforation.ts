/** Forma do papel do selo, na caixa 240×240. */
export type PaperShape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'circle'; cx: number; cy: number; r: number };

export const PORTRAIT: PaperShape = { kind: 'rect', x: 32, y: 16, w: 176, h: 208 };
export const LANDSCAPE: PaperShape = { kind: 'rect', x: 12, y: 50, w: 216, h: 140 };
export const ROUND: PaperShape = { kind: 'circle', cx: 120, cy: 120, r: 104 };

export const HOLE_RADIUS = 4.2;

/**
 * Furos da serrilha sobre a borda do papel, a cada ~11 px. O passo se ajusta para
 * cada lado caber um número inteiro de furos, com um furo em cada canto.
 */
export function perforationHoles(shape: PaperShape, step = 11): Array<{ cx: number; cy: number }> {
  const round = (n: number) => Math.round(n * 100) / 100;
  if (shape.kind === 'circle') {
    const count = Math.max(8, Math.round((2 * Math.PI * shape.r) / step));
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI;
      return { cx: round(shape.cx + shape.r * Math.cos(angle)), cy: round(shape.cy + shape.r * Math.sin(angle)) };
    });
  }
  const { x, y, w, h } = shape;
  const across = Math.max(1, Math.round(w / step));
  const down = Math.max(1, Math.round(h / step));
  const holes: Array<{ cx: number; cy: number }> = [];
  for (let i = 0; i < across; i++) holes.push({ cx: round(x + (i * w) / across), cy: y });
  for (let i = 0; i < down; i++) holes.push({ cx: x + w, cy: round(y + (i * h) / down) });
  for (let i = 0; i < across; i++) holes.push({ cx: round(x + w - (i * w) / across), cy: y + h });
  for (let i = 0; i < down; i++) holes.push({ cx: x, cy: round(y + h - (i * h) / down) });
  return holes;
}
