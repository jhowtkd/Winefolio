import type { WineEntry, EntryDraft } from '../../domain/wine-entry';
import { createEntry } from '../../domain/wine-factory';

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
    entry.tipo = legacy.tipo || null;
    entry.estilo = legacy.estilo || null;

    if (legacy.visual) {
      entry.visual = {
        limpidez: String(legacy.visual.limpidez || ''),
        transparencia: String(legacy.visual.transparencia || ''),
        intensidade: String(legacy.visual.intensidade || ''),
        corNucleoBorda: String(legacy.visual.corNucleoBorda || ''),
        corHex: legacy.visual.corHex,
        perlage: legacy.visual.perlage,
      };
    }

    if (legacy.olfato) {
      entry.olfato = {
        condicao: String(legacy.olfato.condicao || ''),
        intensidade: String(legacy.olfato.intensidade || ''),
        aromas: String(legacy.olfato.aromas || ''),
        desenvolvimento: String(legacy.olfato.desenvolvimento || ''),
      };
    }

    if (legacy.paladar) {
      entry.paladar = {
        docura: String(legacy.paladar.docura || ''),
        acidez: String(legacy.paladar.acidez || ''),
        tanino: String(legacy.paladar.tanino || ''),
        aromasBoca: String(legacy.paladar.aromasBoca || ''),
        corpo: String(legacy.paladar.corpo || ''),
        alcool: String(legacy.paladar.alcool || ''),
        retrogosto: String(legacy.paladar.retrogosto || ''),
        persistencia: String(legacy.paladar.persistencia || ''),
      };
    }

    if (legacy.conclusao) {
      entry.conclusao = {
        guarda: String(legacy.conclusao.guarda || ''),
        preco: String(legacy.conclusao.preco || ''),
        qualidade: String(legacy.conclusao.qualidade || ''),
        avaliacaoEstrelas: typeof legacy.conclusao.avaliacaoEstrelas === 'number' && legacy.conclusao.avaliacaoEstrelas >= 1 && legacy.conclusao.avaliacaoEstrelas <= 5
          ? (legacy.conclusao.avaliacaoEstrelas as any)
          : null,
        harmonizacao: String(legacy.conclusao.harmonizacao || ''),
        impressaoFinal: String(legacy.conclusao.impressaoFinal || ''),
      };
    }

    entry.tags = Array.isArray(legacy.tags) ? legacy.tags.map(String) : [];
    entry.dataDegustacao = String(legacy.dataDegustacao || entry.dataDegustacao);
    entry.temperaturaServico = legacy.temperaturaServico ? String(legacy.temperaturaServico) : undefined;
    entry.decantacao = legacy.decantacao ? String(legacy.decantacao) : undefined;
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

    entries.push(entry);
  }

  return {
    entries,
    draft: null,
    photos,
    warnings,
  };
}
