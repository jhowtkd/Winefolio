import type { WineEntry } from './wine-entry';
import { ASI_QUALITY } from './asi-vocabulary';

export type PassportMode = 'mine' | 'demo';

export interface PassportMilestoneDef {
  id: string;
  key: string;
  title: string;
  description: string;
}

export const PASSPORT_MILESTONES: readonly PassportMilestoneDef[] = [
  {
    id: 'legado.first',
    key: 'first',
    title: 'Primeira página',
    description: 'Uma impressão pessoal guardada, do seu jeito.',
  },
  {
    id: 'legado.vocabulary',
    key: 'vocabulary',
    title: 'Meu vocabulário',
    description: 'Um aroma descrito com as suas próprias referências.',
  },
  {
    id: 'legado.revisited',
    key: 'revisited',
    title: 'Memória revisitada',
    description: 'Uma nova observação acrescentada a uma ficha sua.',
  },
  {
    id: 'legado.origin',
    key: 'origin',
    title: 'Origem registrada',
    description: 'O país de um rótulo confirmado no caderno.',
  },
  {
    id: 'estilo.primeiro-espumante',
    key: 'estilo.primeiro-espumante',
    title: 'Primeiras bolhas',
    description: 'Um espumante registrado no caderno.',
  },
  {
    id: 'estilo.laranja',
    key: 'estilo.laranja',
    title: 'Pele e alma',
    description: 'Um vinho branco com contato com as cascas (laranja) registrado.',
  },
  {
    id: 'estilo.fortificado',
    key: 'estilo.fortificado',
    title: 'Espírito fortificado',
    description: 'Um vinho fortificado registrado no caderno.',
  },
  {
    id: 'harmonizacao.1',
    key: 'harmonizacao.1',
    title: 'À mesa',
    description: 'Uma harmonização anotada na conclusão da ficha.',
  },
  {
    id: 'critica.primeira-nota',
    key: 'critica.primeira-nota',
    title: 'Primeira opinião',
    description: 'Uma avaliação de 1 a 5 estrelas atribuída a um vinho.',
  },
  {
    id: 'critica.cinco',
    key: 'critica.cinco',
    title: 'Amor à primeira taça',
    description: 'Uma avaliação máxima de 5 estrelas atribuída a um vinho.',
  },
  {
    id: 'critica.asi-1',
    key: 'critica.asi-1',
    title: 'Olhar técnico',
    description: 'Uma avaliação com a escala de qualidade ASI registrada.',
  },
] as const;

function isFieldVerified(entry: WineEntry, ...paths: string[]): boolean {
  if (!entry.provenance) return true;
  return paths.every((path) => entry.provenance?.[path] !== 'ai-unverified');
}

export const PASSPORT_ENTRY_RULES = {
  'legado.first': (entry) => Boolean(entry.conclusao?.impressaoFinal?.trim()),
  'legado.vocabulary': (entry) => Boolean(entry.aromaTags?.some((tag) => Boolean(tag.trim()))),
  'legado.revisited': (entry) => Boolean(entry.evidence?.revisitedAt),
  'legado.origin': (entry) => Boolean(entry.origin?.countryCode) && entry.origin.countryCode !== 'other',
  'estilo.primeiro-espumante': (entry) => entry.tipo === 'espumante' && isFieldVerified(entry, 'tipo'),
  'estilo.laranja': (entry) =>
    entry.estilo === 'branco' &&
    entry.skinContact === true &&
    isFieldVerified(entry, 'estilo', 'skinContact'),
  'estilo.fortificado': (entry) => entry.tipo === 'fortificado' && isFieldVerified(entry, 'tipo'),
  'harmonizacao.1': (entry) =>
    Boolean(entry.conclusao?.harmonizacao?.trim()) &&
    isFieldVerified(entry, 'conclusao.harmonizacao', 'harmonizacao'),
  'critica.primeira-nota': (entry) => {
    const stars = entry.conclusao?.avaliacaoEstrelas;
    return (
      typeof stars === 'number' &&
      Number.isInteger(stars) &&
      stars >= 1 &&
      stars <= 5 &&
      isFieldVerified(entry, 'conclusao.avaliacaoEstrelas', 'avaliacaoEstrelas')
    );
  },
  'critica.cinco': (entry) => {
    const stars = entry.conclusao?.avaliacaoEstrelas;
    return (
      stars === 5 &&
      isFieldVerified(entry, 'conclusao.avaliacaoEstrelas', 'avaliacaoEstrelas')
    );
  },
  'critica.asi-1': (entry) =>
    ASI_QUALITY.some((opt) => opt.code === entry.conclusao?.asiQuality) &&
    isFieldVerified(entry, 'conclusao.asiQuality', 'asiQuality'),
} satisfies Record<string, (entry: WineEntry) => boolean>;

export function passportProgress(entries: WineEntry[], mode: PassportMode = 'mine') {
  const records = entries.filter((entry) => {
    const demo = entry.kind === 'demo' || entry._demo === true;
    return mode === 'demo' ? demo : !demo;
  });

  const countries = new Map<string, number>();
  for (const entry of records) {
    const code = entry.origin?.countryCode;
    if (code && code !== 'other') countries.set(code, (countries.get(code) ?? 0) + 1);
  }

  const earned: Record<string, boolean> = Object.fromEntries(
    Object.entries(PASSPORT_ENTRY_RULES).map(([id, rule]) => [id, records.some(rule)])
  );

  const milestones = PASSPORT_MILESTONES.map((milestone) => ({
    ...milestone,
    earned: Boolean(earned[milestone.id]),
  }));

  return {
    countries,
    milestones,
    earnedCount: milestones.filter((milestone) => milestone.earned).length,
  };
}
