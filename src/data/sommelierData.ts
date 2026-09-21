import { WineTastingSheet } from '../types';

export const WINE_COLORS = [
  // Brancos
  { label: 'Amarelo-esverdeado', hex: '#E4EBB2', style: 'branco' },
  { label: 'Palha', hex: '#F3E99F', style: 'branco' },
  { label: 'Amarelo Dourado', hex: '#E2BD48', style: 'branco' },
  { label: 'Âmbar', hex: '#C98A36', style: 'branco' },
  // Rosés
  { label: 'Casca de cebola', hex: '#E6AC9B', style: 'rose' },
  { label: 'Rosa Salmão', hex: '#E88B7C', style: 'rose' },
  { label: 'Rosa Cereja', hex: '#D6536D', style: 'rose' },
  // Tintos
  { label: 'Púrpura / Violáceo', hex: '#58132F', style: 'tinto' },
  { label: 'Rubi', hex: '#83122D', style: 'tinto' },
  { label: 'Granada', hex: '#6E1B24', style: 'tinto' },
  { label: 'Alaranjado / Tijolo', hex: '#773523', style: 'tinto' },
];

export const AROMA_CATEGORIES: { name: string; items: string[] }[] = [
  {
    name: 'Frutas Brancas & de Caroço',
    items: ['Maçã verde', 'Maçã madura', 'Pêra', 'Pêssego', 'Casca de pêssego', 'Damasco', 'Melão'],
  },
  {
    name: 'Frutas Cítricas & Tropicais',
    items: ['Lima da Pérsia', 'Limão siciliano', 'Casca de limão', 'Abacaxi', 'Maracujá', 'Manga', 'Goiaba'],
  },
  {
    name: 'Frutas Vermelhas & Silvestres',
    items: ['Morango', 'Framboesa', 'Cereja fresca', 'Cereja negra', 'Amora', 'Groselha', 'Mirtilo'],
  },
  {
    name: 'Frutas Negras & Maduras',
    items: ['Ameixa preta', 'Cassis', 'Frutas em compota', 'Figo maduro', 'Passas'],
  },
  {
    name: 'Flores & Vegetais',
    items: ['Flores brancas', 'Jasmim', 'Violeta', 'Rosas', 'Grama cortada', 'Pimentão verde', 'Menta / Hortelã'],
  },
  {
    name: 'Madeira & Especiarias',
    items: ['Baunilha', 'Manteiga', 'Carvalho tostado', 'Cravo', 'Canela', 'Pimenta preta', 'Noz-moscada', 'Cedro'],
  },
  {
    name: 'Complexos & Terciários',
    items: ['Mineral / Pedra molhada', 'Brioche / Pão tostado', 'Chocolate', 'Café', 'Couro', 'Tabaco', 'Mel'],
  },
];

export const LIMPIDITY_OPTIONS = ['Límpido', 'Brilhante', 'Opalescente', 'Velado', 'Turvo'];
export const TRANSPARENCY_OPTIONS = ['Translúcido', 'Transparente', 'Opaco'];
export const INTENSITY_OPTIONS = ['Baixa', 'Média-', 'Média', 'Média+', 'Alta', 'Profunda'];
export const CONDITION_OPTIONS = ['Limpo / Correto', 'Defeituoso'];
export const DEVELOPMENT_OPTIONS = ['Primário', 'Em evolução', 'Maduro / Terciário', 'Em declínio'];
export const SWEETNESS_OPTIONS = ['Seco', 'Meio-seco', 'Suave', 'Doce'];
export const ACIDITY_OPTIONS = ['Baixa', 'Média-', 'Média', 'Média+', 'Alta', 'Muito Alta'];
export const TANNIN_OPTIONS = ['Nulo / Não tem', 'Baixo', 'Médio-', 'Médio', 'Médio+', 'Alto', 'Sedoso', 'Adstringente'];
export const BODY_OPTIONS = ['Leve', 'Médio-', 'Médio', 'Médio+', 'Encorpado'];
export const PERSISTENCE_OPTIONS = ['Curta (1-3s)', 'Média (4-7s)', 'Longa (8s+)'];
export const AGING_OPTIONS = ['Pronto', 'Beber ou guardar 2-3 anos', 'Longa guarda (5-10 anos)', 'Passado'];
export const QUALITY_OPTIONS = ['Regular', 'Boa', 'Muito boa', 'Excelente', 'Excepcional'];

