import type { WineEntry, EntryDraft, WineType, WineStyle } from '../../domain/wine-entry';
import { createEntry } from '../../domain/wine-factory';

export interface PrototypeImportResult {
  entries: WineEntry[];
  draft: EntryDraft | null;
  photos: Array<{ id: string; blob: Blob }>;
  warnings: string[];
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(';base64,');
    if (parts.length !== 2) return null;
    const mime = parts[0].replace(/^data:/, '');
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch {
    return null;
  }
}

export function adaptPrototype(value: unknown, now: Date = new Date()): PrototypeImportResult {
  const warnings: string[] = [];
  const entries: WineEntry[] = [];
  const photos: Array<{ id: string; blob: Blob }> = [];
  let draft: EntryDraft | null = null;

  if (!value || typeof value !== 'object') {
    throw new Error('Formato do protótipo inválido: esperado um objeto com registros.');
  }

  const envelope = value as any;
  const rawRecords = Array.isArray(envelope.records) ? envelope.records : [];

  for (const raw of rawRecords) {
    if (!raw || typeof raw !== 'object' || raw._demo) {
      continue;
    }

    const id = `prototype:${raw.id || Math.random().toString(36).substring(2, 7)}`;
    const entry = createEntry(id, now);

    entry.vinho = String(raw.name || '').trim();
    entry.produtor = String(raw.producer || '').trim();
    entry.safra = String(raw.vintage || '').trim();
    entry.uvas = String(raw.grape || '').trim();
    entry.origin = {
      countryCode: raw.country && raw.country !== 'other' ? String(raw.country).toUpperCase() : null,
      region: String(raw.region || '').trim(),
    };
    entry.regiaoPais = [entry.origin.region, entry.origin.countryCode].filter(Boolean).join(', ');

    if (raw.style === 'espumante') {
      entry.tipo = 'espumante';
      entry.estilo = null;
    } else if (raw.style === 'branco' || raw.style === 'tinto' || raw.style === 'rose') {
      entry.estilo = raw.style as WineStyle;
      entry.tipo = 'tranquilo';
    }

    entry.conclusao.impressaoFinal = String(raw.note || '').trim();
    entry.conclusao.avaliacaoEstrelas = typeof raw.rating === 'number' && raw.rating >= 1 && raw.rating <= 5
      ? (raw.rating as any)
      : null;

    entry.dataDegustacao = String(raw.date || entry.dataDegustacao);
    entry.occasion = String(raw.occasion || '').trim();
    entry.favorite = Boolean(raw.favorite);
    entry.aromaTags = Array.isArray(raw.aromas) ? raw.aromas.map(String) : [];
    entry.kind = 'personal';
    entry.sourceFormat = 'prototype-v1';

    if (entry.conclusao.impressaoFinal) {
      entry.evidence.noteAuthoredAt = now.getTime();
      entry.provenance['conclusao.impressaoFinal'] = 'imported-user';
    }
    if (entry.conclusao.avaliacaoEstrelas !== null) {
      entry.provenance['conclusao.avaliacaoEstrelas'] = 'imported-user';
    }
    if (entry.aromaTags.length > 0) {
      entry.evidence.aromasAuthoredAt = now.getTime();
      entry.provenance['aromaTags'] = 'imported-user';
    }
    if (entry.origin.countryCode) {
      entry.evidence.originConfirmedAt = now.getTime();
      entry.provenance['origin'] = 'imported-user';
    }

    if (typeof raw.photo === 'string' && raw.photo.startsWith('data:image/')) {
      const blob = dataUrlToBlob(raw.photo);
      if (blob) {
        const photoKey = `photo-${id}`;
        entry.photoId = photoKey;
        photos.push({ id: photoKey, blob });
      } else {
        warnings.push(`Foto de "${entry.vinho || id}" com base64 inválido.`);
      }
    }

    entries.push(entry);
  }

  return {
    entries,
    draft,
    photos,
    warnings,
  };
}
