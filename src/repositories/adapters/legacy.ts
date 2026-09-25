import type { WineEntry, EntryDraft } from '../../domain/wine-entry';
import { createEntry } from '../../domain/wine-factory';
import { upgradeToV3 } from '../../domain/asi-convert';

export interface LegacyImportResult {
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

export function adaptLegacy(value: unknown, now: Date = new Date()): LegacyImportResult {
  const warnings: string[] = [];
  const entries: WineEntry[] = [];
  const photos: Array<{ id: string; blob: Blob }> = [];

  if (!Array.isArray(value)) {
    throw new Error('Formato legado inválido: esperado um array de fichas.');
  }

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      warnings.push('Item inválido ignorado.');
      continue;
    }

    const legacy = item as any;
    const id = typeof legacy.id === 'string' && legacy.id ? legacy.id : `wine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const entry = createEntry(id, now);

    entry.produtor = String(legacy.produtor || '').trim();
    entry.vinho = String(legacy.vinho || '').trim();
    entry.safra = String(legacy.safra || '').trim();
    entry.uvas = String(legacy.uvas || '').trim();
    entry.regiaoPais = String(legacy.regiaoPais || '').trim();
    entry.tags = Array.isArray(legacy.tags) ? legacy.tags.map(String) : [];
    entry.dataDegustacao = String(legacy.dataDegustacao || entry.dataDegustacao);
    entry.criadoEm = typeof legacy.criadoEm === 'number' ? legacy.criadoEm : entry.criadoEm;
    entry.atualizadoEm = typeof legacy.atualizadoEm === 'number' ? legacy.atualizadoEm : entry.atualizadoEm;

    entry.kind = 'legacy';
    entry.sourceFormat = 'app-v1';

    // Se possui foto em base64, converte em Blob e associa
    if (typeof legacy.fotoRotulo === 'string' && legacy.fotoRotulo.startsWith('data:image/')) {
      const blob = dataUrlToBlob(legacy.fotoRotulo);
      if (blob) {
        const photoKey = `photo-${id}`;
        entry.photoId = photoKey;
        photos.push({ id: photoKey, blob });
      } else {
        warnings.push(`Foto de "${entry.produtor || entry.vinho || id}" com base64 inválido.`);
      }
    }

    // A versão 1 gravava a análise sensorial em texto livre, como a versão 2.
    const stars = legacy.conclusao?.avaliacaoEstrelas;
    const upgraded = upgradeToV3({
      ...entry,
      schemaVersion: 2,
      tipo: legacy.tipo,
      estilo: legacy.estilo,
      visual: legacy.visual ?? {},
      olfato: legacy.olfato ?? {},
      paladar: legacy.paladar ?? {},
      conclusao: {
        ...legacy.conclusao,
        avaliacaoEstrelas: typeof stars === 'number' && stars >= 1 && stars <= 5 ? stars : null,
      },
      temperaturaServico: legacy.temperaturaServico,
      decantacao: legacy.decantacao,
    }) as WineEntry;

    entries.push(upgraded);
  }

  return {
    entries,
    draft: null,
    photos,
    warnings,
  };
}
