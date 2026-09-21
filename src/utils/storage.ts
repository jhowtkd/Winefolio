import { WineTastingSheet } from '../types';
import { INITIAL_WINES } from '../data/sommelierData';

const STORAGE_KEY = 'sommelier_wine_sheets_v1';

const DEFAULT_VISUAL = {
  limpidez: 'Límpido',
  transparencia: 'Translúcido',
  intensidade: 'Média',
  corNucleoBorda: 'Rubi',
  corHex: '#83122D',
  perlage: '—',
};

const DEFAULT_OLFATO = {
  condicao: 'Limpo / Correto',
  intensidade: 'Média+',
  aromas: '',
  desenvolvimento: 'Jovem / Primário',
};

const DEFAULT_PALADAR = {
  docura: 'Seco',
  acidez: 'Média',
  tanino: 'Médio',
  aromasBoca: '',
  corpo: 'Médio',
  alcool: 'Equilibrado',
  retrogosto: '',
  persistencia: 'Média',
};

const DEFAULT_CONCLUSAO = {
  guarda: 'Pronto',
  preco: '',
  qualidade: 'Boa',
  avaliacaoEstrelas: 4,
  harmonizacao: '',
  impressaoFinal: '',
};

export function getSavedWines(): WineTastingSheet[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_WINES));
        } catch {
          // ignore quota or security error
        }
      }
      return INITIAL_WINES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((w: any) => ({
        ...w,
        id: w.id || `wine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        produtor: w.produtor || 'Vinho sem produtor',
        vinho: w.vinho || '',
        safra: w.safra || '',
        uvas: w.uvas || '',
        regiaoPais: w.regiaoPais || '',
        tipo: w.tipo || 'tranquilo',
        estilo: w.estilo || 'tinto',
        visual: { ...DEFAULT_VISUAL, ...(w.visual || {}) },
        olfato: { ...DEFAULT_OLFATO, ...(w.olfato || {}) },
        paladar: { ...DEFAULT_PALADAR, ...(w.paladar || {}) },
        conclusao: { ...DEFAULT_CONCLUSAO, ...(w.conclusao || {}) },
        tags: Array.isArray(w.tags) ? w.tags : [],
        dataDegustacao: w.dataDegustacao || new Date().toISOString().slice(0, 10),
        temperaturaServico: w.temperaturaServico || '',
        decantacao: w.decantacao || '',
        criadoEm: w.criadoEm || Date.now(),
        atualizadoEm: w.atualizadoEm || Date.now(),
      }));
    }
    return INITIAL_WINES;
  } catch (err) {
    console.error('Failed to load wines from localStorage', err);
    return INITIAL_WINES;
  }
}

export function saveWines(wines: WineTastingSheet[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wines));
    }
  } catch (err) {
    console.error('Failed to save wines to localStorage', err);
  }
}

export function exportWinesAsJson(wines: WineTastingSheet[]): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(wines, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute(
    'download',
    `minhas_fichas_de_degustacao_${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importWinesFromJson(
  jsonText: string,
  currentWines: WineTastingSheet[]
): WineTastingSheet[] {
  try {
    const imported = JSON.parse(jsonText);
    if (!Array.isArray(imported)) {
      throw new Error('Arquivo inválido: formato esperado é uma lista de vinhos.');
    }
    // Merge without duplicates based on ID
    const map = new Map<string, WineTastingSheet>();
    currentWines.forEach((w) => map.set(w.id, w));
    imported.forEach((w) => {
      if (w.id && w.produtor) {
        map.set(w.id, {
          ...w,
          tags: Array.isArray(w.tags) ? w.tags : [],
        });
      }
    });
    const result = Array.from(map.values());
    saveWines(result);
    return result;
  } catch (err) {
    console.error('Failed to import JSON', err);
    throw err;
  }
}
