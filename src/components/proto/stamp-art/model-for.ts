import type { StampDef } from '../../../domain/stamps/rules';
import { grapeById } from '../../../domain/stamps/grape-catalog';
import { regionById } from '../../../domain/stamps/region-catalog';

export type StampModel =
  | 'gravura'
  | 'traco'
  | 'azulejo'
  | 'paisagem'
  | 'redondo'
  | 'deco'
  | 'modernismo'
  | 'camafeu';

/** Estilo gráfico de cada país. Espanha e Alemanha seguem o traço europeu. */
const MODEL_BY_COUNTRY: Record<string, StampModel> = {
  FR: 'traco',
  IT: 'traco',
  ES: 'traco',
  DE: 'traco',
  PT: 'azulejo',
  AR: 'paisagem',
  CL: 'paisagem',
  US: 'paisagem',
  AU: 'paisagem',
  NZ: 'paisagem',
  ZA: 'paisagem',
  BR: 'modernismo',
  UY: 'modernismo',
};

/** País que o selo representa: da região, da casa da uva, ou o Brasil em "Orgulho nacional". */
export function countryFor(def: StampDef): string | null {
  if (def.family === 'regiao') return regionById(def.subject ?? '')?.country ?? null;
  if (def.family === 'uva') return grapeById(def.subject ?? '')?.home ?? null;
  if (def.id === 'pais.casa') return 'BR';
  return null;
}

export function modelFor(def: StampDef): StampModel {
  switch (def.family) {
    case 'uva': {
      const grape = grapeById(def.subject ?? '');
      if (!grape || grape.color === 'branca') return 'gravura';
      return MODEL_BY_COUNTRY[grape.home] ?? 'traco';
    }
    case 'regiao':
      if (def.subject === 'borgonha') return 'gravura';
      return MODEL_BY_COUNTRY[countryFor(def) ?? ''] ?? 'traco';
    case 'pais':
      return def.id === 'pais.casa' ? 'modernismo' : 'redondo';
    case 'estilo':
    case 'harmonizacao':
      return 'deco';
    case 'critica':
    case 'tecnica':
    case 'secreto':
      return 'camafeu';
    case 'volume':
    case 'legado':
      return 'redondo';
  }
}
