export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type LabelRequest =
  | { ok: true; mimeType: string; data: string }
  | { ok: false; status: 400 | 413 | 415; error: string };

export function parseLabelRequest(body: unknown): LabelRequest {
  const raw = (body as { imageBase64?: unknown } | null)?.imageBase64;
  if (typeof raw !== 'string' || !raw) {
    return { ok: false, status: 400, error: 'Nenhuma imagem foi enviada.' };
  }
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(raw);
  const mimeType = match ? match[1] : 'image/jpeg';
  const data = match ? match[2] : raw;
  if (!ALLOWED_TYPES.has(mimeType)) {
    return { ok: false, status: 415, error: 'Envie uma foto em JPG, PNG ou WEBP.' };
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    return { ok: false, status: 400, error: 'A imagem enviada está corrompida.' };
  }
  if (Math.floor((data.length * 3) / 4) > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, error: 'A foto é grande demais. Tente outra.' };
  }
  return { ok: true, mimeType, data };
}
