export type WineType = 'tranquilo' | 'espumante' | 'sobremesa' | 'fortificado';
export type WineStyle = 'branco' | 'tinto' | 'rose';

export interface VisualAnalysis {
  limpidez: string; // Límpido, Brilhante, Velado, Turvo
  transparencia: string; // Transparente, Translúcido, Opaco
  intensidade: string; // Baixa, Média, Alta, Profunda
  corNucleoBorda: string; // ex: Palha, Amarelo-esverdeado, Dourado, Rubi, Granada, Púrpura, Salmão
  corHex?: string; // Cor aproximada para a taça interativa
  perlage?: string; // Para espumantes (Fineza, Quantidade, Persistência) ou "-"
}

export interface OlfatoAnalysis {
  condicao: string; // Limpo / Correto, Defeituoso
  intensidade: string; // Baixa, Média-, Média, Média+, Alta, Pronunciada
  aromas: string; // ex: Maçã madura / Casca de pêssego / Manteiga / Lima da Pérsia
  desenvolvimento: string; // Primário, Em evolução, Maduro / Terciário
}

export interface PaladarAnalysis {
  docura: string; // Seco, Meio-seco, Doce
  acidez: string; // Baixa, Média-, Média, Média+, Alta
  tanino: string; // Não tem / Nulo, Baixo, Médio, Alto, Sedoso
  aromasBoca: string; // ex: Casca de pêssego, cítrico
  corpo: string; // Leve, Médio-, Médio, Encorpado
  alcool: string; // Equilibrado (13%), Baixo, Alto, Quente
  retrogosto: string; // ex: Mineral / Abacaxi
  persistencia: string; // Curta, Média, Longa
}

export interface ConclusaoAnalysis {
  guarda: string; // Pronto, Pode guardar 2-3 anos, Guardar, Em declínio
  preco: string; // ex: R$ 150
  qualidade: string; // Boa, Muito boa, Excelente, Excepcional, Regular
  avaliacaoEstrelas: number; // 1 a 5
  harmonizacao: string; // ex: Massa molho branco / Frango caipira / Queijo branco...
  impressaoFinal: string; // ex: Vinho jovem e versátil feito por uma das maiores vinícolas...
}

export interface WineTastingSheet {
  id: string;
  produtor: string; // ex: Terrazas de los Andes
  vinho: string; // ex: Reserva Chardonnay
  safra: string; // ex: 2024
  uvas: string; // ex: Chardonnay
  regiaoPais: string; // ex: Mendoza - AR
  tipo: WineType; // Tranquilo, Espumante, Sobremesa, Fortificado
  estilo: WineStyle; // Branco, Tinto, Rosé
  visual: VisualAnalysis;
  olfato: OlfatoAnalysis;
  paladar: PaladarAnalysis;
  conclusao: ConclusaoAnalysis;
  tags?: string[]; // Tags personalizadas ex: Presente, Compra Anual, Encontro
  dataDegustacao: string; // YYYY-MM-DD
  fotoRotulo?: string; // Opcional data URL
  temperaturaServico?: string; // ex: 16°C - 18°C
  decantacao?: string; // ex: 30 minutos em decanter / Não necessita
  criadoEm: number;
  atualizadoEm: number;
}

export type ViewMode = 'cards' | 'sheet' | 'table';
