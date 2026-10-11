import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { getDemoWines } from '../data/demo-wines.js';
import { createEntry } from './wine-factory.js';
import { PASSPORT_MILESTONES, passportProgress } from './passport.js';

describe('passport progress', () => {
  it('não libera selos por ficha vazia, espaços em branco ou campos inválidos', () => {
    const entry = createEntry('empty');
    entry.conclusao.impressaoFinal = '  ';
    entry.aromaTags = [' ', ''];
    entry.origin.countryCode = 'other';
    entry.conclusao.harmonizacao = '   ';
    // @ts-expect-error teste com valor inválido
    entry.conclusao.avaliacaoEstrelas = 0;
    // @ts-expect-error teste com valor inválido
    entry.conclusao.asiQuality = 'qualquer-coisa';
    entry.tipo = 'tranquilo';
    entry.estilo = 'branco';
    entry.skinContact = false;

    const progress = passportProgress([entry]);
    assert.equal(progress.earnedCount, 0);
    assert.equal(progress.countries.size, 0);
  });

  it('libera cada um dos onze selos isoladamente pelo critério específico', () => {
    const cases: Array<{ id: string; setup: (e: ReturnType<typeof createEntry>) => void }> = [
      {
        id: 'legado.first',
        setup: (e) => { e.conclusao.impressaoFinal = 'Lembrou ameixa.'; },
      },
      {
        id: 'legado.vocabulary',
        setup: (e) => { e.aromaTags = ['Frutas escuras']; },
      },
      {
        id: 'legado.revisited',
        setup: (e) => { e.evidence.revisitedAt = 12345; },
      },
      {
        id: 'legado.origin',
        setup: (e) => { e.origin.countryCode = 'BR'; },
      },
      {
        id: 'estilo.primeiro-espumante',
        setup: (e) => { e.tipo = 'espumante'; },
      },
      {
        id: 'estilo.laranja',
        setup: (e) => { e.estilo = 'branco'; e.skinContact = true; },
      },
      {
        id: 'estilo.fortificado',
        setup: (e) => { e.tipo = 'fortificado'; },
      },
      {
        id: 'harmonizacao.1',
        setup: (e) => { e.conclusao.harmonizacao = 'Queijo Canastra curado'; },
      },
      {
        id: 'critica.primeira-nota',
        setup: (e) => { e.conclusao.avaliacaoEstrelas = 3; },
      },
      {
        id: 'critica.cinco',
        // Nota 5 também ativa primeira-nota, mas testamos que cinco exige nota 5
        setup: (e) => { e.conclusao.avaliacaoEstrelas = 5; },
      },
      {
        id: 'critica.asi-1',
        setup: (e) => { e.conclusao.asiQuality = 'very-good'; },
      },
    ];

    for (const testCase of cases) {
      const entry = createEntry(`test-${testCase.id}`);
      testCase.setup(entry);
      const progress = passportProgress([entry]);
      const earnedIds = progress.milestones.filter((m) => m.earned).map((m) => m.id);
      if (testCase.id === 'critica.cinco') {
        assert.deepEqual(earnedIds.sort(), ['critica.cinco', 'critica.primeira-nota'].sort());
      } else {
        assert.deepEqual(earnedIds, [testCase.id], `Falha ao isolar ${testCase.id}`);
      }
    }
  });

  it('valida regras específicas de estilo laranja e de notas de avaliação', () => {
    // Tinto com skinContact não é estilo.laranja
    const tintoContact = createEntry('tinto-contact');
    tintoContact.estilo = 'tinto';
    tintoContact.skinContact = true;
    assert.equal(passportProgress([tintoContact]).milestones.find((m) => m.id === 'estilo.laranja')?.earned, false);

    // Branco sem skinContact não é estilo.laranja
    const brancoNoContact = createEntry('branco-no-contact');
    brancoNoContact.estilo = 'branco';
    brancoNoContact.skinContact = false;
    assert.equal(passportProgress([brancoNoContact]).milestones.find((m) => m.id === 'estilo.laranja')?.earned, false);

    // Avaliação 4 ganha primeira-nota, mas não ganha critica.cinco
    const quatro = createEntry('quatro');
    quatro.conclusao.avaliacaoEstrelas = 4;
    const progressQuatro = passportProgress([quatro]);
    assert.equal(progressQuatro.milestones.find((m) => m.id === 'critica.primeira-nota')?.earned, true);
    assert.equal(progressQuatro.milestones.find((m) => m.id === 'critica.cinco')?.earned, false);

    // Avaliações inválidas (0, 6, número não inteiro)
    for (const invalidRating of [0, 6, 2.5]) {
      const entry = createEntry(`invalid-${invalidRating}`);
      // @ts-expect-error teste com valor inválido
      entry.conclusao.avaliacaoEstrelas = invalidRating;
      const progress = passportProgress([entry]);
      assert.equal(progress.milestones.find((m) => m.id === 'critica.primeira-nota')?.earned, false);
      assert.equal(progress.milestones.find((m) => m.id === 'critica.cinco')?.earned, false);
    }
  });

  it('campos com proveniência ai-unverified não liberam novos selos na coleção pessoal', () => {
    const unverifiedEspumante = createEntry('uv-espumante');
    unverifiedEspumante.tipo = 'espumante';
    unverifiedEspumante.provenance = { tipo: 'ai-unverified' };
    assert.equal(passportProgress([unverifiedEspumante]).milestones.find((m) => m.id === 'estilo.primeiro-espumante')?.earned, false);

    // Confirmado pelo usuário libera
    unverifiedEspumante.provenance = { tipo: 'user' };
    assert.equal(passportProgress([unverifiedEspumante]).milestones.find((m) => m.id === 'estilo.primeiro-espumante')?.earned, true);

    const unverifiedLaranja = createEntry('uv-laranja');
    unverifiedLaranja.estilo = 'branco';
    unverifiedLaranja.skinContact = true;
    unverifiedLaranja.provenance = { estilo: 'ai-unverified' };
    assert.equal(passportProgress([unverifiedLaranja]).milestones.find((m) => m.id === 'estilo.laranja')?.earned, false);

    unverifiedLaranja.provenance = { skinContact: 'ai-unverified' };
    assert.equal(passportProgress([unverifiedLaranja]).milestones.find((m) => m.id === 'estilo.laranja')?.earned, false);

    unverifiedLaranja.provenance = { estilo: 'user', skinContact: 'user' };
    assert.equal(passportProgress([unverifiedLaranja]).milestones.find((m) => m.id === 'estilo.laranja')?.earned, true);

    const unverifiedFortificado = createEntry('uv-fortificado');
    unverifiedFortificado.tipo = 'fortificado';
    unverifiedFortificado.provenance = { tipo: 'ai-unverified' };
    assert.equal(passportProgress([unverifiedFortificado]).milestones.find((m) => m.id === 'estilo.fortificado')?.earned, false);

    const unverifiedHarmonizacao = createEntry('uv-harm');
    unverifiedHarmonizacao.conclusao.harmonizacao = 'Carne assada';
    unverifiedHarmonizacao.provenance = { 'conclusao.harmonizacao': 'ai-unverified' };
    assert.equal(passportProgress([unverifiedHarmonizacao]).milestones.find((m) => m.id === 'harmonizacao.1')?.earned, false);

    const unverifiedNota = createEntry('uv-nota');
    unverifiedNota.conclusao.avaliacaoEstrelas = 5;
    unverifiedNota.provenance = { 'conclusao.avaliacaoEstrelas': 'ai-unverified' };
    assert.equal(passportProgress([unverifiedNota]).milestones.find((m) => m.id === 'critica.primeira-nota')?.earned, false);
    assert.equal(passportProgress([unverifiedNota]).milestones.find((m) => m.id === 'critica.cinco')?.earned, false);

    const unverifiedAsi = createEntry('uv-asi');
    unverifiedAsi.conclusao.asiQuality = 'good';
    unverifiedAsi.provenance = { 'conclusao.asiQuality': 'ai-unverified' };
    assert.equal(passportProgress([unverifiedAsi]).milestones.find((m) => m.id === 'critica.asi-1')?.earned, false);
  });

  it('separa exemplos de fichas pessoais pelo kind e pela marca antiga', () => {
    const demos = getDemoWines();
    const demoWithoutFlag = { ...demos[0], _demo: undefined };
    const flagged = { ...demos[1], kind: 'legacy' as const, evidence: { ...demos[1].evidence, revisitedAt: 123 } };
    const personal = createEntry('personal');
    personal.conclusao.impressaoFinal = 'Minha anotação.';

    const progress = passportProgress([demoWithoutFlag, flagged, personal]);
    // Apenas a ficha pessoal conta no modo 'mine'
    assert.equal(progress.earnedCount, 1);
    assert.equal(progress.milestones.find((m) => m.id === 'legado.first')?.earned, true);
    assert.equal(progress.countries.size, 0);

    // No modo 'demo', apenas as fichas demo contam (5 selos: first, vocabulary, origin, primeira-nota, cinco)
    const preview = passportProgress([...demos, personal], 'demo');
    assert.equal(preview.earnedCount, 5);
    assert.deepEqual([...preview.countries.keys()], ['PT', 'AR', 'FR', 'BR']);
    assert.equal(preview.milestones.find((m) => m.id === 'critica.primeira-nota')?.earned, true);
    assert.equal(preview.milestones.find((m) => m.id === 'critica.cinco')?.earned, true);
    assert.equal(passportProgress([personal], 'demo').earnedCount, 0);
  });

  it('remoção e alteração de fichas recalculam as conquistas sem persistência paralela', () => {
    const entry = createEntry('edit-test');
    entry.tipo = 'espumante';
    entry.conclusao.avaliacaoEstrelas = 5;

    const initial = passportProgress([entry]);
    assert.equal(initial.milestones.find((m) => m.id === 'estilo.primeiro-espumante')?.earned, true);
    assert.equal(initial.milestones.find((m) => m.id === 'critica.cinco')?.earned, true);
    assert.equal(initial.earnedCount, 3); // espumante, primeira-nota, cinco

    // Modifica a ficha removendo os campos
    const edited = {
      ...entry,
      tipo: 'tranquilo' as const,
      conclusao: { ...entry.conclusao, avaliacaoEstrelas: null },
    };
    const afterEdit = passportProgress([edited]);
    assert.equal(afterEdit.earnedCount, 0);

    // Remove a ficha
    const afterDelete = passportProgress([]);
    assert.equal(afterDelete.earnedCount, 0);
  });

  it('libera todos os onze selos quando todas as condições são satisfeitas', () => {
    const e1 = createEntry('e1');
    e1.conclusao.impressaoFinal = 'Excelente vinho.';
    e1.aromaTags = ['Amora', 'Baunilha'];
    e1.evidence.revisitedAt = 999;
    e1.origin.countryCode = 'PT';
    e1.tipo = 'espumante';
    e1.conclusao.harmonizacao = 'Frutos do mar';
    e1.conclusao.avaliacaoEstrelas = 5;
    e1.conclusao.asiQuality = 'very-good';

    const e2 = createEntry('e2');
    e2.estilo = 'branco';
    e2.skinContact = true;

    const e3 = createEntry('e3');
    e3.tipo = 'fortificado';

    const progress = passportProgress([e1, e2, e3]);
    assert.equal(progress.earnedCount, 11);
    assert.equal(progress.milestones.every((m) => m.earned), true);
  });

  it('cada conquista aponta para um selo WebP existente no pacote integrado de 320 px', () => {
    assert.equal(PASSPORT_MILESTONES.length, 11);
    for (const milestone of PASSPORT_MILESTONES) {
      const stampUrl = new URL(`../../public/assets/winefolio/stamps/${milestone.id}.webp`, import.meta.url);
      assert.ok(existsSync(stampUrl), `Arquivo ausente: ${milestone.id}.webp`);
      const stat = statSync(stampUrl);
      assert.ok(stat.size > 0, `Arquivo vazio: ${milestone.id}.webp`);
    }
  });
});
