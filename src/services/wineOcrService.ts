import type { LabelAnalysis } from '../domain/label-fill';

export type AnalyzedWineLabel = LabelAnalysis;

export async function analyzeWineLabelPhoto(imageBase64: string): Promise<AnalyzedWineLabel> {
  const response = await fetch('/api/analyze-wine-label', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 }),
  });

  let json: { success?: boolean; error?: string; data?: AnalyzedWineLabel } = {};
  try {
    json = await response.json();
  } catch {
    // Corpo não-JSON (erro de infraestrutura): cai na mensagem padrão.
  }

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Não foi possível ler as informações do rótulo.');
  }

  return json.data as AnalyzedWineLabel;
}
