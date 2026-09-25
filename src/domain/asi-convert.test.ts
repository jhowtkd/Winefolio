import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  convertAlcohol,
  convertColour,
  convertFinish,
  convertTannin,
  parseAgeing,
  parseDecant,
  parseTemperature,
  upgradeToV3,
} from './asi-convert.js';
import { WineEntrySchema } from './wine-schema.js';

/** Uma ficha gravada pela versão 2 do app, com as opções antigas. */
function v2(overrides: Record<string, any> = {}) {
  return {
    id: 'wine-1',
    schemaVersion: 2,
    revision: 3,
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
      aromas: 'Maçã madura / Casca de pêssego',
      desenvolvimento: 'Primário',
    },
    paladar: {
      docura: 'Seco',
      acidez: 'Média+',
      tanino: 'Baixo',
      aromasBoca: 'Cítrico',
      corpo: 'Médio',
      alcool: 'Equilibrado (13%)',
      retrogosto: 'Mineral',
      persistencia: 'Média (4-7s)',
    },
    conclusao: {
      guarda: 'Pronto',
      preco: 'R$ 150',
      qualidade: 'Boa',
      avaliacaoEstrelas: 4,
      harmonizacao: 'Frango caipira',
      impressaoFinal: 'Versátil.',
    },
    tags: ['Dia a Dia'],
    dataDegustacao: '2024-09-09',
    temperaturaServico: '10°C - 12°C',
    decantacao: 'Não necessita (servir fresco)',
    criadoEm: 1725894000000,
    atualizadoEm: 1725894000000,
    kind: 'personal',
    sourceFormat: 'native-v2',
    favorite: true,
    occasion: 'Almoço',
    origin: { countryCode: 'AR', region: 'Mendoza' },
    aromaTags: ['Maçã madura'],
    photoId: 'photo-wine-1',
    provenance: { temperaturaServico: 'ai-unverified', 'conclusao.guarda': 'user' },
    evidence: { noteAuthoredAt: 1, aromasAuthoredAt: null, originConfirmedAt: null, revisitedAt: null },
    importMetadata: {},
    ...overrides,
  };
}

describe('upgradeToV3', () => {
  it('converte uma ficha com as opções antigas numa ficha v3 válida', () => {
    const next = upgradeToV3(v2());
    const parsed = WineEntrySchema.safeParse(next);
    assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
    assert.strictEqual(next.schemaVersion, 3);

    assert.deepStrictEqual(
      [next.visual.clarity, next.visual.intensity, next.visual.coreColour, next.visual.corHex],
      ['clear', 'low', 'straw', '#F3E99F']
    );
    assert.deepStrictEqual(
      [next.olfato.condition, next.olfato.intensity, next.olfato.maturity],
      ['clean', 'high', 'youthful']
    );
    assert.deepStrictEqual(
      [next.paladar.sweetness, next.paladar.tanninLevel, next.paladar.body, next.paladar.alcohol, next.paladar.abv, next.paladar.finish],
      ['dry', 'low', 'medium', 'medium', '13%', 'medium']
    );
    assert.strictEqual(next.conclusao.ageing, 'now');
    assert.deepStrictEqual(next.servico.temperature, { min: 10, max: 12 });
    assert.strictEqual(next.servico.decant, 'no');
  });

  it('guarda o que não tem equivalente na grade, sem inventar valor', () => {
    const next = upgradeToV3(v2());
    assert.strictEqual(next.paladar.acidity, null);
    assert.deepStrictEqual(next.legacyNotes, {
      'visual.transparencia': 'Translúcido',
      'paladar.acidity': 'Média+',
      'conclusao.asiQuality': 'Boa',
    });
  });

  it('mantém identidade, texto livre, foto e evidência', () => {
    const next = upgradeToV3(v2());
    assert.strictEqual(next.revision, 3);
    assert.strictEqual(next.favorite, true);
    assert.strictEqual(next.photoId, 'photo-wine-1');
    assert.strictEqual(next.olfato.aromas, 'Maçã madura / Casca de pêssego');
    assert.strictEqual(next.paladar.aromasBoca, 'Cítrico');
    assert.strictEqual(next.paladar.retrogosto, 'Mineral');
    assert.strictEqual(next.conclusao.impressaoFinal, 'Versátil.');
    assert.strictEqual(next.conclusao.avaliacaoEstrelas, 4);
    assert.deepStrictEqual(next.aromaTags, ['Maçã madura']);
    assert.strictEqual('temperaturaServico' in next, false);
    assert.strictEqual('decantacao' in next, false);
  });

  it('renomeia a procedência para os campos novos', () => {
    const next = upgradeToV3(v2());
    assert.deepStrictEqual(next.provenance, { 'servico.temperature': 'ai-unverified', 'conclusao.ageing': 'user' });
  });

  it('converte o estilo "laranja" em branco com contato com as cascas', () => {
    const next = upgradeToV3(v2({ estilo: 'laranja', visual: {} }));
    assert.strictEqual(next.estilo, 'branco');
    assert.strictEqual(next.skinContact, true);
  });

  it('aceita ficha com campos faltando, como a do protótipo', () => {
    const next = upgradeToV3({ id: 'x', schemaVersion: 2, tipo: 'espumante', estilo: null });
    assert.strictEqual(next.tipo, 'espumante');
    assert.deepStrictEqual(next.legacyNotes, {});
    assert.strictEqual(next.visual.coreColour, null);
  });

  it('guarda o tanino "Nulo / Não tem", que a grade não representa', () => {
    const next = upgradeToV3(v2({ paladar: { tanino: 'Nulo / Não tem' } }));
    assert.strictEqual(next.paladar.tanninLevel, null);
    assert.strictEqual(next.legacyNotes['paladar.tanninLevel'], 'Nulo / Não tem');
  });

  it('não confunde cor de outro estilo', () => {
    const next = upgradeToV3(v2({ estilo: 'tinto', visual: { corNucleoBorda: 'Palha' } }));
    assert.strictEqual(next.visual.coreColour, null);
    assert.strictEqual(next.legacyNotes['visual.coreColour'], 'Palha');
  });

  it('rodar duas vezes não muda nada', () => {
    const once = upgradeToV3(v2());
    const twice = upgradeToV3({ ...v2(), ...once, schemaVersion: 2 });
    assert.deepStrictEqual(twice.legacyNotes, once.legacyNotes);
  });
});

