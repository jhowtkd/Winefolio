import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { applyLabelAnalysis, settleAiProvenance, aiSuggestedFields } from './label-fill.js';

describe('applyLabelAnalysis', () => {
  it('preenche campos vazios e não apaga o que a pessoa já escreveu', () => {
    const entry = createEntry('w1');
    entry.produtor = 'Já escrito';
    const next = applyLabelAnalysis(entry, {
      produtor: 'Outro',
      vinho: 'Don Melchor',
      safra: '2019',
      uvas: 'Cabernet Sauvignon',
      regiaoPais: 'Puente Alto, Chile',
      tipo: 'licoroso',
      estilo: 'tinto',
      alcool: '14%',
      temperaturaServico: '16°C - 18°C',
      decantacao: '45 min',
      potencialGuarda: 'Beber ou guardar 3-5 anos',
      aromasSugeridos: 'Cassis, Cedro',
      harmonizacaoSugerida: 'Cordeiro',
      qualidadeEstimada: 'Excelente',
      corHexSugerida: '#581825',
      resumo: 'Tinto de guarda.',
    });
    assert.strictEqual(next.produtor, 'Já escrito');
    assert.strictEqual(next.vinho, 'Don Melchor');
    assert.strictEqual(next.tipo, 'fortificado');
    assert.strictEqual(next.estilo, 'tinto');
    assert.strictEqual(next.paladar.abv, '14%');
    assert.deepStrictEqual(next.servico.temperature, { min: 16, max: 18 });
    assert.strictEqual(next.servico.decant, 'aerate');
    assert.strictEqual(next.conclusao.ageing, '3-6');
    assert.deepStrictEqual(next.legacyNotes, {
      'servico.decant': '45 min',
      'conclusao.ageing': 'Beber ou guardar 3-5 anos',
    });
    assert.strictEqual(next.conclusao.harmonizacao, 'Cordeiro');
    assert.strictEqual(next.conclusao.asiQuality, null);
    assert.strictEqual(next.conclusao.impressaoFinal, '');
    assert.strictEqual(next.olfato.aromas, 'Cassis, Cedro');
    assert.deepStrictEqual(next.aromaTags, ['Cassis', 'Cedro']);
    assert.strictEqual(next.visual.corHex, '#581825');
    assert.strictEqual(next.origin.countryCode, 'CL');
  });
});

describe('proveniência da leitura de rótulo', () => {
  it('marca como ai-unverified só o que a IA preencheu', () => {
    const entry = createEntry('x');
    entry.produtor = 'Meu produtor';
    const next = applyLabelAnalysis(entry, { produtor: 'Outro', vinho: 'Reserva', safra: '2020' });
    assert.strictEqual(next.produtor, 'Meu produtor');
    assert.strictEqual(next.provenance.produtor, undefined);
    assert.strictEqual(next.provenance.vinho, 'ai-unverified');
    assert.strictEqual(next.provenance.safra, 'ai-unverified');
  });

  it('não escreve a impressão final nem a qualidade', () => {
    const next = applyLabelAnalysis(createEntry('x'), { resumo: 'Texto do modelo', qualidadeEstimada: 'Excelente' });
    assert.strictEqual(next.conclusao.impressaoFinal, '');
    assert.strictEqual(next.conclusao.asiQuality, null);
  });

  it('não troca valor da grade que a pessoa já escolheu', () => {
    const entry = createEntry('x');
    entry.servico = { ...entry.servico, temperature: { min: 8, max: 10 } };
    const next = applyLabelAnalysis(entry, { temperaturaServico: '16°C - 18°C' });
    assert.deepStrictEqual(next.servico.temperature, { min: 8, max: 10 });
    assert.strictEqual(next.provenance['servico.temperature'], undefined);
  });

  it('marca como sugestão a nota que não coube na grade', () => {
    const next = applyLabelAnalysis(createEntry('x'), { temperaturaServico: 'Bem gelado' });
    assert.strictEqual(next.servico.temperature, null);
    assert.strictEqual(next.legacyNotes['servico.temperature'], 'Bem gelado');
    assert.strictEqual(next.provenance['servico.temperature'], 'ai-unverified');
  });

  it('a leitura que diz "branco" não desfaz o laranja marcado pela pessoa', () => {
    const orange = { ...createEntry('x'), estilo: 'branco' as const, skinContact: true };
    assert.strictEqual(applyLabelAnalysis(orange, { estilo: 'branco' }).skinContact, true);
    assert.strictEqual(applyLabelAnalysis(orange, { estilo: 'tinto' }).skinContact, false);
    assert.strictEqual(applyLabelAnalysis(orange, {}).skinContact, true);
  });

  it('estilo e tipo lidos do rótulo seguem as regras do editor', () => {
    const entry = { ...createEntry('x'), tipo: 'fortificado' as const, estilo: 'tinto' as const, subestilo: 'port-tawny' as const };
    entry.visual = { ...entry.visual, coreColour: 'ruby', corHex: '#83122D' };
    const next = applyLabelAnalysis(entry, { estilo: 'branco', tipo: 'tranquilo' });
    assert.deepStrictEqual([next.visual.coreColour, next.visual.corHex], [null, undefined]);
    assert.strictEqual(next.subestilo, null);
  });

  it('vinho laranja vira branco com contato com as cascas', () => {
    const next = applyLabelAnalysis(createEntry('x'), { estilo: 'laranja', tipo: 'espumante' });
    assert.deepStrictEqual([next.tipo, next.estilo, next.skinContact], ['espumante', 'branco', true]);
  });

  it('campo editado depois da leitura passa a ser da pessoa', () => {
    const filled = applyLabelAnalysis(createEntry('x'), { vinho: 'Reserva', safra: '2020' });
    const edited = { ...filled, vinho: 'Reserva Especial' };
    const settled = settleAiProvenance(edited, filled);
    assert.strictEqual(settled.provenance.vinho, 'user');
    assert.strictEqual(settled.provenance.safra, 'ai-unverified');
    assert.deepStrictEqual(aiSuggestedFields(settled), ['safra']);
  });
});