export const DEFAULT_TAG_SUGGESTIONS = [
  'Presente',
  'Compra Anual',
  'Encontro',
  'Jantar Especial',
  'Dia a Dia',
  'Adega / Guarda',
  'Viagem',
  'Recomendação',
  'Comemoração',
  'Degustação às Cegas',
];

export const INITIAL_WINES: WineTastingSheet[] = [
  {
    id: 'wine-terrazas-chardonnay-2024',
    produtor: 'Terrazas de los Andes',
    vinho: 'Reserva Chardonnay',
    safra: '2024',
    uvas: 'Chardonnay',
    regiaoPais: 'Mendoza - AR',
    tipo: 'tranquilo',
    estilo: 'branco',
    visual: {
      limpidez: 'Límpido',
      transparencia: 'Translúcido',
      intensidade: 'Baixa',
      corNucleoBorda: 'Palha',
      corHex: '#F3E99F',
      perlage: '—',
    },
    olfato: {
      condicao: 'Limpo / Correto',
      intensidade: 'Alta',
      aromas: 'Maçã madura / Casca de pêssego / Manteiga / Lima da Pérsia',
      desenvolvimento: 'Primário',
    },
    paladar: {
      docura: 'Seco',
      acidez: 'Alta',
      tanino: 'Baixo',
      aromasBoca: 'Casca de pêssego, cítrico',
      corpo: 'Médio',
      alcool: 'Equilibrado (13%)',
      retrogosto: 'Mineral / Abacaxi',
      persistencia: 'Média',
    },
    conclusao: {
      guarda: 'Pronto',
      preco: 'R$ 150',
      qualidade: 'Boa',
      avaliacaoEstrelas: 4,
      harmonizacao: 'Massa molho branco / Frango caipira / Queijo branco / Geléias amargas / Caesar Salad',
      impressaoFinal: 'Vinho jovem e versátil feito por uma das maiores vinícolas de Mendoza. Vinho Reserva que agrada a todos.',
    },
    tags: ['Encontro', 'Dia a Dia'],
    dataDegustacao: '2024-09-09',
    temperaturaServico: '10°C - 12°C',
    decantacao: 'Não necessita (servir fresco)',
    criadoEm: 1725894000000,
    atualizadoEm: 1725894000000,
  },
  {
    id: 'wine-alaya-tierra-2020',
    produtor: 'Bodegas Atalaya',
    vinho: 'Alaya Tierra',
    safra: '2020',
    uvas: 'Garnacha Tintorera',
    regiaoPais: 'Almansa - Espanha',
    tipo: 'tranquilo',
    estilo: 'tinto',
    visual: {
      limpidez: 'Límpido',
      transparencia: 'Opaco',
      intensidade: 'Profunda',
      corNucleoBorda: 'Púrpura / Rubi intenso',
      corHex: '#58132F',
      perlage: '—',
    },
    olfato: {
      condicao: 'Limpo / Correto',
      intensidade: 'Pronunciada',
      aromas: 'Amora silvestre / Ameixa preta / Café tostado / Baunilha / Pimenta preta',
      desenvolvimento: 'Em evolução',
    },
    paladar: {
      docura: 'Seco',
      acidez: 'Média+',
      tanino: 'Alto e sedoso',
      aromasBoca: 'Frutas negras maduras, cacau e especiarias',
      corpo: 'Encorpado',
      alcool: 'Potente e aveludado (15.5%)',
      retrogosto: 'Chocolate amargo / Cassis longo',
      persistencia: 'Longa (8s+)',
    },
    conclusao: {
      guarda: 'Pode guardar 5-8 anos',
      preco: 'R$ 380',
      qualidade: 'Excelente',
      avaliacaoEstrelas: 5,
      harmonizacao: 'Cordeiro assado, carnes de caça, risoto de cogumelos e queijos curados',
      impressaoFinal: 'Potente, estruturado e com taninos muito elegantes. Uma verdadeira expressão da Garnacha Tintorera com muita madeira nobre integrada.',
    },
    tags: ['Compra Anual', 'Presente', 'Adega / Guarda'],
    dataDegustacao: '2024-09-02',
    temperaturaServico: '16°C - 18°C',
    decantacao: '1 hora em decanter',
    criadoEm: 1725289200000,
    atualizadoEm: 1725289200000,
  },
];
