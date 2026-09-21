import type { WineEntry, WineStyle, WineType } from './wine-entry';
import { inferCountryCode } from './countries.js';

export interface LabelAnalysis {
  produtor?: string;
  vinho?: string;
  safra?: string;
  uvas?: string;
  regiaoPais?: string;
  tipo?: string;
  estilo?: string;
  alcool?: string;
  temperaturaServico?: string;
  decantacao?: string;
  potencialGuarda?: string;
  aromasSugeridos?: string;
  harmonizacaoSugerida?: string;
  qualidadeEstimada?: string;
  corHexSugerida?: string;
  resumo?: string;
}

function keep(current: string | undefined, incoming: string | undefined): string {
  if ((current || '').trim()) return current || '';
  return (incoming || '').trim();
}

function asType(value: string | undefined): WineType | null {
  if (value === 'licoroso') return 'fortificado';
  if (value === 'tranquilo' || value === 'espumante' || value === 'sobremesa' || value === 'fortificado') {
    return value;
  }
  return null;
}

function asStyle(value: string | undefined): WineStyle | null {
  if (value === 'branco' || value === 'tinto' || value === 'rose') return value;
  return null;
}

export function applyLabelAnalysis(entry: WineEntry, analysis: LabelAnalysis): WineEntry {
  const regiaoPais = keep(entry.regiaoPais, analysis.regiaoPais);
  const aromas = keep(entry.olfato.aromas, analysis.aromasSugeridos);
  const aromaTags =
    entry.aromaTags.length > 0
      ? entry.aromaTags
      : aromas
          .split(/[,;]/)
          .map((tag) => tag.trim())
          .filter(Boolean);
  const tipo = asType(analysis.tipo) ?? entry.tipo;
  const estilo = asStyle(analysis.estilo) ?? entry.estilo;
  return {
    ...entry,
    produtor: keep(entry.produtor, analysis.produtor),
    vinho: keep(entry.vinho, analysis.vinho),
    safra: keep(entry.safra, analysis.safra),
    uvas: keep(entry.uvas, analysis.uvas),
    regiaoPais,
    tipo,
    estilo: tipo === 'espumante' ? null : estilo,
    temperaturaServico: keep(entry.temperaturaServico, analysis.temperaturaServico),
    decantacao: keep(entry.decantacao, analysis.decantacao),
    origin: {
      region: regiaoPais,
      countryCode: inferCountryCode(regiaoPais) ?? entry.origin?.countryCode ?? null,
    },
    aromaTags,
    visual: { ...entry.visual, corHex: keep(entry.visual.corHex, analysis.corHexSugerida) || undefined },
    olfato: { ...entry.olfato, aromas },
    paladar: { ...entry.paladar, alcool: keep(entry.paladar.alcool, analysis.alcool) },
    conclusao: {
      ...entry.conclusao,
      guarda: keep(entry.conclusao.guarda, analysis.potencialGuarda),
      harmonizacao: keep(entry.conclusao.harmonizacao, analysis.harmonizacaoSugerida),
      qualidade: keep(entry.conclusao.qualidade, analysis.qualidadeEstimada),
      impressaoFinal: keep(entry.conclusao.impressaoFinal, analysis.resumo),
    },
  };
}
