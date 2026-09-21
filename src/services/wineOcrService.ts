export interface AnalyzedWineLabel {
  produtor: string;
  vinho: string;
  safra?: string;
  uvas?: string;
  regiaoPais?: string;
  tipo?: 'tranquilo' | 'espumante' | 'licoroso' | 'fortificado' | 'sobremesa';
  estilo?: 'tinto' | 'branco' | 'rose';
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

export async function analyzeWineLabelPhoto(imageBase64: string): Promise<AnalyzedWineLabel> {
  const response = await fetch('/api/analyze-wine-label', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 }),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Não foi possível ler as informações do rótulo.');
  }

  return json.data as AnalyzedWineLabel;
}
