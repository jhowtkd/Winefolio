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

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Não foi possível ler as informações do rótulo.');
  }

  return json.data as AnalyzedWineLabel;
}
