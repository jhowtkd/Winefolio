import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max).optional().catch(undefined);

export const LabelAnalysisSchema = z.object({
  produtor: text(300),
  vinho: text(300),
  safra: text(50),
  uvas: text(300),
  regiaoPais: text(300),
  tipo: text(40),
  estilo: text(40),
  alcool: text(100),
  temperaturaServico: text(100),
  decantacao: text(100),
  potencialGuarda: text(100),
  aromasSugeridos: text(2000),
  harmonizacaoSugerida: text(2000),
  qualidadeEstimada: text(100),
  corHexSugerida: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().catch(undefined),
  resumo: text(2000),
});
