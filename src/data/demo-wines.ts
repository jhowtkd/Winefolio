import type { WineEntry } from '../domain/wine-entry';
import { createEntry } from '../domain/wine-factory';

export function getDemoWines(now: Date = new Date()): WineEntry[] {
  const t = now.getTime();

  const demo1 = createEntry('demo-catena-zapata', now);
  demo1.produtor = 'Catena Zapata';
  demo1.vinho = 'Malbec Argentino';
  demo1.safra = '2020';
  demo1.uvas = 'Malbec';
  demo1.tipo = 'tranquilo';
  demo1.estilo = 'tinto';
  demo1.origin = { countryCode: 'AR', region: 'Mendoza, Vale do Uco' };
  demo1.regiaoPais = 'Mendoza, Vale do Uco - Argentina';
  demo1.occasion = 'Jantar com amigos';
  demo1.favorite = true;
  demo1.aromaTags = ['Ameixa preta', 'Violeta', 'Baunilha', 'Tabaco'];
  demo1.visual = {
    limpidez: 'Límpido',
    transparencia: 'Opaco',
    intensidade: 'Profunda',
    corNucleoBorda: 'Rubi violáceo profundo com halo granada sutil',
    corHex: '#581825',
  };
  demo1.olfato = {
    condicao: 'Limpo',
    intensidade: 'Pronunciada',
    aromas: 'Frutas negras maduras, ameixa, mirtilo, notas florais de violeta e especiarias doces tostadas.',
    desenvolvimento: 'Em evolução',
  };
  demo1.paladar = {
    docura: 'Seco',
    acidez: 'Média (+)',
    tanino: 'Alto e aveludado',
    aromasBoca: 'Frutas escuras concentradas e cedro com final longo.',
    corpo: 'Encorpado',
    alcool: 'Alto (14.5%)',
    retrogosto: 'Frutado e especiado persistente',
    persistencia: 'Longa (10+ segundos)',
  };
  demo1.conclusao = {
    guarda: 'Beber agora ou guardar por até 10 anos',
    preco: 'Premium',
    qualidade: 'Excelente',
    avaliacaoEstrelas: 5,
    harmonizacao: 'Bife de chorizo na brasa ou carnes de caça com cogumelos.',
    impressaoFinal: 'Vinho com profundidade excepcional, equilíbrio notável entre fruta vibrante e madeira integrada.',
  };
  demo1.kind = 'demo';
  demo1.sourceFormat = 'demo';
  demo1._demo = true;
  demo1.provenance = { 'conclusao.impressaoFinal': 'demo' };

  const demo2 = createEntry('demo-cave-geisse', now);
  demo2.produtor = 'Cave Geisse';
  demo2.vinho = 'Brut 24 Meses';
  demo2.safra = '2021';
  demo2.uvas = 'Chardonnay (50%), Pinot Noir (50%)';
  demo2.tipo = 'espumante';
  demo2.estilo = null;
  demo2.origin = { countryCode: 'BR', region: 'Pinto Bandeira, RS' };
  demo2.regiaoPais = 'Pinto Bandeira, RS - Brasil';
  demo2.occasion = 'Celebração de fim de ano';
  demo2.favorite = true;
  demo2.aromaTags = ['Brioche', 'Maçã verde', 'Amêndoas', 'Cítrico'];
  demo2.visual = {
    limpidez: 'Cristalino',
    transparencia: 'Límpido',
    intensidade: 'Média',
    corNucleoBorda: 'Amarelo palha com reflexos dourados',
    corHex: '#F3E5AB',
    perlage: 'Muito fina, abundante e persistente',
  };
  demo2.olfato = {
    condicao: 'Limpo',
    intensidade: 'Média (+)',
    aromas: 'Pão tostado, fermento fresco, maçã assada e raspas de limão siciliano.',
    desenvolvimento: 'Em evolução',
  };
  demo2.paladar = {
    docura: 'Brut',
    acidez: 'Alta e refrescante',
    tanino: 'Ausente',
    aromasBoca: 'Cremosidade marcante com acidez cítrica viva.',
    corpo: 'Médio',
    alcool: 'Médio (12.5%)',
    retrogosto: 'Fresco com nota mineral salina',
    persistencia: 'Média a longa',
  };
  demo2.conclusao = {
    guarda: 'Pronto para consumo',
    preco: 'Médio',
    qualidade: 'Excelente',
    avaliacaoEstrelas: 4,
    harmonizacao: 'Ostras frescas, vieiras grelhadas ou queijo brie folhado.',
    impressaoFinal: 'Espumante de método tradicional exemplar, perlage cremosa e acidez vibrante com autêntico terroir de altitude.',
  };
  demo2.kind = 'demo';
  demo2.sourceFormat = 'demo';
  demo2._demo = true;
  demo2.provenance = { 'conclusao.impressaoFinal': 'demo' };

  const demo3 = createEntry('demo-chablis-saint-martin', now);
  demo3.produtor = 'Domaine Laroche';
  demo3.vinho = 'Chablis Saint Martin';
  demo3.safra = '2022';
  demo3.uvas = 'Chardonnay (100%)';
  demo3.tipo = 'tranquilo';
  demo3.estilo = 'branco';
  demo3.origin = { countryCode: 'FR', region: 'Borgonha' };
  demo3.regiaoPais = 'Chablis, Borgonha - França';
  demo3.occasion = 'Degustação comparativa de brancos';
  demo3.favorite = false;
  demo3.aromaTags = ['Giz', 'Limão', 'Pera', 'Pederneira'];
  demo3.visual = {
    limpidez: 'Cristalino',
    transparencia: 'Translúcido',
    intensidade: 'Pálida',
    corNucleoBorda: 'Amarelo esverdeado brilhante',
    corHex: '#EAE6B2',
  };
  demo3.olfato = {
    condicao: 'Limpo',
    intensidade: 'Média (+)',
    aromas: 'Mineralidade estrita de giz, limão meyer, flor branca e sutil nota de maçã verde.',
    desenvolvimento: 'Jovem',
  };
  demo3.paladar = {
    docura: 'Seco',
    acidez: 'Alta e cortante',
    tanino: 'Ausente',
    aromasBoca: 'Tensão cítrica e salinidade mineral persistente.',
    corpo: 'Médio (-)',
    alcool: 'Médio (12.5%)',
    retrogosto: 'Seco, mineral e calcário',
    persistencia: 'Longa',
  };
  demo3.conclusao = {
    guarda: 'Consumir em 3 a 5 anos',
    preco: 'Alto',
    qualidade: 'Muito Boa',
    avaliacaoEstrelas: 4,
    harmonizacao: 'Frutos do mar crus, linguado ao vapor com ervas ou queijo de cabra.',
    impressaoFinal: 'Pureza varietal sem madeira, expressando com precisão o solo kimmeridgiano de Chablis.',
  };
  demo3.kind = 'demo';
  demo3.sourceFormat = 'demo';
  demo3._demo = true;
  demo3.provenance = { 'conclusao.impressaoFinal': 'demo' };

  return [demo1, demo2, demo3];
}