describe('conversões por campo', () => {
  it('tanino', () => {
    assert.deepStrictEqual(convertTannin('Alto e sedoso')?.value, { level: 'high', quality: ['silky'] });
    assert.deepStrictEqual(convertTannin('Sedoso')?.value, { level: null, quality: ['silky'] });
    assert.deepStrictEqual(convertTannin('Nulo / Não tem'), { value: { level: null, quality: [] }, lossless: false });
    assert.strictEqual(convertTannin('Médio+'), null);
    assert.strictEqual(convertTannin('Adstringente'), null);
  });

  it('cor', () => {
    assert.strictEqual(convertColour('Púrpura / Violáceo', 'tinto')?.value, 'purple');
    assert.strictEqual(convertColour('Alaranjado / Tijolo', 'tinto')?.value, 'tawny');
    assert.strictEqual(convertColour('Rosa Salmão', null)?.value, 'salmon');
    assert.strictEqual(convertColour('Rosa Cereja', 'rose'), null);
    assert.strictEqual(convertColour('Púrpura / Rubi intenso', 'tinto'), null);
  });

  it('final', () => {
    assert.strictEqual(convertFinish('Curta (1-3s)')?.value, 'short');
    assert.strictEqual(convertFinish('Longa (8s+)')?.value, 'long');
    assert.strictEqual(convertFinish('Média')?.value, 'medium');
  });

  it('álcool', () => {
    assert.deepStrictEqual(convertAlcohol('Alto (14.5%)'), { value: { level: 'high', abv: '14,5%' }, lossless: true });
    assert.deepStrictEqual(convertAlcohol('14%'), { value: { level: null, abv: '14%' }, lossless: true });
    assert.deepStrictEqual(convertAlcohol('Potente e aveludado (15.5%)'), {
      value: { level: null, abv: '15,5%' },
      lossless: false,
    });
    assert.strictEqual(convertAlcohol('Potente'), null);
  });

  it('temperatura', () => {
    assert.deepStrictEqual(parseTemperature('16°C - 18°C')?.value, { min: 16, max: 18 });
    assert.deepStrictEqual(parseTemperature('16-18')?.value, { min: 16, max: 18 });
    assert.deepStrictEqual(parseTemperature('12 °C')?.value, { min: 12, max: 12 });
    assert.deepStrictEqual(parseTemperature('12,5°C - 14°C')?.value, { min: 12.5, max: 14 });
    assert.strictEqual(parseTemperature('Temperatura ambiente'), null);
  });

  it('decantação', () => {
    assert.deepStrictEqual(parseDecant('Não necessita'), { value: 'no', lossless: true });
    assert.deepStrictEqual(parseDecant('1 hora em decanter'), { value: 'aerate', lossless: false });
    assert.deepStrictEqual(parseDecant('45 min'), { value: 'aerate', lossless: false });
    assert.strictEqual(parseDecant('Sim'), null);
  });

  it('guarda em faixas de 3 anos', () => {
    assert.deepStrictEqual(parseAgeing('Pronto'), { value: 'now', lossless: true });
    assert.deepStrictEqual(parseAgeing('Beber ou guardar 2-3 anos'), { value: '0-3', lossless: true });
    assert.deepStrictEqual(parseAgeing('Beber ou guardar 3-5 anos'), { value: '3-6', lossless: false });
    assert.deepStrictEqual(parseAgeing('Longa guarda (5-10 anos)'), { value: '9-12', lossless: false });
    assert.deepStrictEqual(parseAgeing('20 anos'), { value: '15+', lossless: true });
    assert.deepStrictEqual(parseAgeing('Longa guarda (10+ anos)'), { value: '9-12', lossless: false });
    assert.deepStrictEqual(parseAgeing('Mais de 5 anos'), { value: '3-6', lossless: false });
    assert.deepStrictEqual(parseAgeing('20+ anos'), { value: '15+', lossless: true });
    assert.strictEqual(parseAgeing('Passado'), null);
  });
});
