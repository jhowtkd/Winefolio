export function appendDictation(current: string, chunk: string): string {
  const next = chunk.trim();
  const base = current.trim();
  if (!next) return base;
  if (!base) return next;
  return `${base} ${next}`;
}
